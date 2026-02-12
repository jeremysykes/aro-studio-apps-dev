
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
- **@aro/module-hello-world** — Model A active module (default). Desktop loads it after Core init, calls its `init(core)` to register jobs, and renders its UI in the main content area.
- **@aro/module-inspect** — Inspect module (in QA). Loaded when `ARO_ACTIVE_MODULE=inspect`. Same contract as hello-world; see [docs/desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md).
- **dotenv** — Developer convenience: loads `ARO_ACTIVE_MODULE` (and other vars) from **`.env`** at the project root at startup so developers can switch modules without setting the env var in the shell. No new IPC or config layer.
- **tailwindcss** — Utility-first CSS for the design system (shadcn). shadcn/ui depends on Tailwind for component styling. Replaces ad-hoc inline styles and manual CSS for consistency.
- **postcss**, **autoprefixer** — Required for Tailwind build pipeline. Vite uses PostCSS when postcss.config.js is present.
- **tailwindcss-animate** — Optional animation utilities used by shadcn components (e.g. transitions).
- **class-variance-authority** (cva), **clsx**, **tailwind-merge** — Used by shadcn for component variants and className merging. Standard shadcn setup.
- **@radix-ui/react-slot** — Radix primitive used by shadcn Button (composition/asChild). Provides accessible, unstyled behavior; styling via Tailwind.
- **@radix-ui/react-tabs** — Radix primitive for accessible tabs. Used by shadcn Tabs for Setup/Logs/Reports navigation in Inspect. Provides keyboard navigation and ARIA semantics; styling via Tailwind.

Dev-only: **typescript** (type-checking), **@types/react**, **@types/react-dom** (type definitions). **electron-rebuild** — Rebuilds native modules (e.g. better-sqlite3 from Core) for Electron's Node ABI. Required because Electron bundles a specific Node version; native modules built for the system Node will fail. Run as postinstall.

---

## Allowed deps (Web MVP)

Web (`apps/web`) may use:

- **electron** — Required so the web server runs under Electron's Node for better-sqlite3 ABI compatibility (same build as Desktop). No alternative when Core uses native SQLite.
- **express** — HTTP API server; required for web backend. No built-in Node HTTP server with routing is as standard. Replaces manual HTTP handling.
- **cors** — Allow frontend (different origin in dev) to call API. Standard CORS middleware.
- **ws** — WebSocket for live log subscription; mirrors Desktop's IPC `logs:subscribe`. No built-in WebSocket server in Node.
- **vite** — Client bundler; same as Desktop. Provides fast dev server, ESM bundling, React/JSX support.
- **@vitejs/plugin-react** — Vite plugin for React; same as Desktop.
- **react** / **react-dom** — UI framework; same as Desktop.
- **dotenv** — Load `ARO_ACTIVE_MODULE`, `ARO_WORKSPACE_ROOT` from `.env` at project root; same pattern as Desktop.
- **@aro/core** — Core engine; Web backend runs Core.
- **@aro/module-hello-world** — Default active module.
- **@aro/module-inspect** — Inspect module (when `ARO_ACTIVE_MODULE=inspect`).
- **@aro/desktop** (components subpath) — Shared design system; module UI uses shadcn components. Same as modules.
- **tailwindcss**, **postcss**, **autoprefixer**, **tailwindcss-animate**, **class-variance-authority**, **clsx**, **tailwind-merge**, **@radix-ui/react-slot** — Design system; same as Desktop/client.

Dev-only: **typescript**, **@types/react**, **@types/react-dom**, **@types/ws** (type definitions), **nodemon** (restart server when dist/server changes for hot-reload). Dev is run via the root orchestrator (`pnpm web`), which starts API then Vite after readiness; see `dev/dev-web.ts`.

---

## Root / monorepo

Root (`package.json` at repo root) dev-only:

- **tsx** — Runs `dev/dev-web.ts` for deterministic Web dev orchestrator. Starts API first, waits for readiness (`SERVER_READY`), then starts Vite; prefixed logs, clean shutdown, cross-platform. No built-in Node runner for TypeScript in `dev/` without adding a build step; tsx provides zero-config ESM + TS execution.

---

## Allowed deps (Modules)

Modules (`packages/modules/*`) may use:

- **@aro/core** — Types only for init in the main process (e.g. `AroCore`). The module receives Core from Desktop when `init(core)` is called; the module must not import Core in renderer code so the renderer bundle stays free of native modules.
- **react** / **react-dom** — Peer dependencies for module UI. Desktop supplies them when bundling the module's React component; the module does not list them as direct dependencies to avoid duplicate React in the renderer.
- **@aro/desktop** (components subpath) — When a module uses the shared design system, it may depend on Desktop's exported UI components (e.g. `@aro/desktop/components`). Reason: shared design system; module UI uses shadcn components from Desktop. Replaces: ad-hoc inline styles and manual styling in the module.
- **pdfkit** (inspect module only) — PDF generation for export. Reason: inspect module exports report as PDF with tables. No built-in Node option for PDF; required for "Export PDF" feature.

New module dependencies require justification in this doc (name, reason, what it replaces) before addition.
