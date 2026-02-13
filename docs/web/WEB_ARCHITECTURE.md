
This document defines Web's responsibilities, boundaries, and relationship to Core and Modules. It is the source of truth for Web design decisions.

## Dependency direction

```
Core ──────────► Web (backend)
                      ▲
Modules ──────────────┘
```

- Web backend MAY import Core.
- Web backend MAY import Modules.
- Core MUST NOT import Web or Modules.
- Modules MUST NOT import each other.
- Web frontend (browser) does NOT import Core or Modules; it calls the Web API only.

Web is a host (backend + frontend); Core and Modules are dependencies of the backend. Dependency flow is one-way.

---

## What Web is (MVP)

Web is:

- **Node server (backend)** — Runs Core, loads the active module, exposes HTTP + WebSocket API. Single process for MVP.
- **Browser UI (frontend)** — React SPA that calls the Web API. Uses TypeScript, React, semantic HTML.
- **HTTP/WS bridge** — Exposes the same intent-based API as Desktop (workspace, job, runs, logs, artifacts) but over HTTP/REST and WebSocket instead of IPC. Never exposes raw Core handles, DB paths, or filesystem primitives.
- **Lifecycle manager** — Creates/destroys Core instance on server start/stop; manages server process lifecycle.

Web is **not**:

- A business logic layer
- A persistence layer (no direct SQLite, no direct file writes for domain data)
- A validation engine
- A job execution engine
- A replacement for Core services

All stateful, long-running, and domain-specific behavior lives in Core. Core runs only in the Web backend (Node); it cannot run in the browser.

---

## Non-negotiable Web responsibilities (Q1)

1. **Workspace provision** — Provide a workspace to Core. For MVP: read from env (`ARO_WORKSPACE_ROOT` or `process.cwd()`). No folder picker in the browser for MVP.
2. **Core initialization** — Call `createCore({ workspaceRoot })` when the server starts (or when workspace is configured). Hold exactly one Core instance. Call `core.shutdown()` before server exit or workspace change.
3. **HTTP/WS API surface** — Expose the same intent-based capabilities as Desktop: workspace (getCurrent for MVP), job (run, cancel, listRegistered), runs (list, get), logs (list, subscribe via WebSocket), artifacts (list, read). Never leak Core, DB, or filesystem to the frontend.
4. **Lifecycle** — Manage server startup and shutdown. Ensure Core is shut down cleanly on server exit.
5. **Frontend hosting** — Serve the React SPA and load the active module UI. Use the same module component registry pattern as Desktop renderer.

---

## Responsibilities Web must refuse (Q2)

1. **Business logic** — No token validation, no job definition logic, no run status logic. Web forwards; Core decides.
2. **Persistence** — No direct SQLite access, no direct writes to `.aro/` or `tokens/`. All persistence goes through Core.
3. **Job execution** — Web triggers jobs via `core.jobs.run()`. It does not execute jobs, register job definitions, or interpret job results beyond what Core returns.
4. **Validation** — Web does not validate tokens, workspace contents, or job input. It calls Core when needed and displays issues; it does not implement validation.
5. **Exposing internals** — Never expose `dbPath`, `workspaceRoot` as raw paths to the frontend. Never pass `core` or any Core service to the frontend. The frontend only sees the HTTP/WS API.

---

## Relationship to Core and Modules

| Concern               | Owned by | Web role                                                          |
|-----------------------|----------|-------------------------------------------------------------------|
| Workspace paths       | Core     | Pass workspace path from env to `createCore()`                    |
| Runs, logs, artifacts | Core     | Forward API requests → Core APIs                                  |
| Job registration/run | Core     | Forward `job:run` → `core.jobs.run()`                             |
| Tokens, validation    | Core     | Forward when UI needs them                                        |
| API, server process   | Web      | Full ownership                                                    |
| Module loading        | Web      | Load active module in backend after Core init; call `init(core)`; return job keys from API; render module UI in frontend |

**Standalone (same as Desktop):** Web backend loads the active module (e.g. `@aro/module-hello-world`) after creating Core, invokes the module's `init(core)` so the module registers jobs with Core, stores the returned job keys for the API, and the frontend renders the module's UI in the main content area.

---

## Lifecycle (Q6)

1. **Server start** — Node server starts. Read workspace from env. Call `createCore({ workspaceRoot })`. Load active module. Expose API and serve frontend.
2. **Server running** — Frontend can call API (workspace getCurrent, job run/cancel/listRegistered, runs, logs, artifacts). Core handles all domain operations.
3. **Server exit** — Call `core.shutdown()` before process exit. Close DB, clear subscriptions.
4. **Single workspace** — MVP uses one workspace per server instance (env-configured).

---

## Module loading (Standalone)

Web backend loads the **active module** after creating Core (on server start). The active module is chosen by `ARO_ACTIVE_MODULE` (default `hello-world` when unset); for development, set it in **`.env`** at the project root. Web backend calls the module's `init(core)` function, which registers job definitions with Core and returns the list of registered job keys. Web stores those keys and returns them from the `job/listRegistered` API. The frontend imports and renders the module's UI component in the main content area (same moduleRegistry pattern as Desktop). Modules use the Web API (fetch/WebSocket) instead of `window.aro` (IPC).

---

## Future extension points (Q7)

1. **Workspace selection in browser** — Future: project selector, URL param, or auth-based workspace; for MVP, env only.
2. **Multi-workspace** — Same constraints as Desktop; out of scope for MVP.
3. **Progress events** — Core supports `ctx.progress`; Web can add SSE or WebSocket events later.

---

## Web mistakes that damage Core integrity (Q8)

1. **Running Core in the frontend** — Core uses Node APIs (fs, better-sqlite3). It must run in the backend only. Never bundle Core into the frontend.
2. **Exposing DB path or workspace root to frontend** — The frontend could then attempt direct access. All path resolution stays in the backend.
3. **Bypassing Core for persistence** — Web must not write to `.aro/`, `tokens/`, or any workspace domain files. Only Core does that.
4. **Passing Core or services to frontend** — Never expose `core` or any Core handle to the frontend. The frontend gets only serializable data and API responses.
5. **Adding business logic to Web** — Validation, job semantics, run status interpretation belong in Core. Web is a thin adapter.

---

## Diagram: Web app flow

[diagrams/web-app-flow.md](../../diagrams/web-app-flow.md)

The frontend talks to the Web API (HTTP + WebSocket). The backend holds the Core instance and forwards API calls to Core.
