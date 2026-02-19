# Standards

This directory does not duplicate rules. It points to where invariants and coding standards live.

- **[.cursor/rules/](../../.cursor/rules/)** — Cursor rules applied when working in this repo. [CURSOR_RULES.md](../../.cursor/rules/CURSOR_RULES.md) holds the ruleset (Core, Desktop, Web, Modules, Product Designer, UI Engineer). [README.md](../../.cursor/rules/README.md) points to the orchestration doc and docs. Rules must be consistent with `docs/` and with [.claude/governance/agents.md](../../.claude/governance/agents.md).
- **docs/** — Architecture and layer-specific docs. Key entry points:
  - [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — dependency rules, Core layers, boundaries
  - [docs/core/CORE_PUBLIC_API.md](../../docs/core/CORE_PUBLIC_API.md) — Core public API
  - [docs/meta/DEPENDENCIES.md](../../docs/meta/DEPENDENCIES.md) — allowed deps per package
  - [docs/meta/UI_UX_ACCESSIBILITY.md](../../docs/meta/UI_UX_ACCESSIBILITY.md) — UI/UX and a11y expectations

Do not copy the full text of CURSOR_RULES.md or ARCHITECTURE.md here. Reference them only so there is a single source of truth.
