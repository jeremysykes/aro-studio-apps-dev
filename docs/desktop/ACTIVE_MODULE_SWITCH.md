# Active module switch

Which module loads (main process job init and renderer root UI) is controlled by a **single configuration**: the `ARO_ACTIVE_MODULE` environment variable.

## How to switch modules

- **Default:** When `ARO_ACTIVE_MODULE` is unset or empty, the app loads **hello-world**.
- **Valid module IDs:** `hello-world` (default), `inspect` (in QA, not production-ready).
- **Inspect:** Set `ARO_ACTIVE_MODULE=inspect` when starting the app.

### Using .env (development)

For development you can set the active module in a `.env` file so you don’t need to pass the env var each time. Create `apps/desktop/.env` (or copy from `apps/desktop/.env.example`), set `ARO_ACTIVE_MODULE=hello-world` or `ARO_ACTIVE_MODULE=inspect`, then restart the app. Shell/inline env var overrides `.env` if both are set.

### Inline / shell

Examples:

```bash
# Run with default (hello-world)
pnpm start

# Run with inspect module
ARO_ACTIVE_MODULE=inspect pnpm start
```

On Windows (PowerShell): `$env:ARO_ACTIVE_MODULE="inspect"; pnpm start`

Restart the app after changing the variable; no rebuild required.

**Invalid value:** If `ARO_ACTIVE_MODULE` is set to an unknown module key, the main process loads the default module (`hello-world`) and logs a warning; the renderer shows an error screen with the invalid value and lists valid options (`hello-world`, `inspect`).

## Adding a new module

1. Add the module package to `apps/desktop/package.json` dependencies (e.g. `"@aro/module-foo": "workspace:*"`).
2. Register the module in **main process:** [apps/desktop/src/main/moduleRegistry.ts](apps/desktop/src/main/moduleRegistry.ts) — import its `init` and call `register('foo', init)`.
3. Register the module in **renderer:** [apps/desktop/src/renderer/moduleRegistry.tsx](apps/desktop/src/renderer/moduleRegistry.tsx) — import its root UI component and add `'foo': FooApp` to `moduleComponents`.

No edits to `moduleLoader.ts` or `App.tsx` logic; they resolve the active module from the registry using `ARO_ACTIVE_MODULE`.

## References

- [decisions/active-module-single-switch.md](../decisions/active-module-single-switch.md)
- [docs/modules/MODULE_ARCHITECTURE.md](../modules/MODULE_ARCHITECTURE.md)
