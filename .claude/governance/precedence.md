# Instruction precedence

When resolving how the AI should behave, apply this order (highest wins):

1. **Governance** — This directory: [routing.md](routing.md), [precedence.md](precedence.md). Defines which agent owns which task and how instructions stack.
2. **Agents** — [../agents/](../agents/): each agent's AGENT.md defines identity, scope, and domain guidance. [agents.md](agents.md) in this directory is the canonical contract (responsibilities, "must not", execution order).
3. **Standards** — [../standards/](../standards/) points to [.cursor/rules/](../../.cursor/rules/) and `docs/`. Those rules (e.g. CURSOR_RULES.md, ARCHITECTURE.md) apply unless overridden by governance or the active agent's instructions.

Do not put orchestration logic inside agent or skill files. Do not put formatting/standards into agent identity files; keep them in .cursor/rules and docs.
