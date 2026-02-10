# Plan: Load ARO_ACTIVE_MODULE from .env for developers

Implementation of the README .env and env example flow is tracked in the plan at `.cursor/plans/readme_.env_and_env_example_c6419ce7.plan.md`.

**Goal:** Let developers set `ARO_ACTIVE_MODULE` in a `.env` file so they can switch modules (hello-world vs inspect) without typing the env var each time or changing their shell.

---

## Scope

- **Desktop app only** — Electron main process loads `.env` before any code reads `process.env.ARO_ACTIVE_MODULE`.
- **Developer convenience** — Documented as the recommended way to switch modules during development. Inline env var and system env still work and override `.env`.
- **No change to registry or renderer** — `moduleRegistry.getActiveModuleKey()` continues to use `process.env.ARO_ACTIVE_MODULE ?? 'hello-world'`; we only ensure that variable is populated from `.env` when present.

---

## 1. Add dotenv dependency (Desktop)

- **Package:** `dotenv` (e.g. `^16.4.5` or current stable).
- **Where:** `apps/desktop/package.json` **dependencies** (so it’s available when running `pnpm start` or a packaged app; optional at runtime if no `.env` exists).
- **Justification (for docs/meta/DEPENDENCIES.md):** Loads `.env` into `process.env` so developers can set `ARO_ACTIVE_MODULE` (and other dev config) in a file instead of the shell. Replaces the need to remember inline env vars or shell exports when switching modules.

---

## 2. Load .env at the very start of the main process

- **File:** `apps/desktop/src/main/index.ts`.
- **Requirement:** `.env` must be loaded **before** any module that reads `process.env.ARO_ACTIVE_MODULE` is loaded. That includes `moduleLoader.js` (which imports `moduleRegistry.js`). So dotenv must run before any other application imports.

**Approach A (recommended):** First line of `index.ts`:

```ts
import 'dotenv/config';
```

Then the rest of the imports (`electron`, `path`, `fs`, `./ipc`, etc.). The `dotenv/config` side-effect import runs `dotenv.config()` and loads `.env` from `process.cwd()` by default.

**Approach B:** Create a tiny bootstrap file `apps/desktop/src/main/env.ts` that only does:

```ts
import { config } from 'dotenv';
config();
```

Then in `index.ts` make the first line `import './env.js';`. Use this if you want to customize `path` or `encoding` later (e.g. load from repo root).

- **Where `.env` is resolved:** By default `dotenv` uses `path.resolve(process.cwd(), '.env')`. When running `pnpm start` (or `pnpm --filter @aro/desktop start`), the script runs with cwd = `apps/desktop`, so `.env` should live in **`apps/desktop/.env`**. (Current implementation loads from **project root** `.env` instead; see plan at `.cursor/plans/env_at_project_root_*.plan.md`.) Document the chosen location.

---

## 3. .env.example and .gitignore

- **Add** `.env.example` at the project root (or formerly `apps/desktop/.env.example`) with one line, e.g.:

  ```bash
  # Active module: hello-world | inspect
  ARO_ACTIVE_MODULE=hello-world
  ```

  So developers can `cp .env.example .env` and edit.

- **Add** `.env` to the repo root `.gitignore`. This avoids committing local overrides. (Root `.gitignore` contains:

  ```
  .env
  ```

  so that the project root `.env` is ignored.)

---

## 4. Documentation updates

- **docs/desktop/ACTIVE_MODULE_SWITCH.md**
  - Add a “Using .env (development)” section: create **`.env`** at the project root (or copy from **`.env.example`**) and set `ARO_ACTIVE_MODULE=inspect` or `hello-world`; restart the app. No rebuild. Inline env var still overrides `.env` if both are set.
  - Keep the existing “How to switch modules” section for CLI/shell (inline and export).

- **docs/meta/DEPENDENCIES.md** (Desktop section)
  - Add **dotenv** with: developer convenience for loading `ARO_ACTIVE_MODULE` (and optional other vars) from `.env`; replaces the need to set the env var in the shell or inline when starting the app.

- **README.md** (optional)
  - In the “Switch active module” sentence, add: “Or set `ARO_ACTIVE_MODULE` in the project root **`.env`** (see [docs/desktop/ACTIVE_MODULE_SWITCH.md](docs/desktop/ACTIVE_MODULE_SWITCH.md)).”

---

## 5. Verification

- With no `.env`: app loads default module (hello-world).
- With project root **`.env`** containing `ARO_ACTIVE_MODULE=inspect`: after restart, inspect module loads.
- With `ARO_ACTIVE_MODULE=hello-world` set in the shell and `.env` containing `ARO_ACTIVE_MODULE=inspect`: shell wins (Node/Electron: env var overrides dotenv).
- Run `pnpm build` and `pnpm start` from repo root; confirm no regression.

---

## 6. Summary checklist

| Step | Action |
|------|--------|
| 1 | Add `dotenv` to `apps/desktop/package.json` dependencies; run `pnpm install`. |
| 2 | In `apps/desktop/src/main/index.ts`, add `import 'dotenv/config';` as the first line. |
| 3 | Create **`.env.example`** at the project root with `ARO_ACTIVE_MODULE=hello-world`. |
| 4 | Add `.env` to `.gitignore` (root or `apps/desktop` as chosen). |
| 5 | Update `docs/desktop/ACTIVE_MODULE_SWITCH.md` (`.env` section). |
| 6 | Update `docs/meta/DEPENDENCIES.md` (dotenv entry for Desktop). |
| 7 | Optionally update README “Switch active module” line. |
| 8 | Verify behavior with and without `.env`. |

---

## References

- [docs/desktop/ACTIVE_MODULE_SWITCH.md](ACTIVE_MODULE_SWITCH.md)
- [docs/meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md)
- [decisions/active-module-single-switch.md](../../decisions/active-module-single-switch.md)
