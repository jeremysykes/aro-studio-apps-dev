# Aro Inspect — Implementation Spec

Technical execution contract for the **inspect** module. Authoritative for job definitions, scanners, analysis, artifacts, and renderer contract. Design intent is in [Design-spec.md](Design-spec.md).

---

## 1. Module boundaries and dependencies

- **Package:** `packages/modules/inspect/`
- **Module key:** `inspect`
- **Dependency direction:** Per [ARCHITECTURE.md](../../ARCHITECTURE.md) and [MODULE_CONSTRAINTS.md](../MODULE_CONSTRAINTS.md):
  - May import Core types only (e.g. `JobContext`, `JobDefinition`, `AroCore`) for job registration in init.
  - May import `@aro/desktop/components` for shared UI (Button, Card, Table, Tabs, Badge, Skeleton, Input, Textarea, Alert, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, Progress, Separator).
  - Must not import other modules, `better-sqlite3`, Core internals, or use `fs`/`path` for domain data; all file access in jobs via `ctx.workspace`.
  - Renderer uses only `window.aro`; no Core handles in renderer.

---

## 2. Job definitions and execution flow

### 2.1 Registered jobs

| Job key | Purpose | Cancellable |
|---------|---------|-------------|
| `inspect:scan` | Scan configured sources (Figma, code tokens, Storybook), cross-reference, compute health score, write report artifacts. | Yes (`ctx.abort`) |
| `inspect:export` | Read existing report artifact for a run and export as CSV or markdown. | Yes |

Init runs in main process; Desktop passes Core (or facade) into module `init`; module calls `core.jobs.register({ key, run })` for each job.

### 2.2 inspect:scan

- **Trigger:** `window.aro.job.run('inspect:scan', input)` with `ScanInput`.
- **Input validation:** Input is validated at the boundary with Zod (`ScanInputSchema.safeParse`). Invalid input logs a warning and falls back to defaults; malformed fields are rejected rather than silently accepted.
- **Input schema:** Figma (fileKeys, pat), codeTokens (paths?, inline?, format?), storybook (indexUrl or indexPath), options (namingStrategy, colorDistanceTolerance, fuzzyThreshold). codeTokens.paths: file paths relative to workspace. codeTokens.inline: raw DTCG or Style Dictionary JSON. codeTokens.format: optional override ('dtcg' | 'style-dictionary' | 'tokens-studio').
- **Context usage:** `ctx.logger` for phase/findings/errors; `ctx.workspace` for config and token file reads and config write; `ctx.artifactWriter` for report.json, tokens.json, components.json; `ctx.abort` checked before each phase and propagated to scanners; `ctx.progress` at 0, 0.5, 0.75, 1.0.
- **Execution order:** Read config from workspace or input → Phase 1+3 Figma and Storybook in parallel (both network I/O, via `Promise.all`) → Phase 2 Code tokens (synchronous file reads) → Phase 4 Analysis → Phase 5 Write artifacts. On abort, write partial results with `incomplete: true`.
- **Config persistence:** At end of successful scan, non-sensitive config (file keys, code paths, storybook URLs) is persisted to `inspect-config.json` in the workspace (best-effort; PATs are never persisted). On next scan, workspace config is merged with input, with input taking precedence.

### 2.3 inspect:export

- **Trigger:** `window.aro.job.run('inspect:export', { runId, format })` with format `'csv' | 'markdown' | 'pdf'`.
- **Input validation:** Input is validated with Zod (`ExportInputSchema.safeParse`). Invalid input logs a warning and returns early.
- **Context:** Reads artifact via workspace (run artifact path); writes export artifact for same run.
- **Export completeness:** All tokens and components are exported without truncation. No row limits are applied.
- **Cancellable:** Yes; expected duration under 5 seconds.

---

## 3. Scanner responsibilities

### 3.1 Figma scanner

- **Endpoints:** Variables (Tier 2), file/components (Tier 1) for styles and component metadata.
- **Behavior:** Sequential requests per file key; exponential backoff with jitter on 429 (e.g. 1s initial, 30s max, 5 retries). Cache responses in workspace (e.g. `.figma-cache/`) with 15-minute TTL.
- **Abort signal:** The abort signal is checked between each API call (`checkAbort()`) and passed directly to `fetch({ signal })` so that in-flight network requests are cancelled immediately when the user aborts a scan.
- **Output:** Normalized `Token[]` (from Variables and Styles) and component metadata; canonical name as collection/variable in dot notation; RGBA → hex for color; mode-specific values in `Token.modes`.

### 3.2 Code token scanner

