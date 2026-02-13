# Aro Inspect

Design system diagnostic module for Aro Studio. Inspect answers **“What do we actually have?”** by scanning your design system across Figma, code tokens, and Storybook, then producing a unified inventory and health report.

## What it does

- **Read-only.** Inspect observes and reports. It never modifies Figma files, token files, or Storybook. All output is snapshot-based and stored per run for comparison over time.
- **Three surfaces.** It treats the design system as:
  - **Figma** — Variables, Styles, and component metadata.
  - **Code** — Token files (DTCG, Style Dictionary, Tokens Studio) and component presence via Storybook.
  - **Storybook** — Component metadata from index/stories.
- **Output per run.** Token inventory, component inventory, cross-referenced findings, and a health score (0–100) with sub-scores and severity counts. Report and optional exports (CSV, Markdown, PDF) are written as run artifacts.

**Intended for:** Design system leads (inventory and health reporting), frontend engineers (token parity and naming drift), and managers (dashboard-level health).

## Status

In progress. Core scan pipeline (Figma, code tokens, Storybook), analysis, health score, and UI (Setup, Logs, Report with Health / Token / Component tabs, export) are implemented. Some spec items (e.g. Test Connection per source, trend sparkline, table sort/filter) may follow.

## Package layout

| Path | Contents |
|------|----------|
| `src/` | Job registration (`init`), scan and export jobs, scanners (Figma, code tokens, Storybook), analysis (cross-reference, findings, health score). |
| `src/schemas.ts` | Zod schemas for runtime boundary validation: `ScanInputSchema`, `ExportInputSchema`, `InspectReportSchema`, `FigmaVariablesResponseSchema`, `StorybookIndexSchema`, and `isPathSafe()` path traversal guard. |
| `src/ui/` | Setup / Run / Report views and report tabs (Health Dashboard, Token Inventory, Component Inventory). Uses shadcn Tooltip, Progress, and Separator components from `@aro/desktop/components` for professional UX (score visualization, scan progress, truncated content tooltips, section separators). White-label: zinc-only palette; red limited to destructive states. |
| `src/ui/store.ts` | Zustand store (`useInspectStore`) — single source of truth for all shared UI state (workspace, config, runs, logs, report, navigation). Components subscribe to individual slices for selective re-rendering. Side-effect subscriptions (workspace changes, log streaming, run polling with backoff) are initialized via `initInspectSubscriptions()` in the root `Inspect` component. Logs are capped at 1,000 entries (ring buffer). |
| `src/ui/components/ErrorBoundary.tsx` | Module-level React error boundary. Wraps the inspect tree; catches render errors and displays a recoverable panel with "Try again" instead of crashing the app. |
| `src/ui/aro.d.ts` | TypeScript declarations for the `window.aro` preload API. Mirrors the desktop `AroPreloadAPI` so the module type-checks independently. |

## Docs

- [Design spec](../../../docs/modules/inspect/Design-spec.md) — Purpose, UX, views, and interaction rules.
- [Implementation spec](../../../docs/modules/inspect/Implementation-spec.md) — Jobs, scanners, artifacts, and module boundaries.
- [UI acceptance criteria](../../../docs/modules/inspect/UI_ACCEPTANCE_CRITERIA.md) — View-level criteria and accessibility checklist.

## How to run

Set the active module to inspect (e.g. in project root `.env`):

```bash
ARO_ACTIVE_MODULE=inspect
```

Then run the Desktop or Web app (`pnpm desktop` or `pnpm web`). Use **Setup** to configure sources and run a scan, **Logs** to watch runs and stream output, and **Report** to view the health dashboard and token/component inventories and export CSV, Markdown, or PDF.
