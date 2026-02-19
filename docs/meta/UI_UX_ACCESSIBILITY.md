# UI/UX and Accessibility Standards

This document is the single source of truth for UI/UX and accessibility expectations. Product Designer and UI Engineer agents align to it. See [.claude/governance/agents.md](../../.claude/governance/agents.md) for role responsibilities.

## Accessibility (a11y)

- **Target:** WCAG 2.1 Level AA where applicable.
- **Semantic HTML:** Use appropriate elements (`button`, `main`, `section`, `h1`–`h6`, `ul`/`li`, `nav`, etc.). Do not rely on divs/spans alone for interactive or structural meaning.
- **Keyboard:** All interactive UI must be reachable and operable via keyboard (focus order, Enter/Space for activation, Escape where appropriate).
- **Focus management:** Visible focus indicators; focus not trapped unless in a modal/dialog with a clear exit.
- **Screen readers:** Meaningful labels (e.g. `aria-label`, associated `<label>`); `role` and `aria-*` where they add clarity (e.g. `role="alert"` for errors). Do not expose Core handles, DB paths, or internal IDs as the primary label.
- **Design system:** Use the shared design-system components (shadcn) for consistency and built-in a11y (Radix primitives). Custom components must meet the same standards.

## Contrast and visibility

- **Color contrast:** Text and interactive elements meet WCAG 2.1 Level AA contrast (4.5:1 for normal text; 3:1 for large text).
- **Focus indicators:** All focusable elements have a visible focus ring (e.g. `focus-visible:ring-2`); never remove focus styles.
- **Screen reader support:** Use `aria-label` for icon-only buttons; `aria-describedby` where helpful; avoid redundant announcements.

## UI/UX

- **Hierarchy:** Clear visual and heading hierarchy; one main heading per view where appropriate.
- **Consistency:** Same patterns for similar actions (e.g. primary action button style, error presentation).
- **Feedback:** Loading and error states communicated clearly (e.g. role="alert" for errors, disabled/loading on buttons where applicable).

## References

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [.claude/governance/agents.md](../../.claude/governance/agents.md) — Product Designer (specs) vs UI Engineer (implementation)