- **Input:** Paths relative to workspace (or inline JSON via input); all reads via `ctx.workspace.readText(path)` or inline content.
- **Path validation:** Every file path is validated with `isPathSafe()` before access: rejects absolute paths, `..` traversal, and null bytes. Unsafe paths are logged as warnings and skipped.
- **Logging:** Accepts an optional logger; logs per-file results (tokens found, format detected), missing files, unsafe paths, and read failures.
- **Format detection:** DTCG detection checks for nested `$value` or `$type` anywhere in the tree (root object need not have them; e.g. `{ "color": { "brand": { "primary": { "$value": "#2563EB" } } } }` is DTCG). `.tokens`/`.tokens.json` with `$type`/`$value` → DTCG v1; `$themes`/`$metadata` → Tokens Studio; else Style Dictionary. Overridable via input.
- **Parsing:** DTCG v1: `$type`, `$value`, `$description`, alias resolution, group hierarchy → canonical name. Style Dictionary: CTI naming, value/type at leaf. Tokens Studio: themes/metadata structure.
- **Output:** Normalized `Token[]` with source set to code-dtcg | code-style-dictionary | code-tokens-studio.

### 3.3 Storybook scanner

- **Input:** Either `indexUrl` (HTTP GET) or `indexPath` (workspace path); read via fetch or `ctx.workspace.readText`.
- **Format:** Prefer index.json (Storybook 7+); fallback stories.json for v6. Group by component title; strip hierarchy (e.g. Components/Button → Button); extract argTypes from parameters.
- **Output:** Normalized `Component[]` with storybook surface (storyIds, argTypes).

---

## 4. Normalization rules

- **Token names:** Separators normalized to dot notation; comparison uses exact, fuzzy (Levenshtein above threshold), or prefix-strip per input options.
- **Token types:** Map Figma resolvedType and DTCG `$type` to canonical set: color, spacing, typography, borderRadius, shadow, motion, opacity, other.
- **Color comparison:** CIE2000 Delta-E with configurable tolerance (default 3.0) for duplicate/drift.
- **Component names:** Exact match first; then fuzzy with configurable threshold (default 0.8) for cross-surface matching.

---

## 5. Cross-reference and analysis

- **Cross-reference:** Match tokens and components across surfaces using configured naming strategy (exact / fuzzy / prefix-strip). Produce pairs and orphans.
- **Findings:** Generate `Finding[]`: token-duplicate, token-dead, token-drift, token-naming, component-orphan, component-parity. Severity per matrix: token-drift → critical; token-duplicate, token-dead, token-naming, component-orphan → warning; component-parity → info.
- **Single-source scans:** Only applicable sub-scores computed; weights redistributed proportionally.

---

## 6. Health score computation

- **Sub-scores (0–100 each):** Token consistency (100 − (duplicates + drift)/total * 100, floor 0), Component coverage (components in 2+ surfaces / total * 100), Naming alignment (unique token names appearing in ≥ 2 sources / total unique token names * 100), Value parity (cross-source names with identical values / cross-source names * 100; Delta-E for colors).
- **Weights:** Token consistency 30%, Component coverage 30%, Naming alignment 20%, Value parity 20%.
- **Composite:** Weighted sum of applicable sub-scores, 0–100.
- **Not-applicable sub-scores:** A sub-score is stored as −1 when no data exists to measure it: Token consistency (no tokens), Component coverage (no components), Naming alignment (no token names in ≥ 2 sources), Value parity (no cross-source token names). Weights are redistributed proportionally among applicable scores. If no sub-scores apply, the composite defaults to 100. The UI renders −1 as "N/A" with a muted placeholder bar instead of a Progress bar.

---

## 7. Artifact schemas and persistence

- **Location:** All artifacts under `.aro/artifacts/<runId>/` via `ctx.artifactWriter`.
- **Artifacts produced by inspect:scan:** `report.json` (full InspectReport), optionally `tokens.json`, `components.json` (if useful for UI or export).
- **InspectReport schema:** version, timestamp, sourcesScanned, tokens[], components[], findings[], healthScore (composite, tokenConsistency, componentCoverage, namingAlignment, valueParity), summary (totalTokens, totalComponents, findingsBySeverity), optional incomplete.
- **Token:** name, type, value, rawValue?, source, collection?, modes?, description?, filePath?.
- **Component:** name, surfaces (figma?, storybook?, code?), coverage[], isOrphan.
- **Finding:** id, severity, category, title, details, affectedTokens?, affectedComponents?, sources[].
- **Config persistence:** Non-sensitive configuration (file keys, code token paths, storybook URLs) is persisted to `inspect-config.json` in the workspace at the end of each successful scan. PATs are never persisted to the config file; they are only stored in `.env` and passed at runtime. Config persistence is best-effort (failures are silently ignored).
- **Validation schemas:** All external data structures (ScanInput, ExportInput, InspectReport, Figma API responses, Storybook index) have corresponding Zod schemas in `src/schemas.ts` for runtime boundary validation.
- **Finding IDs:** Finding IDs are deterministic per scan (counter resets to 1 for each `generateFindings()` call) via a per-call ID generator. Module-scoped counters are not used.

---

## 8. Renderer–job interaction contract

