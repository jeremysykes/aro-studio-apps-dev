### Cursor Rules Entry Point

This directory contains the authoritative rules for working in this repository.

Before making any decisions or writing code:

1. Read `CURSOR_RULES.md`
2. Read `/docs/ARCHITECTURE.md`
3. Read `/docs/core/CORE_PUBLIC_API.md`

For **agent role boundaries and execution order** (which agent may do what in the dev repo), see root [AGENTS.md](../../AGENTS.md).

If a decision is unclear or undocumented:

- Update the relevant file in `/docs` first (or add an ADR in `adr/` for significant arch/technical decisions, or a record in `decisions/` for other decisions). For when to use docs vs adr vs decisions, and where to put diagrams, see [docs/meta/DOCUMENTATION.md](../../docs/meta/DOCUMENTATION.md). Significant arch/technical decisions → `adr/`. Other product/process/design decisions → `decisions/`. Diagrams → `diagrams/`, referenced from the doc or ADR.
- Then implement the change

Do not introduce new dependencies, structure, or abstractions without updating documentation first.