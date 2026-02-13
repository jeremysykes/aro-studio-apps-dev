# Module Public API

This document defines the API surface for Modules: job registration and renderer IPC.

---

## Job registration

**Context:** Modules register jobs with Core via the host (Desktop or Web). Registration happens in the main/backend process when the host loads the module.

**Flow:**

1. Host (Desktop or Web) creates Core (when workspace is selected or from env).
2. Host loads the active module (via `ARO_ACTIVE_MODULE`, default `hello-world`; **`.env`** at project root; see [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md)) and invokes its init function, passing Core.
3. The module calls `core.jobs.register({ key, run })` for each job.

**Job key format:**

- Use namespaced keys for Model B (Sidebar) and C (Dashboard) readiness: `moduleKey:jobKey` (e.g. `hello-world:greet`).
- For Model A MVP with one module, `hello-world:greet` or similar is sufficient.

**Example:**

```ts
// In module init (main process)
core.jobs.register({
  key: 'hello-world:greet',
  run: async (ctx, input) => {
    ctx.logger('info', 'Hello from module');
    ctx.artifactWriter({ path: 'greeting.txt', content: 'Hello, World!' });
  },
});
```

---

## Renderer API (Model A MVP)

**Context:** Module UI runs in the renderer (Desktop) or browser (Web). It receives the same intent-based API from the host: Desktop exposes `window.aro` via IPC; Web exposes `window.aro` via HTTP/WS API. Same capability surface in both hosts.

**API:** `window.aro` — workspace, job, runs, logs, artifacts. See [desktop/DESKTOP_PUBLIC_API.md](../desktop/DESKTOP_PUBLIC_API.md) and [web/WEB_PUBLIC_API.md](../web/WEB_PUBLIC_API.md).

- No new IPC channels for Model A MVP.
- Module UI calls `window.aro.job.run('hello-world:greet')`, `window.aro.runs.list()`, etc.

---

## Future: Model B (Sidebar) and Model C (Dashboard) extensions

When moving beyond Model A (Standalone):

- **`window.aro.getUIModel()`** — New IPC channel to expose the active model (`standalone`, `sidebar`, `dashboard`) to the renderer. See [MODULE_MODELS.md](MODULE_MODELS.md) for configuration.
- **`window.aro.getEnabledModules()`** — Returns the list of enabled module keys (Model B/C). Not needed for Model A.
- **`module.*` namespace** — If modules need module-specific IPC (e.g. `module.tokens.getConfig`), add a `module` namespace to the preload API.
- **Module-scoped job keys** — Already required; `moduleKey:jobKey` format.
- **Widget export** — Model C requires modules to export a `Widget` component. See [MODULE_MODELS.md](MODULE_MODELS.md) for the contract.
- **Extension points** — Document any new IPC channels in this file when added.
