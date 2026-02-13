### Ruleset

Rules applied by Cursor when working in this repository. Must be consistent with `docs/` and with [AGENTS.md](../../AGENTS.md).

1. Core must not import Desktop or Modules
2. Modules must not import each other
3. SQL must remain inside infra/db
4. Services expose intent-based methods only
5. Jobs are the only long-running execution model (I/O, computation, or multi-step workflows).
6. No new dependencies without justification in docs/meta/DEPENDENCIES.md.
7. Prefer synchronous code in Core
8. Favor applied tests over unit tests
9. All decisions must be consistent with /docs. If unclear, update docs first, then implement. For design/API/dependencies, update the relevant file in `docs/` (by layer: core/, desktop/, modules/, meta/). When project status, main commands, or stack change, update [README.md](../../README.md) so it reflects current state (see [docs/meta/DOCUMENTATION.md](../../docs/meta/DOCUMENTATION.md)). When and how to update `adr/`, `decisions/`, and `diagrams/`: follow [docs/meta/DOCUMENTATION.md](../../docs/meta/DOCUMENTATION.md).
10. Significant architectural or technical decisions: record in `adr/` (numbered ADR with context, decision, consequences).
11. Other product/process/design decisions: record in `decisions/`.
12. When adding or changing a diagram in a doc or ADR: put the diagram in `diagrams/` as an `.md` file with a mermaid code block (for Obsidian visual fidelity). Reference it from the doc or ADR using `![[diagrams/filename]]` or per [docs/meta/DOCUMENTATION.md](../../docs/meta/DOCUMENTATION.md).

## Desktop

13. Desktop is an Electron host, UI shell, IPC bridge, and lifecycle manager. It must not implement business logic, persistence, validation, or job execution; those live in Core. Active module is set via `ARO_ACTIVE_MODULE` (default `hello-world`); optionally use **`.env`** at the project root for development (see README and docs/desktop/ACTIVE_MODULE_SWITCH.md).
14. Desktop must not access SQLite, filesystem (for domain data), or Core internals directly. All domain operations go through Core's public API. The renderer never receives Core handles, DB paths, or workspace roots.
15. Desktop design and implementation must follow `docs/desktop/DESKTOP_ARCHITECTURE.md`, `docs/desktop/DESKTOP_PUBLIC_API.md`, and `docs/desktop/DESKTOP_MVP_CHECKLIST.md`. New Desktop dependencies require justification in `docs/meta/DEPENDENCIES.md`.

## Web

16. Web is a host (Node server + browser UI), HTTP/WS bridge, and lifecycle manager. It must not implement business logic, persistence, validation, or job execution; those live in Core. Active module is set via `ARO_ACTIVE_MODULE` (default `hello-world`); optionally use **`.env`** at the project root.
17. Web must not access SQLite, filesystem (for domain data), or Core internals directly. All domain operations go through Core's public API. The frontend never receives Core handles, DB paths, or workspace roots.
18. Web design and implementation must follow `docs/web/WEB_ARCHITECTURE.md`, `docs/web/WEB_PUBLIC_API.md`, and `docs/web/WEB_MVP_CHECKLIST.md`. New Web dependencies require justification in `docs/meta/DEPENDENCIES.md`.

## Modules

19. Modules must not import each other.
20. Modules must not access SQLite or filesystem directly; use Core public API and workspace facet in job context.
21. Modules use Core public API and host API only — Desktop IPC (`window.aro`) or Web HTTP/WS API. Module UI may run in Desktop renderer or Web frontend and receives the same intent-based API from the host. No custom IPC/API unless documented in `docs/modules/MODULE_PUBLIC_API.md`.
22. Module design and implementation must follow `docs/modules/MODULE_ARCHITECTURE.md`, `docs/modules/MODULE_PUBLIC_API.md`, `docs/modules/MODULE_CONSTRAINTS.md`, and `docs/modules/MODULE_MVP_CHECKLIST.md`.

## Product Designer

23. Product Designer produces design specs and a11y requirements only. Specs and requirements live in `docs/` or `decisions/`; no application code. Must follow [docs/meta/UI_UX_ACCESSIBILITY.md](../../docs/meta/UI_UX_ACCESSIBILITY.md).

## UI Engineer

24. UI Engineer implements UI from design specs; uses the design system (shadcn + Tailwind) and semantic HTML/ARIA; follows [docs/meta/UI_UX_ACCESSIBILITY.md](../../docs/meta/UI_UX_ACCESSIBILITY.md). No new dependencies without justification in `docs/meta/DEPENDENCIES.md`.
25. **No custom UI when shadcn exists.** Do not build custom components for patterns that shadcn/ui provides (carousel, tabs, dialog, etc.). Use shadcn components from [ui.shadcn.com](https://ui.shadcn.com/docs/components). Add missing shadcn components to `packages/ui` before implementing features. Custom solutions are rejected unless the shadcn component is unsuitable and the gap is documented.