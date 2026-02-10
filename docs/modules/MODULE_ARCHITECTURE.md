# Module Architecture

This document defines Modules' responsibilities, boundaries, and relationship to Core and Desktop. It is the source of truth for Module design decisions.

## Dependency direction

```
Core ──────────► Desktop
                      ▲
Modules ──────────────┘
```

- Modules MAY import Desktop (for composition, when Desktop loads them).
- Modules access Core only via Desktop (Desktop holds Core; modules register jobs through Desktop).
- Modules MUST NOT import each other.
- Core MUST NOT import Desktop or Modules.

Desktop is the host; Modules and Core are dependencies. Dependency flow is one-way.

---

## Model A (MVP): Multi-Variant

The MVP uses Model A. See [MODULE_MODELS.md](MODULE_MODELS.md) for the full comparison.

- **One active module** — The active module is selected by `ARO_ACTIVE_MODULE` (default `hello-world` when unset); for development, set it in **`.env`** at the project root. See [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md).
- **Module owns the UI** — The module provides the main renderer content; Desktop hosts it.
- **Job registration** — Desktop creates Core, loads the module, passes Core to the module's init; the module calls `core.jobs.register()`.

---

## Job registration flow

1. User selects workspace; Desktop calls `createCore({ workspaceRoot })`.
2. Desktop loads the active module (from `ARO_ACTIVE_MODULE` or **`.env`** at the project root; default `hello-world`).
3. Desktop invokes the module's init function, passing Core (or a restricted facade).
4. The module calls `core.jobs.register({ key, run })` for each job it provides.
5. Registration happens in the main process only.
6. The renderer uses `window.aro.job.run(key)`, `window.aro.runs.list()`, etc. — existing IPC; no new channels for Model A MVP.

---

## What a module provides

- **Job definitions** — One or more jobs registered with Core via `core.jobs.register()`.
- **UI** — React components that render inside the Desktop shell; triggers jobs and displays logs/artifacts via `window.aro`.

For context when writing PRDs and TRDs for new modules, see [MODULE_PRD_TRD_CONTEXT.md](MODULE_PRD_TRD_CONTEXT.md).

---

## What a module must not do

- **Import other modules** — No cross-module dependencies.
- **Access SQLite** — No direct database access; use Core's public API.
- **Access the filesystem** — No `fs` or `path` for domain data; use `ctx.workspace` in job context only.
- **Break the Core/Desktop/Module contract** — Use only documented IPC; do not receive Core handles in the renderer.
- **Introduce undocumented dependencies** — New deps require justification in [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md).

---

## Diagram

See [diagrams/module-models.md](../../diagrams/module-models.md) for Model A vs Model B.
