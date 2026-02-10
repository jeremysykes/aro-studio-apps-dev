
Goal: least dependency footprint while still shipping reliably.

## Allowed deps (Core MVP)

Core (`packages/core`) may use ONLY:

- `better-sqlite3` (SQLite persistence)
- `zod` (boundary validation)

Node built-ins are allowed.

## Not allowed (Core MVP)

- ORMs / query builders (Prisma, Drizzle, TypeORM, Kysely, etc.)
- IndexedDB / Dexie
- logging frameworks (unless explicitly approved)
- DI frameworks
- plugin systems

## Adding a dependency

If a new dependency is proposed:

1. Update this doc with:
   - dependency name
   - reason it is required
   - what it replaces / why built-in is insufficient
2. Keep the change scoped to the package that needs it.
3. Prefer zero-dependency solutions unless the dependency removes real risk.

If this doc is not updated first, the dependency is rejected.

---

## Allowed deps (Desktop MVP)

Desktop (`apps/desktop`) may use:

- **electron** — Electron host; required for desktop app. No built-in alternative.
- **react** — UI framework; per DESKTOP_MVP_CHECKLIST.md. Enables component-based UI composition.
- **react-dom** — React renderer for DOM; required with React. No built-in alternative.
- **electron-store** — Persist last workspace path; Desktop-owned state (not Core). Replaces manual JSON file handling; provides atomic writes and standard Electron app data path.
- **vite** — Renderer bundler; provides fast dev server, ESM bundling, and React/JSX support. Built-in Node or raw script loading is insufficient for renderer which needs JSX transpilation and proper module resolution.
- **@vitejs/plugin-react** — Vite plugin for React; enables JSX and Fast Refresh. Required when using React with Vite.

Dev-only: **typescript** (type-checking), **@types/react**, **@types/react-dom** (type definitions). **electron-rebuild** — Rebuilds native modules (e.g. better-sqlite3 from Core) for Electron's Node ABI. Required because Electron bundles a specific Node version; native modules built for the system Node will fail. Run as postinstall.
