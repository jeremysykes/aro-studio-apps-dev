
This document defines Desktop's responsibilities, boundaries, and relationship to Core and future Modules. It is the source of truth for Desktop design decisions.

## Dependency direction

```
Core ──────────► Desktop
                      ▲
Modules ──────────────┘
```

- Desktop MAY import Core.
- Desktop MAY import Modules (when they exist).
- Core MUST NOT import Desktop or Modules.
- Modules MUST NOT import each other.

Desktop is the host; Core and Modules are dependencies. Dependency flow is one-way.

---

## What Desktop is (MVP)

Desktop is:

- **Electron host** — Main process, preload, renderer(s). Single window for MVP.
- **UI shell** — Renders workspace selection, job trigger, logs, artifacts. Uses TypeScript, React, semantic HTML.
- **IPC bridge** — Exposes a narrow, intent-based API to renderers; forwards calls to Core. Never exposes raw Core handles, DB paths, or filesystem primitives.
- **Lifecycle manager** — Creates/destroys Core instance, manages app quit and window lifecycle.

Desktop is **not**:

- A business logic layer
- A persistence layer (no direct SQLite, no direct file writes for domain data)
- A validation engine
- A job execution engine
- A replacement for Core services

All stateful, long-running, and domain-specific behavior lives in Core.

---

## Non-negotiable Desktop responsibilities (Q1)

1. **Workspace selection** — Provide a way to select or open a workspace (directory). Persist last-used workspace for reopen (via Electron/store or similar; not Core).
2. **Core initialization** — Call `createCore({ workspaceRoot })` when a workspace is chosen. Hold exactly one Core instance per workspace. Call `core.shutdown()` before switching workspace or quitting.
3. **IPC surface** — Expose intent-based channels to the renderer (e.g. `workspace:select`, `job:run`, `logs:subscribe`). Translate IPC calls into Core API calls. Never leak Core, DB, or filesystem to the renderer.
4. **Lifecycle** — Manage app startup, window open/close, and quit. Ensure Core is shut down cleanly on quit.
5. **Renderer hosting** — Load and render the UI (workspace picker, job trigger, logs, artifacts). Use React for UI composition. Use semantic HTML for accessibility.

---

## Responsibilities Desktop must refuse (Q2)

1. **Business logic** — No token validation, no job definition logic, no run status logic. Desktop forwards; Core decides.
2. **Persistence** — No direct SQLite access, no direct writes to `.aro/` or `tokens/`. All persistence goes through Core.
3. **Job execution** — Desktop triggers jobs via `core.jobs.run()`. It does not execute jobs, register job definitions, or interpret job results beyond what Core returns.
4. **Validation** — Desktop does not validate tokens, workspace contents, or job input. It calls `core.validation.validateTokens()` when needed and displays issues; it does not implement validation.
5. **Exposing internals** — Never expose `dbPath`, `workspaceRoot` as raw paths to the renderer. Never pass `core` or any Core service to the renderer. The renderer only sees IPC.

---

## Relationship to Core and Modules

| Concern              | Owned by | Desktop role                          |
|----------------------|----------|----------------------------------------|
| Workspace paths      | Core     | Pass selected path to `createCore()`   |
| Runs, logs, artifacts| Core     | Forward IPC → Core APIs                |
| Job registration/run | Core     | Forward `job:run` → `core.jobs.run()`  |
| Tokens, validation   | Core     | Forward when UI needs them             |
| Window, menus, IPC   | Desktop  | Full ownership                         |
| Module loading       | Desktop  | Load active module after Core init; call module `init(core)`; use returned job keys for `job:listRegistered`; render module UI in main content |

**Model A (hello-world):** Desktop loads the active module (e.g. `@aro/module-hello-world`) after creating Core, invokes the module's `init(core)` so the module registers jobs with Core, stores the returned job keys for IPC, and renders the module's UI in the main content area.

---

## Lifecycle (Q6)

1. **App start** — Main process starts. No Core yet. Show workspace selection (or reopen last workspace if stored).
2. **Workspace selected** — Call `createCore({ workspaceRoot })`. Core initializes workspace, opens DB. Desktop holds the `core` instance. Renderer can now trigger jobs, view logs/artifacts.
3. **Workspace change** — Call `core.shutdown()`. Release Core. Show workspace selection again. On new selection, create new Core.
4. **App quit** — Call `core.shutdown()` before app exits. Close DB, clear subscriptions.
5. **Single window** — MVP uses one main window. No multi-window or multi-workspace in one process for MVP.

---

## Module loading (Model A)

Desktop loads the **active module** in the main process after creating Core (on workspace select or on restore of last workspace). The active module is chosen by `ARO_ACTIVE_MODULE` (default `hello-world` when unset); for development, you can set it in `apps/desktop/.env` (see [ACTIVE_MODULE_SWITCH.md](ACTIVE_MODULE_SWITCH.md)). Desktop calls the module's `init(core)` function, which registers job definitions with Core and returns the list of registered job keys. Desktop stores those keys and returns them from `job:listRegistered` IPC. The renderer imports and renders the module's UI component in the main content area. No new IPC channels; modules use existing `window.aro` (workspace, job, runs, logs, artifacts).

## Future extension points (Q7)

1. **Renderer route for module UI** — Future (Model B): renderer could have routes like `/module/:moduleKey` that load module-specific UI. Model A uses a single active module; single view only.
2. **IPC channel for module-invoked jobs** — Same as `job:run`; modules use the same IPC. No new channel needed.
3. **Preload API extension** — When moving to Model B, the preload script could expose a `module` namespace for module-specific IPC. Model A uses only `workspace`, `job`, `runs`, `logs`, `artifacts`.

---

## Desktop mistakes that damage Core integrity (Q8)

1. **Running Core in the renderer** — Core uses Node APIs (fs, better-sqlite3). It must run in the main process only. Running Core in a renderer would require unsafe `nodeIntegration` or similar and would break the security model.
2. **Exposing DB path or workspace root to renderer** — The renderer could then attempt direct file or DB access, bypassing Core. All path resolution stays in main process.
3. **Bypassing Core for persistence** — Desktop must not write to `.aro/`, `tokens/`, or any workspace domain files. Only Core does that.
4. **Passing Core or services to renderer** — Even via `contextBridge`, never expose `core` or `core.runs`, etc. The renderer gets only serializable data and IPC invocations.
5. **Importing Core into renderer** — Core must not be bundled into the renderer. It stays in main process only.
6. **Adding business logic to Desktop** — Validation, job semantics, run status interpretation belong in Core. Desktop is a thin adapter.

---

## Diagram: Desktop MVP

![[diagrams/desktop-mvp]]

Fallback: [diagrams/desktop-mvp.md](../../diagrams/desktop-mvp.md).

The renderer talks to the IPC layer via `contextBridge`. The main process holds the Core instance and forwards IPC to Core APIs.
