# Aro Inspect — Design Spec

Design intent and UX contract for the **inspect** module. Authoritative for product and UX; implementation is defined in [Implementation-spec.md](Implementation-spec.md).

---

## 1. Module purpose and mental model

**Purpose:** Aro Inspect is the diagnostic module for Aro Studio. It answers the question “What do we actually have?” by scanning a design system across its constituent surfaces and producing a current, real inventory and a unified health report.

**Mental model:** Design system X-ray. Inspect is **read-only**: it observes and reports. It never modifies source files (Figma, code, or Storybook). All output is snapshot-based and persisted per run for comparison over time.

---

## 2. User goals by persona

| Persona | Goal |
|--------|------|
| **Design Technologist / Design System Lead** (primary) | Reliable inventory to prioritize deprecations, justify budget, and report system health to leadership; replace manual exports, grep, and spreadsheets. |
| **Senior Frontend Engineer** (secondary) | Know which tokens are canonical, which components have code parity, and where naming drift exists between Figma and code. |
| **Design / Engineering Manager** (tertiary) | Dashboard-level view of system health, adoption coverage, and confidence signals for quarterly reviews. |

---

## 3. Surface inventory model

Inspect treats the design system as three **surfaces**:

- **Figma** — Variables (collections, modes), Styles (color, text, effect, grid), and published component metadata.
- **Code** — Token files (W3C DTCG v1, Style Dictionary, Tokens Studio) and, for components, presence inferred from Storybook/code paths where applicable.
- **Storybook** — Component metadata from index/stories (story IDs, titles, argTypes).

The **inventory** produced per run consists of:

- **Tokens** — Name, type, value(s), source(s), and flags (duplicate, dead, inconsistent naming, value drift).
- **Components** — Name, presence per surface (Figma, Storybook, code), coverage status, and orphan/orphan flags.
- **Health** — A composite score (0–100) with sub-scores (token consistency, component coverage, naming alignment, value parity) and finding counts by severity.

---

## 4. UI views and states

### 4.1 Views

| View | Purpose |
|------|---------|
| **Setup** | Current workspace path; source configuration for Figma, Code, and Storybook. Each source has status (configured / not configured / error), connection details, and “Test Connection.” “Run Inspect” is disabled until at least one source is configured. |
| **Run** | Active during and after a scan: live streaming logs, progress indicator, abort button. On completion, auto-navigate to Report. Previous runs accessible from a list. |
| **Report** | Three tabs: Health Dashboard, Token Inventory, Component Inventory. Data is read from the selected run’s artifacts. |

### 4.2 States

- **No workspace** — Workspace selector prominent; no sources configurable.
- **Workspace set, no sources** — Setup view; “Run Inspect” disabled; message guiding user to configure at least one source.
- **At least one source configured** — “Run Inspect” enabled.
- **Scan running** — Run view; live logs; progress; abort available.
- **Scan completed (success or cancelled)** — Run view shows final status; auto-navigate to Report for success; Report shows data from that run.
- **Report loaded** — Health Dashboard, Token Inventory, Component Inventory populated from artifact data; tables sortable and filterable.

---

## 5. Information architecture

| Location | Data shown |
|----------|------------|
| **Setup** | Workspace path; per-source card: Figma (file key(s), connection status), Code (path(s), format/auto), Storybook (URL or path to index); Test Connection result. |
| **Run** | Run list (previous runs); for selected/active run: log stream, progress, abort; run status (running / success / error / cancelled). |
| **Report — Health Dashboard** | Composite score (0–100); sub-score breakdown (token consistency, component coverage, naming alignment, value parity); finding counts by severity (critical, warning, info); trend sparkline (current vs up to 10 previous runs when available). |
| **Report — Token Inventory** | Table: token name, value, type, source(s), flags (duplicate, dead, inconsistent, value drift). |
| **Report — Component Inventory** | Table: component name, props/variants, surfaces present (Figma, code, Storybook), coverage status, orphan flag. |

All report data is read from artifacts of the chosen run; no live mutation of sources.

---

## 6. Interaction rules

- **Read-only** — No actions that modify Figma files, code token files, or Storybook. Inspect only reads and reports.
- **Cancellable scan** — The user may abort a running scan; the run ends with status “cancelled,” partial results may be written, and the UI reflects cancellation.
- **Snapshot-based** — Each run produces a snapshot (artifacts). Historical comparison is done by comparing artifacts from different runs (e.g. trend sparkline from previous runs).
- **Export** — User may export the report as JSON (or other documented formats) from the artifacts panel for sharing or downstream use.

---

## 7. Accessibility and usability constraints

- **Keyboard** — All interactive elements keyboard navigable; focus order and Enter/Space/Escape per [UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md).
- **Tables** — Semantic `<table>` markup with proper headers; sortable headers; keyboard-navigable.
- **Scores and charts** — Text alternatives for score visualizations; composite and sub-scores available as text.
- **Severity** — Color-coded severity (critical, warning, info) must not rely on color alone; use icons or labels in addition.
- **Focus** — Visible focus indicators; focus management consistent with Desktop shell (no trap except in modal/dialog with clear exit).
- **Design system** — UI uses shared design system (@aro/desktop/components, shadcn + Tailwind). Minimum window width 900px; sidebar + main content; tables use horizontal scroll when needed.

---

## 8. Explicit non-goals

Inspect **does not**:

- Modify or fix detected issues (read-only; no remediation).
- Provide real-time or continuous monitoring (on-demand scan only).
- Perform visual regression testing or screenshot comparison.
- Depend on Figma Library Analytics API beyond basic component metadata (Enterprise-only features out of scope for v1).
- Perform design-to-code visual parity (pixel-level) comparison.
- Provide multi-user collaboration or shared workspaces.
- Transmit data off the machine except to the Figma REST API when the user runs a scan with Figma configured.

---

## 9. Release slices

Functionality is delivered in shippable slices. Dependencies between slices are respected.

| Slice | Scope | Dependency |
|-------|--------|-------------|
| **P0 — Token inventory (core)** | Parse W3C DTCG v1 and Style Dictionary token files; parse Figma Variables and Styles via API; normalize to token list; detect duplicates, value drift, naming inconsistencies; categorize by type; persist token inventory artifact. | — |
| **P0 — Component inventory (core)** | Extract Figma component metadata; extract Storybook index component metadata; cross-reference by name (exact then fuzzy); coverage matrix and orphan flags; persist component inventory artifact. | — |
| **P0 — Health score and report** | Compute composite health score (0–100) and sub-scores; severity levels for findings; persist full report JSON; Health Dashboard, Token Inventory, and Component Inventory tabs with sort/filter; export report as JSON. | P0 Token + P0 Component |
| **P0 — Setup and run UX** | Setup view (workspace, source config, Test Connection, Run disabled until ≥1 source); Run view (logs, progress, abort); run list; navigation to Report on completion. | — |
| **P1 — Token extensions** | Tokens Studio format; dead token detection; multi-mode/multi-theme reporting; configurable naming/drift thresholds. | P0 Token |
| **P1 — Component and report extensions** | Variant/prop parity (Figma vs Storybook argTypes); trend sparkline (current vs previous runs). | P0 Health, P0 Component |
| **P2 — Optional** | CSS/SCSS custom properties as supplementary token source; Figma Library Analytics (Enterprise) detachment signals where available. | P1 |

Each slice is independently testable and releasable; P0 slices may be shipped first with a minimal report, then P1/P2 added.
