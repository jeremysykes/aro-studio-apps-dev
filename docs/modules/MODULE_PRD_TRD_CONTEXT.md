# Context for writing module PRDs and TRDs

This document provides the application and module context needed to write **Product Requirements Documents (PRDs)** and **Technical Requirements Documents (TRDs)** for new Aro Studio modules. Use it when drafting requirements for upcoming modules (e.g. tokens, figma-sync). It is intended for both humans and LLMs.

---

## What Aro Studio is

Aro Studio is a modular desktop application built as a single monorepo. It has three parts:

1. **Core** (`packages/core`) — Headless engine (Node, SQLite, Zod). Provides workspace management, run/log/artifact persistence, job execution (run/cancel), and optional token/validation APIs. Core does not do plugin discovery, module loading, Electron, or UI.

2. **Desktop** (`apps/desktop`) — Electron host. Owns the main process, preload, IPC bridge, and lifecycle. Creates Core when a workspace is selected, loads the active module, and invokes the module’s init so the module can register jobs with Core. The renderer talks only to main via `window.aro` (preload API). Desktop does not implement business logic, persistence, or job execution; it forwards to Core. UI is implemented by a UI Engineer using the shared design system (shadcn + Tailwind); module UI may use `@aro/desktop/components`.

3. **Modules** (`packages/modules/*`) — Feature modules. Each module provides **job definitions** (registered with Core) and **UI** (React components inside the Desktop shell). Product-specific behavior and workflows live in modules.

**Dependency rules (non-negotiable):**

- Core must not import Desktop or Modules.
- Modules must not import each other.
- Desktop may import Core and Modules. Modules may import Desktop (e.g. for the shared design system).
- Modules must not touch SQLite or the filesystem directly; they use Core’s public API and the job context’s workspace facet only.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the source of truth on boundaries and dependency direction.

---

## How modules fit in

**Model A (current / Multi-Variant):** One active module per app. The module effectively *is* the app: it owns the main renderer content; Desktop hosts it. The active module is selected by `ARO_ACTIVE_MODULE` (default `hello-world`); for development, use **`.env`** at the project root (see [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md)). Job keys are namespaced for future use: `moduleKey:jobKey` (e.g. `hello-world:greet`).

**Model B (future / Dashboard):** One “Aro Studio” app with multiple modules (tabs/panels). Desktop would provide shell and navigation; multiple modules could be active. PRDs/TRDs for new modules should remain compatible with a possible move to Model B (namespaced job keys, no assumption that only one module exists).

See [MODULE_MODELS.md](MODULE_MODELS.md) for the full comparison.

**What a module provides:**

- **Job definitions** — One or more jobs registered with Core via `core.jobs.register({ key, run })` in the module’s init. Init runs in the main process when Desktop loads the module; Desktop passes the Core instance (or a facade) into the module’s init.
- **UI** — React components in the renderer. They trigger jobs and show runs/logs/artifacts only via `window.aro` (workspace, job, runs, logs, artifacts). No Core in the renderer; no custom IPC unless documented.

**What a module must not do:**

- Import other modules.
- Access SQLite or Core internals (no `better-sqlite3`, no `infra/db`).
- Use `fs`/`path` for domain data; only `ctx.workspace` in job code (resolve, readText, writeText, exists, mkdirp).
- Expose or use Core handles in the renderer; no undocumented IPC.
- Add dependencies without documenting them in [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md) (name, reason, what it replaces).

See [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) and [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md) for the full constraints.

---

## Job registration and execution (for TRDs)

- **Where:** Module’s init function, main process only. Desktop calls init after creating Core and passes Core (or a restricted facade).
- **Job key format:** `moduleKey:jobKey` (e.g. `tokens:export`, `figma:sync`).
- **Signature:** `core.jobs.register({ key: string, run: (ctx: JobContext, input?: unknown) => void | Promise<void> })`.
- **JobContext** in `run`: `logger(level, message)`, `workspace` (resolve, readText, writeText, exists, mkdirp), `artifactWriter({ path, content })`, `abort` (AbortSignal). Optional: `progress`.
- **Input:** Optional; for Model A MVP the UI may pass input when calling `window.aro.job.run(key, input)`.

See [core/CORE_PUBLIC_API.md](../core/CORE_PUBLIC_API.md) for the full JobDefinition and JobContext types.

---

## Renderer API for module UI (for PRDs/TRDs)

Module UI uses only **`window.aro`**. See [desktop/DESKTOP_PUBLIC_API.md](../desktop/DESKTOP_PUBLIC_API.md) for the full shape.

- **workspace:** `select()`, `getCurrent()`; subscribe to `workspace:changed` for updates.
- **job:** `run(jobKey, input?)` → `{ runId }`, `cancel(runId)`, `listRegistered()`.
- **runs:** `list()`, `get(runId)`.
- **logs:** `list(runId)`, `subscribe(runId, callback)` (live entries).
- **artifacts:** `list(runId)`, `read(runId, path)`.

Types: `Run`, `LogEntry`, `Artifact` (id, runId, status/path, timestamps, etc.). All methods are async (IPC).

---

## Reference implementation

**hello-world** (`packages/modules/hello-world`): One job `hello-world:greet`; init registers it with Core; UI uses `window.aro` to run the job and show runs, logs, and artifacts. UI uses `@aro/desktop/components` (Button, Card) and Tailwind. Use it as the pattern for “one module, one or more jobs, UI that only talks to `window.aro`.”

---

## What to produce for new modules

**PRD:** User-facing goals, workflows, and acceptance criteria for the module; which jobs exist from the user’s perspective; how the UI should behave (workspace, run job, view runs/logs/artifacts). Assume Model A (one module = app) but keep wording compatible with Model B. Call out a11y/design-system expectations per [meta/UI_UX_ACCESSIBILITY.md](../meta/UI_UX_ACCESSIBILITY.md) where relevant.

**TRD:** Job keys (`moduleKey:jobKey`); for each job: inputs, use of JobContext (workspace, logger, artifactWriter, abort, progress); no direct DB/fs; no inter-module imports; no new IPC unless documented in [MODULE_PUBLIC_API.md](MODULE_PUBLIC_API.md); new dependencies with justification in [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md). Reference [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md), [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md), and [MODULE_PUBLIC_API.md](MODULE_PUBLIC_API.md) as the authority for constraints and APIs.
