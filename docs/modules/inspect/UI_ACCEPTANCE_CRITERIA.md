# Inspect module — UI acceptance criteria and a11y checklist

View-level acceptance criteria and accessibility checklist for the Inspect UI. Implementation follows [Design-spec.md](Design-spec.md) and [../../meta/UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md).

---

## View-level acceptance criteria

### Setup view

- Workspace path is shown; user can change it via Desktop workspace selector. Path shown with `Tooltip` for full path on hover.
- **Spacing:** When no source is configured, there is a visible 16px gap between the helper text ("Configure at least one source…") and the three-column source card layout. See [Design-spec.md §8.1](Design-spec.md#81-setup-tab--helper-text-to-source-cards).
- Per-source cards: Figma (file key(s), connection status), Code (path(s), format), Storybook (URL or path to index). Each card header shows a `Badge variant="secondary"` status indicator ("✓ Configured" or "Not configured" text).
- "Test Connection" per source shows result (success/error); errors shown with `role="alert"` or equivalent.
- "Run Inspect" is the primary action (`Button variant="default" size="sm"`), disabled until at least one source is configured. A `Separator` divides source cards from the run action area. When ≥1 source configured, summary text ("Will scan: Figma, Code tokens") appears beside the button.
- States: no workspace (workspace selector prominent); workspace set with no sources (guidance to configure ≥1 source); at least one source configured (Run enabled).

### Run view

- Run list shows previous runs (newest first); user can select a run. Status shown with design system `Badge` (default=success, destructive=error, secondary=running, outline=cancelled). Truncated run IDs show full ID on `Tooltip` hover.
- For the selected or active run: live log stream (via `logs.subscribe`), indeterminate `Progress` bar when scan is running, abort button.
- **Styled logs:** Log entries are styled by level using zinc scale + icons (error: `✖` zinc-900 bold, warn: `⚠` zinc-700, info: `ℹ` zinc-600, debug: `•` zinc-400). Log pane shows entry count and elapsed time. Auto-scrolls to bottom on new entries.
- Run status is visible (running / success / error / cancelled).
- On scan success, UI auto-navigates to Report view with the completed run's data.

### Report view

- **Reports header** — Reports title and tabs are visually distinct from dashboard content (reduced weight, separator below); tabs read as navigation (active clearly indicated, inactive outline/ghost).
- Three tabs: Health Dashboard, Token Inventory, Component Inventory.
- Data is read from `artifacts.read(runId, 'report.json')` for the chosen run.
- **Health Dashboard:** Health score is the primary focal element (single hero number, left column); score breakdown and findings-by-severity form one supporting panel (right column). At 900px+, the top of the health-score block and the top of the score-breakdown block align (content top alignment). Composite score (0–100) with text label ("Good"/"Fair"/"Needs attention") and zinc `Progress` bar; sub-scores (token consistency, component coverage, naming alignment, value parity) each with `Progress` bar and weight label. Summary stats (tokens · components · findings) below score. **Not-applicable sub-scores (−1):** displayed as "N/A" in muted zinc-400 text, with a muted zinc-100 placeholder bar replacing the Progress bar, and label text dimmed. A brief explanatory note appears below the breakdown when any sub-score is N/A. **Findings-by-severity section** with `Separator` above, using `Badge` components: critical (destructive + octagon icon), warning (secondary + triangle icon), info (secondary + circle-i icon). All scores available as text (not only visual). Severity badges are consistent and system-driven, and visually secondary to the score and breakdown.
- **Token Inventory:** Table with columns: token name, value (with color swatch for hex/rgb values), type, source(s), flags. Sortable and filterable. Row count bar shows total or filtered count. Empty state shown when filter returns no results.
- **Component Inventory:** Table with columns: component name, surfaces present (zinc coverage dots with `Tooltip`), coverage status, orphan flag (`Badge variant="default"` for orphans, `Badge variant="secondary"` for non-orphans). Sortable and filterable. Row count and empty state as above.
- **Export actions** — Anchored in card footer, right-aligned; secondary styling (outline/ghost). Shown on **all report tabs** (not health-only). "Export report" allows exporting as CSV, Markdown, or PDF (via `inspect:export`). All tokens and components are exported without truncation.

---

## Accessibility checklist (inspect UI)

- **Keyboard:** All interactive elements (buttons, tabs, table controls, links) are focusable and activatable with Enter/Space; Escape dismisses or exits where applicable. Focus order follows visual order.
- **Tables:** Use semantic `<table>` with `<thead>`, `<th>`, `<tbody>`, `<td>`. Headers have proper scope; sortable column headers are buttons or links with clear labels (e.g. "Sort by name"). Table is keyboard-navigable (tab through cells or row actions as designed).
- **Scores and charts:** Composite and sub-scores have text alternatives (e.g. "Health score: 85 out of 100"); no information conveyed only by color or shape.
- **Severity (critical, warning, info):** Do not rely on color alone. Use icons and/or text labels in addition to color (e.g. "Critical", "Warning", "Info" label or icon with `aria-label`).
- **Focus:** Visible focus indicators on all focusable elements; focus management consistent with Desktop shell; no focus trap except in modal/dialog with a clear exit (e.g. Escape, explicit Close).
- **Design system:** Use `@aro/desktop/components` (shadcn + Tailwind); minimum window width 900px; sidebar + main content; tables use horizontal scroll when needed.
- **Errors and loading:** Loading states and errors are announced (e.g. `role="alert"` for errors, `aria-busy` or visible loading text where appropriate).
- **Error boundary:** The inspect component tree is wrapped in a React error boundary (`InspectErrorBoundary`). On uncaught render errors, a recoverable error panel is displayed with `role="alert"` and a "Try again" button. The user is never left with a blank screen from a crash in the inspect UI.

---

## Professional polish

- **Empty states:** Every list or content area without data shows clear, actionable guidance (e.g. "Select a run from the list to view its report").
- **Loading:** Use design system Skeleton or visible loading text; avoid blank or flickering content.
- **Errors:** Use design system Alert (destructive variant) for error display; no custom styled divs.
- **Forms:** Use design system Input and Textarea; labels associated via `htmlFor`/`id`.
- **Typography and spacing:** Consistent headings; 16px gaps per design tokens; no cramped layouts.
- **White-label compliance:** All UI uses the zinc-only palette. No brand-specific colors (no green, amber, blue semantic colours). Red is used only for destructive/error states (Badge `destructive`, Button `destructive`, Alert `destructive`). Color swatches in token tables display user-owned token values only. Semantic status communicated through icons + text labels + zinc shading tiers. Any future brand skin only needs to override the zinc scale and accent color.

---

## References

- [Design-spec.md](Design-spec.md) — views, states, IA
- [Implementation-spec.md](Implementation-spec.md) — job contract, artifacts
- [../../meta/UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md) — project-wide a11y standards
