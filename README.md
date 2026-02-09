# aro-studio-apps-dev

Design-system application suite: Core (headless engine), Desktop (Electron host), and Modules (feature modules). Built as a single repo with clear layering and dependency rules.

## Run / build

```bash
pnpm install
pnpm build
pnpm test
```

See [package.json](package.json) for scripts.

## Documentation

Documentation lives in this repo:

- **Architecture and API:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CORE_PUBLIC_API.md](docs/CORE_PUBLIC_API.md), and other files in [docs/](docs/).
- **Agent roles and execution order:** [AGENTS.md](AGENTS.md).
- **Cursor rules:** [.cursor/rules/](.cursor/rules/) (e.g. CURSOR_RULES.md, README.md).
- **ADRs, decisions, diagrams:** [adr/](adr/), [decisions/](decisions/), [diagrams/](diagrams/).

**Before coding:** Read [.cursor/rules/README.md](.cursor/rules/README.md), then follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CORE_PUBLIC_API.md](docs/CORE_PUBLIC_API.md).
