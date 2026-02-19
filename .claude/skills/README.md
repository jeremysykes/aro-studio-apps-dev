# Skills

This directory is reserved for **reusable, cross-agent skills** — behavioral guidance or procedures that can be used by more than one agent (e.g. "how to run applied tests", "how to update docs"). Currently there are no shared skills; agent-specific behavior lives in [../agents/](../agents/).

**To run an agent:** Use the agent definitions under [../agents/](../agents/). Each agent has a single `AGENT.md` file with identity, scope, and domain guidance. Canonical authority for who may do what is root [AGENTS.md](../../AGENTS.md). Routing (which agent for which task) is in [../governance/routing.md](../governance/routing.md).

Do not put agent identity or orchestration logic in this directory. Add only skills that are explicitly reusable across agents.
