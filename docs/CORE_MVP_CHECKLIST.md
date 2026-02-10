
Core is MVP-complete when every item below passes.

## Workspace

- [x] Can initialize a workspace (creates `.aro/` directory)
- [x] Can safely resolve paths within workspace
- [x] Blocks `../` path traversal attempts
- [x] Can read/write text files via workspace service

## SQLite persistence

- [x] Creates SQLite db file on first run
- [x] Creates required tables idempotently
- [x] Stores and loads run history

## Runs

- [x] Can start a run and receive a runId
- [x] Can finish a run with status (success/error/cancelled)
- [x] Can list runs ordered by time

## Logs

- [x] Can append log entries during a run
- [x] Can stream logs to subscribers
- [x] Logs persist and can be reloaded after restart

## Artifacts

- [x] Can write an artifact to `.aro/artifacts/<runId>/...`
- [x] Artifacts are indexed in SQLite
- [x] Can list artifacts for a run

## Jobs

- [x] Can register a job definition
- [x] Can run a job and persist run record
- [x] Job can report progress events
- [x] Job can be cancelled via AbortSignal
- [x] Cancellation results in cancelled run status

## Tokens + Validation (minimum)

- [x] Can load tokens from `tokens/tokens.json` (or configured path)
- [x] Can save tokens back to disk
- [x] Can validate tokens via Zod at boundary
- [x] Validation returns a stable issue format

## Headless proof

- [x] All of the above works with Node only (no Desktop, no Electron)

## Architectural integrity

- [x] Core has no imports from `apps/` or `packages/modules/`
- [x] No SQL or filesystem access exists outside Core infra
