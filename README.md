# aro-studio-apps-dev

Design-system application suite: Core (headless engine), Desktop (Electron host), and Modules (feature modules). Built as a single repo with clear layering and dependency rules. Desktop and hello-world module MVPs are complete.

## Status

- **Desktop MVP:** Complete — workspace selection, jobs, runs, logs, artifacts, IPC, module loading. See [docs/DESKTOP_MVP_CHECKLIST.md](docs/DESKTOP_MVP_CHECKLIST.md).
- **Module MVP:** hello-world module complete — job registration, UI, logs and artifacts; no module-to-module imports or direct DB/filesystem access. See [docs/MODULE_MVP_CHECKLIST.md](docs/MODULE_MVP_CHECKLIST.md).
- **Stack:** Core (Node, SQLite, Zod); Desktop (Electron, React, TypeScript, shadcn + Tailwind); Modules (React; use `@aro/desktop/components` for the shared design system).

## Run / build

```bash
pnpm install
pnpm build
pnpm test
pnpm start   # Launch Desktop app
```

Per-package: `pnpm --filter @aro/core build|test`, `pnpm --filter @aro/desktop build|dev|start`. See [package.json](package.json) for scripts.

## Testing

Core tests run under Electron’s Node (better-sqlite3 ABI); see the test script in `packages/core`. If you see "Could not locate the bindings file", run `pnpm rebuild better-sqlite3`.

## Agents

Agent roles and execution order: [AGENTS.md](AGENTS.md).

## Documentation

Documentation lives in this repo:

- **Architecture and API:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CORE_PUBLIC_API.md](docs/CORE_PUBLIC_API.md), and other files in [docs/](docs/).
- **Checklists:** [docs/DESKTOP_MVP_CHECKLIST.md](docs/DESKTOP_MVP_CHECKLIST.md), [docs/MODULE_MVP_CHECKLIST.md](docs/MODULE_MVP_CHECKLIST.md).
- **UI/UX and a11y:** [docs/UI_UX_ACCESSIBILITY.md](docs/UI_UX_ACCESSIBILITY.md).
- **Agent roles and execution order:** [AGENTS.md](AGENTS.md).
- **Cursor rules:** [.cursor/rules/](.cursor/rules/) (e.g. CURSOR_RULES.md, README.md).
- **ADRs, decisions, diagrams:** [adr/](adr/), [decisions/](decisions/), [diagrams/](diagrams/).

**Before coding:** Read [.cursor/rules/README.md](.cursor/rules/README.md), then follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CORE_PUBLIC_API.md](docs/CORE_PUBLIC_API.md).
