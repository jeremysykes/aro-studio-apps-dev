# aro-studio-apps-dev

Design-system application suite: Core (headless engine), Desktop (Electron host), and Modules (feature modules). Built as a single repo with clear layering and dependency rules. Desktop and hello-world module MVPs are complete.

## Status

- **Desktop MVP:** Complete — workspace selection, jobs, runs, logs, artifacts, IPC, module loading. See [docs/desktop/DESKTOP_MVP_CHECKLIST.md](docs/desktop/DESKTOP_MVP_CHECKLIST.md).
- **Module MVP:** hello-world and inspect modules — job registration, UI, logs and artifacts; no module-to-module imports or direct DB/filesystem access. See [docs/modules/MODULE_MVP_CHECKLIST.md](docs/modules/MODULE_MVP_CHECKLIST.md). Inspect: design-system diagnostic (tokens, components, health report); see [docs/modules/inspect/Design-spec.md](docs/modules/inspect/Design-spec.md).
- **Stack:** Core (Node, SQLite, Zod); Desktop (Electron, React, TypeScript, shadcn + Tailwind); Modules (React; use `@aro/desktop/components` for the shared design system).

## Run / build

```bash
pnpm install
pnpm build
pnpm test
pnpm start   # Launch Desktop app
```

Per-package: `pnpm --filter @aro/core build|test`, `pnpm --filter @aro/desktop build|dev|start`. See [package.json](package.json) for scripts.

**Switch active module:** When `ARO_ACTIVE_MODULE` is not set, the app loads **hello-world** (default). Valid module IDs: **`hello-world`** (default) and **`inspect`**. The **inspect** module is currently **in QA** (not yet production-ready).

- **.env for development:** Set the active module in a `.env` file so you don't need to pass the env var each time. The Desktop app loads `apps/desktop/.env` at startup (when present). Set `ARO_ACTIVE_MODULE=hello-world` or `ARO_ACTIVE_MODULE=inspect`, then restart the app. No rebuild. Shell/inline env var overrides `.env` if both are set.
- **Env example file:** A template lives at **`apps/desktop/.env.example`**. It contains `ARO_ACTIVE_MODULE=hello-world`. Copy it to `apps/desktop/.env` and edit as needed: `cp apps/desktop/.env.example apps/desktop/.env`

See [docs/desktop/ACTIVE_MODULE_SWITCH.md](docs/desktop/ACTIVE_MODULE_SWITCH.md) for full details (inline/shell, adding new modules).

## Testing

Core tests run under Electron’s Node (better-sqlite3 ABI); see the test script in `packages/core`. If you see "Could not locate the bindings file", run `pnpm rebuild better-sqlite3`.

## Agents

Agent roles and execution order: [AGENTS.md](AGENTS.md).

## Documentation

Documentation lives in this repo:

- **Architecture and API:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/core/CORE_PUBLIC_API.md](docs/core/CORE_PUBLIC_API.md). See [docs/README.md](docs/README.md) for the full index by layer (core/, desktop/, modules/, meta/).
- **Checklists:** [docs/desktop/DESKTOP_MVP_CHECKLIST.md](docs/desktop/DESKTOP_MVP_CHECKLIST.md), [docs/modules/MODULE_MVP_CHECKLIST.md](docs/modules/MODULE_MVP_CHECKLIST.md).
- **UI/UX and a11y:** [docs/meta/UI_UX_ACCESSIBILITY.md](docs/meta/UI_UX_ACCESSIBILITY.md).
- **Agent roles and execution order:** [AGENTS.md](AGENTS.md).
- **Cursor rules:** [.cursor/rules/](.cursor/rules/) (e.g. CURSOR_RULES.md, README.md).
- **ADRs, decisions, diagrams:** [adr/](adr/), [decisions/](decisions/), [diagrams/](diagrams/).

**Before coding:** Read [.cursor/rules/README.md](.cursor/rules/README.md), then follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/core/CORE_PUBLIC_API.md](docs/core/CORE_PUBLIC_API.md).
