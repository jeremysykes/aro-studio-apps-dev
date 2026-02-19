# Governance

This directory defines how the AI control plane behaves: which agent is responsible for which kind of task, and in what order instructions apply.

- **[routing.md](routing.md)** — Task → agent mapping. Use it to decide which agent(s) should handle a given request.
- **[precedence.md](precedence.md)** — Instruction precedence: governance overrides agent instructions; agent instructions override generic standards.

**Authority:** The canonical list of allowed agents and their responsibilities is in root [AGENTS.md](../../AGENTS.md). Agent definitions (identity + domain guidance) live in [../agents/](../agents/).
