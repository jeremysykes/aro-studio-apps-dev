### Ruleset

Rules applied by Cursor when working in this repository. Must be consistent with `docs/` and with [AGENTS.md](../../AGENTS.md).

1. Core must not import Desktop or Modules
2. Modules must not import each other
3. SQL must remain inside infra/db
4. Services expose intent-based methods only
5. Jobs are the only long-running execution model (I/O, computation, or multi-step workflows).
6. No new dependencies without justification in /docs/DEPENDENCIES.md.
7. Prefer synchronous code in Core
8. Favor applied tests over unit tests
9. All decisions must be consistent with /docs. If unclear, update docs first, then implement. For design/API/dependencies, update the relevant file in `docs/`. When and how to update `adr/`, `decisions/`, and `diagrams/`: follow [docs/DOCUMENTATION.md](../../docs/DOCUMENTATION.md).
10. Significant architectural or technical decisions: record in `adr/` (numbered ADR with context, decision, consequences).
11. Other product/process/design decisions: record in `decisions/`.
12. When adding or changing a diagram in a doc or ADR: put the diagram in `diagrams/` as an `.md` file with a mermaid code block (for Obsidian visual fidelity). Reference it from the doc or ADR using `![[diagrams/filename]]` or per [docs/DOCUMENTATION.md](../../docs/DOCUMENTATION.md).

## Desktop

13. Desktop is an Electron host, UI shell, IPC bridge, and lifecycle manager. It must not implement business logic, persistence, validation, or job execution; those live in Core.
14. Desktop must not access SQLite, filesystem (for domain data), or Core internals directly. All domain operations go through Core's public API. The renderer never receives Core handles, DB paths, or workspace roots.
15. Desktop design and implementation must follow `docs/DESKTOP_ARCHITECTURE.md`, `docs/DESKTOP_PUBLIC_API.md`, and `docs/DESKTOP_MVP_CHECKLIST.md`. New Desktop dependencies require justification in `docs/DEPENDENCIES.md`.