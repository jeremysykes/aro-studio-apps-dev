
Core is MVP-complete when every item below passes.

## Workspace

- [ ] Can initialize a workspace (creates `.aro/` directory)
- [ ] Can safely resolve paths within workspace
- [ ] Blocks `../` path traversal attempts
- [ ] Can read/write text files via workspace service

## SQLite persistence

- [ ] Creates SQLite db file on first run
- [ ] Creates required tables idempotently
- [ ] Stores and loads run history

## Runs

- [ ] Can start a run and receive a runId
- [ ] Can finish a run with status (success/error/cancelled)
- [ ] Can list runs ordered by time

## Logs

- [ ] Can append log entries during a run
- [ ] Can stream logs to subscribers
- [ ] Logs persist and can be reloaded after restart

## Artifacts

- [ ] Can write an artifact to `.aro/artifacts/<runId>/...`
- [ ] Artifacts are indexed in SQLite
- [ ] Can list artifacts for a run

## Jobs

- [ ] Can register a job definition
- [ ] Can run a job and persist run record
- [ ] Job can report progress events
- [ ] Job can be cancelled via AbortSignal
- [ ] Cancellation results in cancelled run status

## Tokens + Validation (minimum)

- [ ] Can load tokens from `tokens/tokens.json` (or configured path)
- [ ] Can save tokens back to disk
- [ ] Can validate tokens via Zod at boundary
- [ ] Validation returns a stable issue format

## Headless proof

- [ ] All of the above works with Node only (no Desktop, no Electron)

## Architectural integrity

- [ ] Core has no imports from `apps/` or `packages/modules/`
- [ ] No SQL or filesystem access exists outside Core infra
