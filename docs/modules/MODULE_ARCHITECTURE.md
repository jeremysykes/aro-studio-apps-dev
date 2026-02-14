# Module Architecture

This document defines Modules' responsibilities, boundaries, and relationship to Core and Desktop. It is the source of truth for Module design decisions.

## Dependency direction

```
@aro/types ◄─── @aro/config
    ▲               ▲
    │               │
@aro/core ──────────┘
(registry, loader, adapter)
    ▲
    │
@aro/modules/* ─── register via @aro/core
    ▲
    │
Host (desktop / web)
├── server: thin wrappers over @aro/core registry + loader
├── transport: IPC (desktop) or HTTP/WS (web) — delegates through CoreAdapter
└── renderer: shared shell from @aro/ui/shell (ShellRouter, moduleRegistry)
```

- Modules register jobs with Core via `core.jobs.register()` inside their `ModuleInit` function.
- Module registration (which modules exist) and module loading (calling init) both live in `@aro/core`.
- Hosts are thin wrappers: they call `registerModule()`, `resolveConfig()`, `loadModules()` from `@aro/core`.
- Hosts delegate Core operations through `createCoreAdapter()` — only transport and host-specific operations (workspace dialog, log push) remain in host code.
- Renderer-side module metadata (icons, components) lives in `@aro/ui/shell`; host renderer registries are thin re-exports.
- Modules MUST NOT import each other.
- Core MUST NOT import hosts or modules.

Dependency flow is one-way: hosts → core → types.

---

## Standalone Model (MVP)

The MVP uses the Standalone Model. See [MODULE_MODELS.md](MODULE_MODELS.md) for the full comparison.

- **One active module** — The active module is selected by `ARO_ACTIVE_MODULE` (default `hello-world` when unset); for development, set it in **`.env`** at the project root. See [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md).
- **Module owns the UI** — The module provides the main renderer content; Desktop hosts it.
- **Job registration** — Desktop creates Core, loads the module, passes Core to the module's init; the module calls `core.jobs.register()`.

---

## Job registration flow

1. At startup, the host imports its `moduleRegistry.ts` which calls `registerModule(key, init)` from `@aro/core` for each built-in module.
2. The host calls `resolveConfig(configDir)` from `@aro/core` to load tenant config.
3. User selects workspace; host calls `createCore({ workspaceRoot })`.
4. Host calls `loadModules(core, setRegisteredJobKeys)` from `@aro/core`. This:
   - Reads enabled module keys from resolved config
   - In standalone mode, loads only the first module
   - Calls each module's `ModuleInit` function with Core
   - Collects returned job keys into host state
5. The module's init calls `core.jobs.register({ key, run })` for each job it provides.
6. The renderer uses `window.aro.job.run(key)`, `window.aro.runs.list()`, etc. — transport is host-specific (IPC for desktop, HTTP/WS for web), but all operations delegate through `CoreAdapter`.

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

See [diagrams/module-models.md](../../diagrams/module-models.md) for Standalone, Sidebar, and Dashboard model diagrams.
