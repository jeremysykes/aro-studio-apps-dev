# Module Public API

This document defines the API surface for Modules: job registration and renderer IPC.

---

## Job registration

**Context:** Modules register jobs with Core via Desktop. Registration happens in the main process when Desktop loads the module.

**Flow:**

1. Desktop creates Core (when workspace is selected).
2. Desktop loads the active module and invokes its init function, passing Core.
3. The module calls `core.jobs.register({ key, run })` for each job.

**Job key format:**

- Use namespaced keys for Model B readiness: `moduleKey:jobKey` (e.g. `hello-world:greet`).
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

**Context:** Module UI runs in the renderer. It uses the same IPC surface as the current Desktop UI.

**API:** `window.aro` — workspace, job, runs, logs, artifacts. See [docs/DESKTOP_PUBLIC_API.md](DESKTOP_PUBLIC_API.md).

- No new IPC channels for Model A MVP.
- Module UI calls `window.aro.job.run('hello-world:greet')`, `window.aro.runs.list()`, etc.

---

## Future: Model B extensions

When moving to the Dashboard model:

- **`module.*` namespace** — If modules need module-specific IPC (e.g. `module.tokens.getConfig`), add a `module` namespace to the preload API.
- **Module-scoped job keys** — Already required; `moduleKey:jobKey` format.
- **Extension points** — Document any new IPC channels in this file when added.
