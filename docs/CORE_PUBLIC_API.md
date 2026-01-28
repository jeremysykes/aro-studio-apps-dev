# Core Public API (MVP)

This file defines the only Core surface that Desktop and Modules can rely on.
If the API needs to change, update this doc first.

## Entry point

- `createCore(options): AroCore`

### createCore(options)

Options (MVP):

- `workspaceRoot: string` (absolute path)
- `dbPath?: string` (defaults to `${workspaceRoot}/.aro/aro.sqlite`)
- `tokensPath?: string` (defaults to `${workspaceRoot}/tokens/tokens.json`)

## AroCore shape (MVP)

- `core.workspace`
- `core.runs`
- `core.logs`
- `core.artifacts`
- `core.jobs`
- `core.tokens`
- `core.validation`
- `core.shutdown()`

## workspace

- `initWorkspace(): void`
- `resolve(relPath: string): string` (safe resolve within workspace)
- `readText(relPath: string): string`
- `writeText(relPath: string, content: string): void`
- `exists(relPath: string): boolean`
- `mkdirp(relDir: string): void`

## runs

- `startRun(params?): { runId: string }` (params optional; no required fields for MVP)
- `finishRun(params): void` — params: `{ runId: string; status: 'success' | 'error' | 'cancelled' }`
- `getRun(runId: string): Run | null`
- `listRuns(filter?): Run[]`

## logs

- `appendLog(entry): void` — entry: `{ runId: string; level: string; message: string }`
- `listLogs(runId: string): LogEntry[]`
- `subscribe(runId: string, handler): Unsubscribe`

## artifacts

- `writeArtifact(params): Artifact` — params: `{ runId: string; path: string; content: string }`
- `listArtifacts(runId: string): Artifact[]`

## jobs

- `register(jobDef): void`
- `run(jobKey: string, input: unknown): { runId: string }`
  Note: Job results and outputs are retrieved via runs, logs, and artifacts.
  Jobs do not return results synchronously.
- `cancel(runId: string): void`

## tokens

- `loadTokens(): unknown`
- `saveTokens(tokens: unknown): void`
- `diffTokens(a: unknown, b: unknown): TokenDiff`

## validation

- `validateTokens(tokens: unknown): ValidationResult`

## Types (MVP)

- `Run`
- `LogEntry`
- `Artifact`
- `ValidationIssue`
- `ValidationResult`
- `TokenDiff` (return type of `tokens.diffTokens`)
- `JobDefinition`
- `JobContext`
- `AroCore` (return type of `createCore`)
- `AroCoreOptions` (options for `createCore`: `workspaceRoot`, `dbPath?`, `tokensPath?`; exported for typing)
