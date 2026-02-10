## Purpose

This document initiates the **Desktop planning phase** for Aro Studio.

Unlike Core, Desktop planning is intentionally **not fully agentic** at this stage.
Desktop involves UX boundaries, lifecycle decisions, and responsibility splits that require
human judgment before execution.

This kick-off exists to:

- Frame how Desktop should be thought about
- Prevent Desktop from absorbing Core responsibilities
- Produce durable documentation artifacts before implementation begins

No Desktop code should be written while executing this document.

---

## Context (Inputs)

The following documents are authoritative and must be read first:

- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [core/CORE_PUBLIC_API.md](../core/CORE_PUBLIC_API.md)
- [core/CORE_MVP_CHECKLIST.md](../core/CORE_MVP_CHECKLIST.md)
- [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md)
- [.cursor/rules/CURSOR_RULES.md](../../.cursor/rules/CURSOR_RULES.md)

Core is complete, tested, and headless.
Desktop must adapt to Core — not the other way around.

---

## What Desktop Is (MVP Framing)

Desktop is:

- An Electron host
- A UI shell
- An IPC bridge
- A lifecycle manager

Desktop is **not**:

- A business logic layer
- A persistence layer
- A validation engine
- A job execution engine
- A replacement for Core services

All stateful, long-running, or domain-specific behavior lives in Core.

---

## Goals of This Kick-Off

Running this document should result in shared clarity on:

- Desktop responsibilities vs Core responsibilities
- The minimal Desktop MVP required to host Core
- Required screens and flows (at a conceptual level)
- IPC boundaries between Desktop and Core
- Desktop lifecycle responsibilities
- Explicit Desktop non-goals

This is a **planning and framing exercise only**.

---

## Required Outputs (Hard Requirement)

Executing `DESKTOP_KICK_OFF.md` must produce the following documentation artifacts
before any Desktop code is written:

1. [DESKTOP_ARCHITECTURE.md](DESKTOP_ARCHITECTURE.md)
   - Desktop responsibilities
   - Dependency direction
   - Relationship to Core and Modules

2. [DESKTOP_PUBLIC_API.md](DESKTOP_PUBLIC_API.md)
   - IPC surface (method names, event names)
   - What Desktop exposes to renderers
   - What Desktop forwards to Core

3. [DESKTOP_MVP_CHECKLIST.md](DESKTOP_MVP_CHECKLIST.md)
   - Pass/fail checklist for Desktop MVP
   - What “done” means for the first Desktop iteration

4. Desktop-specific rules
   - Either a new `DESKTOP_RULES.md`
   - Or explicit additions to `CURSOR_RULES.md`

If these artifacts do not exist, Desktop implementation must not begin.

---

## Constraints

- Do not write Electron code yet
- Do not propose features that belong in Core
- Do not assume Modules are implemented
- Do not introduce new dependencies
- Prefer boring, well-understood Electron patterns
- Optimize for clarity and restraint over flexibility

---

## Guiding Questions (Answer in Order)

1. What are the non-negotiable responsibilities of Desktop in this architecture?
2. What responsibilities must Desktop explicitly refuse?
3. What is the smallest Electron app that can:
   - select or open a workspace
   - initialize Core
   - trigger jobs
   - display logs and artifacts
4. What screens are required for a Desktop MVP?
5. What IPC surface is required between Desktop and Core?
6. What lifecycle events does Desktop need to manage?
7. Where are the natural future extension points (without building them now)?
8. What Desktop mistakes would permanently damage Core’s integrity?

Answers should be concrete and example-driven.

---

## Stop Condition

This task is complete when:

- All required documentation artifacts exist
- They are internally consistent
- They respect Core boundaries
- No Desktop code has been written

Only after this point may Desktop implementation be planned or delegated.

---

## Execution Mode

This document should be executed in **discussion / brainstorming mode**.
Agent autonomy should be limited until documentation artifacts are reviewed and approved.
