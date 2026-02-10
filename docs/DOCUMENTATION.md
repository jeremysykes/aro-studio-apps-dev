# When and how to update documentation

## When to update the README

When project status or entry points change in a way a new contributor would care about (e.g. MVP completion, new top-level scripts, new package, major stack or agent-model change):

- Update [README.md](../README.md) so that the **Status**, **Run / build**, and **Testing** sections (and any other high-level sections) stay accurate.
- Do not move deep technical or API detail into the README; keep linking to `docs/` and [AGENTS.md](../AGENTS.md).

## When to update `docs/`

Design changes, API changes, checklists, and dependencies: update the relevant file in `docs/` (e.g. ARCHITECTURE.md, CORE_PUBLIC_API.md, DEPENDENCIES.md, kick-off or checklist docs). Do this before implementing the change.

When the application or module contract changes in a way that affects how PRDs/TRDs should be written (e.g. new IPC surface, new job context fields, new constraints), update [MODULE_PRD_TRD_CONTEXT.md](MODULE_PRD_TRD_CONTEXT.md) so it remains the single source of context for module requirements.

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
