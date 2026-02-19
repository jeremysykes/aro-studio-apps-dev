# Governance

This directory defines how the AI control plane behaves: which agent is responsible for which kind of task, and in what order instructions apply.

- **[agents.md](agents.md)** — Agent role contract (orchestration): allowed agents, responsibilities, "must not" rules, separation of concerns, execution order.
- **[routing.md](routing.md)** — Task → agent mapping. Use it to decide which agent(s) should handle a given request.
- **[precedence.md](precedence.md)** — Instruction precedence: governance overrides agent instructions; agent instructions override generic standards.

**Authority:** The canonical list of allowed agents and their responsibilities is in [agents.md](agents.md). Agent definitions (identity + domain guidance) live in [../agents/](../agents/).
