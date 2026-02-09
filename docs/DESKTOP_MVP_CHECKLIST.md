
Desktop is MVP-complete when every item below passes. This checklist defines what "done" means for the first Desktop iteration.

## Workspace

- [ ] User can select a workspace via a folder picker (or similar)
- [ ] User can open the app and see the last-used workspace offered (or workspace selection if none)
- [ ] Selecting a workspace initializes Core with that path
- [ ] Switching workspace shuts down the previous Core instance and initializes a new one
- [ ] Workspace path is never exposed to the renderer as a raw path (only via IPC responses if needed for display)

## Core lifecycle

- [ ] Core is created only in the main process when a workspace is selected
- [ ] `core.shutdown()` is called when switching workspace or quitting the app
- [ ] No Core code runs in the renderer

## Jobs

- [ ] At least one job is registered with Core (e.g. a trivial "hello" job) so the UI can trigger it
- [ ] User can trigger a job from the UI
- [ ] User receives a runId after triggering a job
- [ ] User can cancel a running job
- [ ] Job execution and cancellation go through Core only (no business logic in Desktop)

## Logs

- [ ] User can view logs for a run (list)
- [ ] User can subscribe to live log entries for a run
- [ ] Logs are displayed in the UI (e.g. in a list or panel)
- [ ] Log display uses data from Core only (no fake or mock logs)

## Artifacts

- [ ] User can list artifacts for a run
- [ ] User can view artifact content (read) for a run
- [ ] Artifacts are displayed in the UI
- [ ] Artifact paths and content come from Core only

## IPC and preload

- [ ] All renderer ↔ main communication goes through the preload API (contextBridge)
- [ ] No Node integration, no require, no direct Core access in the renderer
- [ ] IPC channels match DESKTOP_PUBLIC_API.md (workspace, job, runs, logs, artifacts)
- [ ] Types (Run, LogEntry, Artifact) are consistent between main and renderer

## UI and stack

- [ ] UI is built with React
- [ ] Markup uses semantic HTML
- [ ] TypeScript is used for both main and renderer
- [ ] Single main window (no multi-window for MVP)

## Lifecycle

- [ ] App startup shows workspace selection or last workspace
- [ ] App quit triggers Core shutdown before exit
- [ ] No module loading (Modules are out of scope for MVP)

## Definition of done

Desktop MVP is **done** when:

1. All checklist items above pass.
2. The app can be built and run (`pnpm build`, launch Electron).
3. A user can: select workspace → trigger a job → see logs and artifacts.
4. DESKTOP_ARCHITECTURE.md, DESKTOP_PUBLIC_API.md, and this checklist are followed.
5. No new dependencies were added without updating DEPENDENCIES.md.
6. CURSOR_RULES.md (including Desktop rules) is respected.
