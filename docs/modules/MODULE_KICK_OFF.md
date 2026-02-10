# Module Kick-Off

## Purpose

This document initiates the **Module planning phase** for Aro Studio.

Module planning is intentionally **not fully agentic** at this stage. Module design involves
responsibility boundaries, discovery, registration, and UI ownership that require
human judgment before implementation.

This kick-off exists to:

- Frame how Modules should be thought about
- Prevent Modules from absorbing Core or Desktop responsibilities
- Produce durable documentation artifacts before module implementation begins

No module code should be written while executing this document.

---

## Context (Inputs)

The following documents are authoritative and must be read first:

- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [DESKTOP_ARCHITECTURE.md](../desktop/DESKTOP_ARCHITECTURE.md)
- [DESKTOP_PUBLIC_API.md](../desktop/DESKTOP_PUBLIC_API.md)
- [CORE_PUBLIC_API.md](../core/CORE_PUBLIC_API.md)
- [.cursor/rules/CURSOR_RULES.md](../../.cursor/rules/CURSOR_RULES.md)

Desktop MVP is complete. Modules must adapt to Desktop and Core — not the other way around.

---

## Module Models

See [MODULE_MODELS.md](MODULE_MODELS.md) for the full Model A vs Model B comparison.

---

## MVP: Model A (Multi-Variant)

- **One module per app** — e.g. "Aro Studio Tokens", "Aro Studio Figma"
- **Module owns the UI** — main content area
- **Active module** — One module loaded at a time; selected by `ARO_ACTIVE_MODULE` (default `hello-world`), optionally `apps/desktop/.env` for development (see [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md))

---

## Future: Model B (Dashboard)

- Single app with multiple contained modules
- Per-user or per-workspace enable/disable
- See [MODULE_B_TRANSITION.md](MODULE_B_TRANSITION.md) for the transition path

---

## Goals of This Kick-Off

Running this document should result in shared clarity on:

- Module responsibilities vs Core vs Desktop
- Module discovery and registration
- Module UI ownership and constraints
- What Modules must and must not do

This is a **planning and framing exercise only**.

---

## Required Outputs (Hard Requirement)

Executing `MODULE_KICK_OFF.md` must produce the following documentation artifacts
before any module code is written:

1. [MODULE_MODELS.md](MODULE_MODELS.md) — Model A vs Model B comparison
2. [MODULE_B_TRANSITION.md](MODULE_B_TRANSITION.md) — Future path to Dashboard
3. [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) — Module responsibilities, flow, boundaries
4. [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md) — Constraint implementation details
5. [MODULE_PUBLIC_API.md](MODULE_PUBLIC_API.md) — Job registration, IPC surface
6. [MODULE_MVP_CHECKLIST.md](MODULE_MVP_CHECKLIST.md) — Pass/fail for hello-world module
7. [diagrams/module-models.md](../../diagrams/module-models.md) — Mermaid diagram
8. [decisions/module-model-choice.md](../../decisions/module-model-choice.md) — Model A decision

Module-specific rules must be added to [.cursor/rules/CURSOR_RULES.md](../../.cursor/rules/CURSOR_RULES.md).

If these artifacts do not exist, module implementation must not begin.

---

## Constraints

- Do not write module code yet
- Modules must not break the Core/Desktop/Module contract
- Modules must not import each other
- Modules must not access SQLite or filesystem directly (use Core workspace APIs)
- See [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md) for implementation details

---

## Guiding Questions (Answers Captured in Architecture Docs)

1. What are the non-negotiable responsibilities of Modules in this architecture?
2. What must Modules explicitly refuse?
3. How does module discovery and registration work?
4. How does job registration flow from Desktop → Module → Core?
5. What IPC surface does the module renderer use?
6. What is the minimal hello-world module that proves the architecture?
7. How do we enforce module-to-module isolation?
8. How do we enforce no direct DB or filesystem access?
9. What extension points exist for future Model B?
10. What module mistakes would permanently damage Core or Desktop integrity?

Answers should be captured in [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md), [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md), and [MODULE_PUBLIC_API.md](MODULE_PUBLIC_API.md).

---

## Stop Condition

This task is complete when:

- All required documentation artifacts exist
- They are internally consistent
- No module code has been written

Only after this point may module implementation be planned or delegated.

---

## Execution Mode

This document should be executed in **discussion / brainstorming mode**.
Agent autonomy should be limited until documentation artifacts are reviewed and approved.
