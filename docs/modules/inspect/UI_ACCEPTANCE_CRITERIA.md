# Inspect module — UI acceptance criteria and a11y checklist

View-level acceptance criteria and accessibility checklist for the Inspect UI. Implementation follows [Design-spec.md](Design-spec.md) and [../../meta/UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md).

---

## View-level acceptance criteria

### Setup view

- Workspace path is shown; user can change it via Desktop workspace selector.
- Per-source cards: Figma (file key(s), connection status), Code (path(s), format), Storybook (URL or path to index).
- "Test Connection" per source shows result (success/error); errors shown with `role="alert"` or equivalent.
- "Run Inspect" is disabled until at least one source is configured; when enabled, running a scan is the primary action.
- States: no workspace (workspace selector prominent); workspace set with no sources (guidance to configure ≥1 source); at least one source configured (Run enabled).

### Run view

- Run list shows previous runs (newest first); user can select a run.
- For the selected or active run: live log stream (via `logs.subscribe`), progress indicator (when Desktop exposes progress), abort button.
- Run status is visible (running / success / error / cancelled).
- On scan success, UI auto-navigates to Report view with the completed run’s data.

### Report view

- Three tabs: Health Dashboard, Token Inventory, Component Inventory.
- Data is read from `artifacts.read(runId, 'report.json')` for the chosen run.
- **Health Dashboard:** Composite score (0–100) and sub-scores (token consistency, component coverage, naming alignment, value parity); finding counts by severity (critical, warning, info). All scores available as text (not only visual).
- **Token Inventory:** Table with columns: token name, value, type, source(s), flags. Sortable and filterable.
- **Component Inventory:** Table with columns: component name, surfaces present, coverage status, orphan flag. Sortable and filterable.
- "Export report" allows exporting as JSON/CSV/markdown (via `inspect:export` or reading artifact).

---

## Accessibility checklist (inspect UI)

- **Keyboard:** All interactive elements (buttons, tabs, table controls, links) are focusable and activatable with Enter/Space; Escape dismisses or exits where applicable. Focus order follows visual order.
- **Tables:** Use semantic `<table>` with `<thead>`, `<th>`, `<tbody>`, `<td>`. Headers have proper scope; sortable column headers are buttons or links with clear labels (e.g. "Sort by name"). Table is keyboard-navigable (tab through cells or row actions as designed).
- **Scores and charts:** Composite and sub-scores have text alternatives (e.g. "Health score: 85 out of 100"); no information conveyed only by color or shape.
- **Severity (critical, warning, info):** Do not rely on color alone. Use icons and/or text labels in addition to color (e.g. "Critical", "Warning", "Info" label or icon with `aria-label`).
- **Focus:** Visible focus indicators on all focusable elements; focus management consistent with Desktop shell; no focus trap except in modal/dialog with a clear exit (e.g. Escape, explicit Close).
- **Design system:** Use `@aro/desktop/components` (shadcn + Tailwind); minimum window width 900px; sidebar + main content; tables use horizontal scroll when needed.
- **Errors and loading:** Loading states and errors are announced (e.g. `role="alert"` for errors, `aria-busy` or visible loading text where appropriate).

---

## References

- [Design-spec.md](Design-spec.md) — views, states, IA
- [Implementation-spec.md](Implementation-spec.md) — job contract, artifacts
- [../../meta/UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md) — project-wide a11y standards
