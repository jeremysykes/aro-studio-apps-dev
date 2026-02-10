
Desktop is MVP-complete when every item below passes. This checklist defines what "done" means for the first Desktop iteration.

## Workspace

- [x] User can select a workspace via a folder picker (or similar)
- [x] User can open the app and see the last-used workspace offered (or workspace selection if none)
- [x] Selecting a workspace initializes Core with that path
- [x] Switching workspace shuts down the previous Core instance and initializes a new one
- [x] Workspace path is never exposed to the renderer as a raw path (only via IPC responses if needed for display)

## Core lifecycle

- [x] Core is created only in the main process when a workspace is selected
- [x] `core.shutdown()` is called when switching workspace or quitting the app
- [x] No Core code runs in the renderer

## Jobs

- [x] At least one job is registered with Core (e.g. a trivial "hello" job) so the UI can trigger it
- [x] User can trigger a job from the UI
- [x] User receives a runId after triggering a job
- [x] User can cancel a running job
- [x] Job execution and cancellation go through Core only (no business logic in Desktop)

## Logs

- [x] User can view logs for a run (list)
- [x] User can subscribe to live log entries for a run
- [x] Logs are displayed in the UI (e.g. in a list or panel)
- [x] Log display uses data from Core only (no fake or mock logs)

## Artifacts

- [x] User can list artifacts for a run
- [x] User can view artifact content (read) for a run
- [x] Artifacts are displayed in the UI
- [x] Artifact paths and content come from Core only

## IPC and preload

- [x] All renderer ↔ main communication goes through the preload API (contextBridge)
- [x] No Node integration, no require, no direct Core access in the renderer
- [x] IPC channels match DESKTOP_PUBLIC_API.md (workspace, job, runs, logs, artifacts)
- [x] Types (Run, LogEntry, Artifact) are consistent between main and renderer

## UI and stack

- [x] UI is built with React
- [x] Markup uses semantic HTML
- [x] TypeScript is used for both main and renderer
- [x] Single main window (no multi-window for MVP)

## Lifecycle

- [x] App startup shows workspace selection or last workspace
- [x] App quit triggers Core shutdown before exit
- [x] No module loading (Modules are out of scope for MVP)

## Definition of done

Desktop MVP is **done** when:

1. All checklist items above pass.
2. The app can be built and run (`pnpm build`, launch Electron).
3. A user can: select workspace → trigger a job → see logs and artifacts.
4. DESKTOP_ARCHITECTURE.md, DESKTOP_PUBLIC_API.md, and this checklist are followed.
5. No new dependencies were added without updating DEPENDENCIES.md.
6. CURSOR_RULES.md (including Desktop rules) is respected.
