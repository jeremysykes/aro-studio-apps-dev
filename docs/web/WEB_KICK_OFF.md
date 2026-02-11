## Purpose

This document initiates the **Web planning phase** for Aro Studio.

Unlike Core, Web planning is intentionally **not fully agentic** at this stage.
Web involves UX boundaries, lifecycle decisions, and responsibility splits that require
human judgment before execution.

This kick-off exists to:

- Frame how Web should be thought about
- Prevent Web from absorbing Core responsibilities
- Produce durable documentation artifacts before implementation begins
- Ensure Web achieves the same level of functionality as Desktop within its constraints

No Web code should be written while executing this document.

---

## Context (Inputs)

The following documents are authoritative and must be read first:

- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [core/CORE_PUBLIC_API.md](../core/CORE_PUBLIC_API.md)
- [core/CORE_MVP_CHECKLIST.md](../core/CORE_MVP_CHECKLIST.md)
- [desktop/DESKTOP_ARCHITECTURE.md](../desktop/DESKTOP_ARCHITECTURE.md)
- [desktop/DESKTOP_PUBLIC_API.md](../desktop/DESKTOP_PUBLIC_API.md)
- [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md)
- [.cursor/rules/CURSOR_RULES.md](../../.cursor/rules/CURSOR_RULES.md)

Core is complete, tested, and headless.
Desktop is complete and serves as the reference host.
Web must adapt to Core — not the other way around.
Web must mirror Desktop's intent-based API surface (over HTTP/WS instead of IPC).

---

## What Web Is (MVP Framing)

Web is:

- A Node server (backend) that runs Core and loads the active module
- A browser-based UI (frontend) — React SPA
- An HTTP + WebSocket API bridge
- A lifecycle manager for the server process

Web is **not**:

- A business logic layer
- A persistence layer
- A validation engine
- A job execution engine
- A replacement for Core services

All stateful, long-running, or domain-specific behavior lives in Core. The Web backend hosts Core in Node (Core cannot run in the browser).

---

## Goals of This Kick-Off

Running this document should result in shared clarity on:

- Web responsibilities vs Core responsibilities
- The minimal Web MVP required to host Core (same capabilities as Desktop)
- Required flows (workspace, jobs, runs, logs, artifacts) — conceptually same as Desktop
- HTTP/WS API boundaries between Web frontend and backend
- Web lifecycle responsibilities
- Explicit Web non-goals

This is a **planning and framing exercise only**.

---

## Required Outputs (Hard Requirement)

Executing `WEB_KICK_OFF.md` must produce the following documentation artifacts
before any Web code is written:

1. [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md)
   - Web responsibilities (backend vs frontend)
   - Dependency direction (Core → Web, Modules → Web)
   - Relationship to Core and Modules

2. [WEB_PUBLIC_API.md](WEB_PUBLIC_API.md)
   - HTTP/WS surface (endpoints, methods)
   - Same intent-based capabilities as Desktop IPC
   - How workspace is provided in browser context (e.g. env for MVP)

3. [WEB_MVP_CHECKLIST.md](WEB_MVP_CHECKLIST.md)
   - Pass/fail checklist for Web MVP
   - What "done" means for the first Web iteration

4. Web-specific rules
   - Explicit additions to `CURSOR_RULES.md`

If these artifacts do not exist, Web implementation must not begin.

---

## Constraints

- Do not write Web code yet
- Do not propose features that belong in Core
- Web must achieve the same level of functionality as Desktop (workspace, jobs, runs, logs, artifacts, module loading)
- Do not introduce new dependencies without DEPENDENCIES.md justification
- Prefer boring, well-understood patterns (Express/Vite, REST, WebSocket)
- Optimize for clarity and restraint over flexibility

---

## Guiding Questions (Answer in Order)

1. What are the non-negotiable responsibilities of Web in this architecture?
2. What responsibilities must Web explicitly refuse?
3. What is the smallest Web app that can:
   - provide a workspace (env-configured for MVP)
   - initialize Core
   - trigger jobs
   - display logs and artifacts
4. What screens or flows are required for a Web MVP? (Same as Desktop conceptually)
5. What HTTP/WS surface is required between Web frontend and backend?
6. What lifecycle events does Web need to manage?
7. Where are the natural future extension points (without building them now)?
8. What Web mistakes would permanently damage Core's integrity?

Answers should be concrete and example-driven.

---

## Stop Condition

This task is complete when:

- All required documentation artifacts exist
- They are internally consistent
- They respect Core boundaries
- No Web code has been written

Only after this point may Web implementation be planned or delegated.

---

## Execution Mode

This document should be executed in **discussion / brainstorming mode**.
Agent autonomy should be limited until documentation artifacts are reviewed and approved.
