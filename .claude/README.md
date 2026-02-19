# AI control plane

This directory is the control plane for agent-assisted development in this repo. It separates **governance**, **agents**, **skills**, and **standards** so that behavior is deterministic, auditable, and easy to extend.

## Structure

| Directory | Purpose |
|-----------|---------|
| [governance/](governance/) | Routing (task → agent) and instruction precedence. Start here to decide which agent handles a task. |
| [agents/](agents/) | Agent definitions: identity, scope, and domain guidance for each allowed agent. One subdir per agent with an `AGENT.md` file. |
| [skills/](skills/) | Reserved for reusable, cross-agent skills. To run an agent, use [agents/](agents/) (see below). |
| [standards/](standards/) | Points to project invariants and rules; no duplication. The actual rules live in `.cursor/rules/` and `docs/`. |

## Authority

**Root [AGENTS.md](../AGENTS.md)** is the single source of truth for:

- Which agent types are allowed
- Their responsibilities and "must not" rules
- Separation of concerns (who owns what)
- Execution order when work spans multiple layers

Agent definitions under [agents/](agents/) extend that contract with layer-specific docs and checklists. They do not replace AGENTS.md.

## How to use

1. **Choose an agent:** Use [governance/routing.md](governance/routing.md) to map your task to an agent (or sequence of agents per execution order in AGENTS.md).
2. **Load the agent:** Open the corresponding [agents/\<name\>/AGENT.md](agents/) file for identity, scope, and domain guidance.
3. **Precedence:** [governance/precedence.md](governance/precedence.md) defines the order: governance > agents > standards.
4. **Standards:** [standards/](standards/) links to `.cursor/rules/` and `docs/` for invariants and coding rules.

## Adding a new role or skill

- **New agent:** Add an entry and section in root AGENTS.md, then add `agents/<name>/AGENT.md` and list it in [agents/README.md](agents/README.md) and [governance/routing.md](governance/routing.md).
- **New skill:** Add a markdown file (or subdir) under [skills/](skills/) and document when to use it. Keep skills reusable and free of agent-specific identity.
- **New standard:** Prefer adding or updating rules in `.cursor/rules/` or `docs/`; reference them from [standards/README.md](standards/README.md). Do not duplicate full rule text here.
