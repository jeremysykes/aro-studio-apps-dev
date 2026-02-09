# When and how to update documentation

## When to update `docs/`

Design changes, API changes, checklists, and dependencies: update the relevant file in `docs/` (e.g. ARCHITECTURE.md, CORE_PUBLIC_API.md, DEPENDENCIES.md, kick-off or checklist docs). Do this before implementing the change.

## When to add or update `adr/`

When making a **significant architectural or technical decision** (e.g. persistence choice, boundary rules, technology choice that affects the codebase):

- Add one ADR per decision. Use numbered filenames (e.g. `0001-use-sqlite.md`).
- Include: **context**, **decision**, **consequences**.
- Link from `docs/` or other ADRs when relevant.

## When to add or update `decisions/`

When making **product, process, or design decisions** that are not purely architectural (e.g. scope choices, workflow, naming, prioritization):

- Record in `decisions/`. Use one file per decision or a log-style file.
- Keep it searchable (e.g. date, title, short summary).

## When to add or update `diagrams/`

Whenever a diagram is added or changed in a doc or ADR:

- Store Mermaid diagrams as `.md` files in `diagrams/`, with the diagram inside a `mermaid` code block. This ensures diagrams render correctly when opening the file or embedding it in Obsidian.
- Reference from docs or ADRs using Obsidian transclusion: `![[diagrams/filename]]` (no extension). This embeds and renders the diagram when viewing in Obsidian. For non-Obsidian viewers, add a fallback link: `[diagrams/filename.md](diagrams/filename.md)`.
- Do not embed diagram source inline in `docs/` or `adr/`; keep a single place to edit diagrams.
- Do not use raw `.mmd` files; use `.md` with mermaid blocks for Obsidian visual fidelity.
