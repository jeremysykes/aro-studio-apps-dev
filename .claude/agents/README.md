# Agent definitions

Agent definitions live in this directory. Each subdirectory corresponds to one allowed agent and contains an `AGENT.md` file with that agent's identity, scope, and domain guidance.

**Canonical authority:** Root [AGENTS.md](../../AGENTS.md) is the single source of truth for which agents are allowed, their responsibilities, constraints, separation of concerns, and execution order. This directory extends that with layer-specific docs and checklists only.

## Agents

| Agent | Definition |
|-------|------------|
| Architect | [architect/AGENT.md](architect/AGENT.md) |
| Core Engineer | [core-engineer/AGENT.md](core-engineer/AGENT.md) |
| Desktop Engineer | [desktop-engineer/AGENT.md](desktop-engineer/AGENT.md) |
| Web Engineer | [web-engineer/AGENT.md](web-engineer/AGENT.md) |
| Module Engineer | [module-engineer/AGENT.md](module-engineer/AGENT.md) |
| Product Designer | [product-designer/AGENT.md](product-designer/AGENT.md) |
| UI Engineer | [ui-engineer/AGENT.md](ui-engineer/AGENT.md) |

For responsibilities, "must not" rules, and execution order, see root [AGENTS.md](../../AGENTS.md). For which agent owns which task, see [governance/routing.md](../governance/routing.md). For instruction precedence, see [governance/precedence.md](../governance/precedence.md).
