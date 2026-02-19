# Task → agent routing

Use this mapping to choose which agent(s) should handle a request. The canonical list of agents and their responsibilities is in [agents.md](agents.md). Agent definitions (behavior and domain docs) are under [../agents/](../agents/).

| Task / topic | Primary agent | Notes |
|--------------|---------------|--------|
| Core layering, service boundaries, public API design, folder structure, dependency direction | [Architect](../agents/architect/AGENT.md) | Structural decisions only; no implementation. |
| Core services, SQLite schema, job runner, applied tests | [Core Engineer](../agents/core-engineer/AGENT.md) | `packages/core/` only. |
| Electron main process, preload, IPC, module loading, navigation, renderer bootstrap | [Desktop Engineer](../agents/desktop-engineer/AGENT.md) | `apps/desktop/` only. |
| Web server, API wrapping Core, module loading, web app bootstrap | [Web Engineer](../agents/web-engineer/AGENT.md) | `apps/web/` only. |
| Module job definitions, module feature behavior, Core API usage from modules | [Module Engineer](../agents/module-engineer/AGENT.md) | No UI; no fs/DB direct access. |
| User flows, layout/specs, visual hierarchy, a11y requirements, design tokens | [Product Designer](../agents/product-designer/AGENT.md) | Specs and docs only; no code. |
| Renderer UI (Desktop shell, Web shell, module screens), design system usage | [UI Engineer](../agents/ui-engineer/AGENT.md) | From Product Designer specs; shadcn + Tailwind. |

When the task spans multiple layers (e.g. "add a new API and call it from Desktop"), follow the [execution order](agents.md) in agents.md: Architect → Core Engineer → Desktop/Web Engineer → Module Engineer (if needed) → Product Designer (if needed) → UI Engineer (if needed).