- **Data flow:** UI triggers `job.run('inspect:scan', input)` or `job.run('inspect:export', { runId, format })`; lists runs via `runs.list()`; streams logs via `logs.subscribe(runId, callback)`; reads report via `artifacts.read(runId, 'report.json')`. No custom IPC; no Core in renderer.
- **Workspace:** `workspace.select()`, `workspace.getCurrent()`; subscribe to `workspace:changed`.
- **Cancel:** `job.cancel(runId)`.
- **Export (UI):** Either re-use artifact JSON or call `inspect:export` and then `artifacts.read(runId, exportPath)` for download.
- **State management:** All shared renderer state is managed via a Zustand store (`src/ui/store.ts`). Components consume only the slices they need via `useInspectStore(selector)`. Side effects (workspace subscription, log streaming, run polling, report fetching) are managed through `initInspectSubscriptions()`, called once from the root `Inspect` component. Local-only UI state (table sort, filter text) remains as component-level `useState`.
- **Log ring buffer:** The logs array is capped at 1,000 entries (most recent). Older entries are discarded on initial load and on each subscription push to prevent unbounded memory growth during long-running scans.
- **Polling backoff:** Run status polling starts at 2 seconds when a scan is running. If no run status changes are detected between polls, the interval backs off by 1.5× up to a 10-second maximum. When changes are detected, the interval resets to 2 seconds. Polling stops when no run is active.
- **Error boundary:** The inspect component tree is wrapped in `InspectErrorBoundary` (a React error boundary in `src/ui/components/ErrorBoundary.tsx`). On render errors, it displays a recoverable error panel with a "Try again" button instead of crashing the entire application.
- **Type definitions:** `window.aro` API types are declared in `src/ui/aro.d.ts` so the inspect module type-checks independently of the desktop app's `preload.d.ts`. These types mirror the `AroPreloadAPI` interface from the desktop preload.
- **Design system components:** The UI uses Tooltip (truncated paths and run IDs), Progress (health score bars, scan progress indicator), and Separator (visual section breaks). The root `Inspect` component wraps content in `<TooltipProvider>`. All UI is white-label: zinc-only palette with red limited to destructive states; no brand-specific colors.
- **Health Dashboard:** Two-column layout per Design-spec §9.4. Left: composite score (bold number + text label: "Good"/"Fair"/"Needs attention") with Progress bar and summary stats. Right: sub-score breakdown with Progress bars per metric + findings-by-severity section with inline SVG icons and Badge components (destructive for critical, secondary for warning, secondary for info). Sub-scores that are not applicable (−1) render as "N/A" with a muted placeholder bar and an explanatory note.

---

## 9. Performance, security, and cancellation

- **Cancellation:** Scan checks `ctx.abort` before each phase; on signal, stop and write partial report with `incomplete: true`. The Figma scanner propagates the abort signal to `fetch()` calls (via `signal` option) and checks `checkAbort()` between each API endpoint, so in-flight network requests are cancelled immediately. Export job also respects abort.
- **Performance:** Target &lt; 60s for ~500 tokens and ~100 components on standard broadband; Figma API is the expected bottleneck; caching and backoff reduce repeat latency.
- **Security:** Figma PAT only in workspace config; only sent to Figma REST API. No telemetry. No raw PAT in logs (masked).
- **Reliability:** 429 and transient errors logged as warnings; scan continues with remaining sources where possible; partial report allowed.

---

## 10. Implementation slices

| Slice | Deliverables | Dependency |
|-------|--------------|------------|
| **P0 — Token pipeline** | Code token scanner (DTCG v1, Style Dictionary); Figma scanner (Variables, Styles); normalization; duplicate, drift, naming findings; token artifact. | — |
| **P0 — Component pipeline** | Figma component metadata; Storybook scanner (index.json / stories.json); name matching (exact + fuzzy); coverage and orphan flags; component artifact. | — |
| **P0 — Analysis and health** | Cross-reference; finding generator; health score calculator; report.json schema and write. | P0 Token, P0 Component |
| **P0 — Scan job** | inspect:scan full flow (config read, 5 phases, artifact write); progress and abort handling. | P0 Analysis |
| **P0 — Export job** | inspect:export: read report artifact, output CSV or markdown. | P0 Analysis |
| **P0 — UI contract** | Setup/Run/Report views consume only window.aro; read report from artifacts.read(runId, 'report.json'). | — |
| **P1 — Token extensions** | Tokens Studio parser; dead token detection; multi-mode in Token; configurable thresholds in ScanInput. | P0 Token |
| **P1 — Component/report extensions** | Variant/prop parity in findings; trend data (previous runs) for sparkline. | P0 Analysis |
| **P2** | CSS/SCSS custom properties parser; Figma Library Analytics (Enterprise) if available. | P1 |

Slices are independently testable; each job and scanner can be unit/integration tested with fixtures. P0 must not depend on P1/P2.
