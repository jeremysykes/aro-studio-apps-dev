
Web is MVP-complete when every item below passes. This checklist defines what "done" means for the first Web iteration. Web must achieve the same level of functionality as Desktop within its constraints (workspace from env, HTTP/WS instead of IPC).

## Workspace

- [x] Backend provides a workspace to Core (from `ARO_WORKSPACE_ROOT` or `process.cwd()` for MVP)
- [x] Frontend can get current workspace via API (`GET /api/workspace/current`)
- [x] Workspace path is never exposed to the frontend as a raw path for direct access (only for display if needed)

## Core lifecycle

- [x] Core is created only in the backend (Node) when the server starts
- [x] `core.shutdown()` is called when the server exits
- [x] No Core code runs in the frontend (browser)

## Jobs

- [x] At least one job is registered with Core (via active module's `init(core)`) so the UI can trigger it
- [x] User can trigger a job from the UI
- [x] User receives a runId after triggering a job
- [x] User can cancel a running job
- [x] Job execution and cancellation go through Core only (no business logic in Web)

## Logs

- [x] User can view logs for a run (list)
- [x] User can subscribe to live log entries for a run (WebSocket)
- [x] Logs are displayed in the UI (e.g. in a list or panel)
- [x] Log display uses data from Core only (no fake or mock logs)

## Artifacts

- [x] User can list artifacts for a run
- [x] User can view artifact content (read) for a run
- [x] Artifacts are displayed in the UI
- [x] Artifact paths and content come from Core only

## API and frontend

- [x] All frontend ↔ backend communication goes through the HTTP/WS API
- [x] No direct Core access in the frontend
- [x] API surface matches WEB_PUBLIC_API.md (workspace, job, runs, logs, artifacts, app/active-module)
- [x] Types (Run, LogEntry, Artifact) are consistent between frontend and backend

## UI and stack

- [x] Frontend is built with React
- [x] Markup uses semantic HTML
- [x] TypeScript is used for both frontend and backend
- [x] Same module UI components as Desktop (hello-world, inspect)

## Lifecycle

- [x] Server startup initializes Core with workspace from env
- [x] Server exit triggers Core shutdown before process exit
- [x] Web loads the active module after Core init (ARO_ACTIVE_MODULE, default hello-world) and uses module-registered job keys for the API; module UI is rendered in main content

## Definition of done

Web MVP is **done** when:

1. All checklist items above pass.
2. The app can be built and run (`pnpm build`, `pnpm web`).
3. A user can: open the app in a browser → trigger a job → see logs and artifacts.
4. WEB_ARCHITECTURE.md, WEB_PUBLIC_API.md, and this checklist are followed.
5. No new dependencies were added without updating DEPENDENCIES.md.
6. CURSOR_RULES.md (including Web rules) is respected.
