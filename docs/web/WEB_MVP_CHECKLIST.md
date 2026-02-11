
Web is MVP-complete when every item below passes. This checklist defines what "done" means for the first Web iteration. Web must achieve the same level of functionality as Desktop within its constraints (workspace from env, HTTP/WS instead of IPC).

## Workspace

- [ ] Backend provides a workspace to Core (from `ARO_WORKSPACE_ROOT` or `process.cwd()` for MVP)
- [ ] Frontend can get current workspace via API (`GET /api/workspace/current`)
- [ ] Workspace path is never exposed to the frontend as a raw path for direct access (only for display if needed)

## Core lifecycle

- [ ] Core is created only in the backend (Node) when the server starts
- [ ] `core.shutdown()` is called when the server exits
- [ ] No Core code runs in the frontend (browser)

## Jobs

- [ ] At least one job is registered with Core (via active module's `init(core)`) so the UI can trigger it
- [ ] User can trigger a job from the UI
- [ ] User receives a runId after triggering a job
- [ ] User can cancel a running job
- [ ] Job execution and cancellation go through Core only (no business logic in Web)

## Logs

- [ ] User can view logs for a run (list)
- [ ] User can subscribe to live log entries for a run (WebSocket)
- [ ] Logs are displayed in the UI (e.g. in a list or panel)
- [ ] Log display uses data from Core only (no fake or mock logs)

## Artifacts

- [ ] User can list artifacts for a run
- [ ] User can view artifact content (read) for a run
- [ ] Artifacts are displayed in the UI
- [ ] Artifact paths and content come from Core only

## API and frontend

- [ ] All frontend ↔ backend communication goes through the HTTP/WS API
- [ ] No direct Core access in the frontend
- [ ] API surface matches WEB_PUBLIC_API.md (workspace, job, runs, logs, artifacts, app/active-module)
- [ ] Types (Run, LogEntry, Artifact) are consistent between frontend and backend

## UI and stack

- [ ] Frontend is built with React
- [ ] Markup uses semantic HTML
- [ ] TypeScript is used for both frontend and backend
- [ ] Same module UI components as Desktop (hello-world, inspect)

## Lifecycle

- [ ] Server startup initializes Core with workspace from env
- [ ] Server exit triggers Core shutdown before process exit
- [ ] Web loads the active module after Core init (ARO_ACTIVE_MODULE, default hello-world) and uses module-registered job keys for the API; module UI is rendered in main content

## Definition of done

Web MVP is **done** when:

1. All checklist items above pass.
2. The app can be built and run (`pnpm build`, `pnpm web`).
3. A user can: open the app in a browser → trigger a job → see logs and artifacts.
4. WEB_ARCHITECTURE.md, WEB_PUBLIC_API.md, and this checklist are followed.
5. No new dependencies were added without updating DEPENDENCIES.md.
6. CURSOR_RULES.md (including Web rules) is respected.
