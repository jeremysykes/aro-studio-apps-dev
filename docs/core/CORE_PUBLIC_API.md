# Core Public API

This document defines the public surface of `@aro/core`. Core is the headless engine for workspace management, job execution, persistence, and validation. It runs in Node.js only; Desktop (or another host) creates a Core instance and forwards operations.

## Entry point

```ts
import { createCore } from '@aro/core';

const core = createCore({ workspaceRoot: '/path/to/workspace' });
// ... use core
core.shutdown();
```

---

## createCore

```ts
function createCore(options: AroCoreOptions): AroCore
```

Creates a Core instance for the given workspace. Initializes `.aro/` directory and SQLite database. Call `core.shutdown()` before releasing the instance.

**Options:**

| Property       | Type   | Required | Description                                              |
|----------------|--------|----------|----------------------------------------------------------|
| `workspaceRoot`| string | Yes      | Absolute path to the workspace directory                 |
| `dbPath`       | string | No       | Override SQLite path (default: `workspaceRoot/.aro/aro.sqlite`) |
| `tokensPath`   | string | No       | Override tokens file path (default: `tokens/tokens.json`) |

---

## AroCore interface

The returned object provides the following services.

### workspace

Scoped file access within the workspace. Paths are relative; `../` traversal is blocked.

| Method           | Description                                              |
|------------------|----------------------------------------------------------|
| `initWorkspace()`| Ensures `.aro/` exists                                   |
| `resolve(path)`  | Resolves a relative path; throws on `../`                |
| `readText(path)` | Reads file content as string                             |
| `writeText(path, content)` | Writes file content                          |
| `exists(path)`   | Returns true if file exists                              |
| `mkdirp(dir)`    | Creates directory recursively                            |

### runs

Run lifecycle: start, finish, query.

| Method | Description |
|--------|-------------|
| `startRun(params?)` | Starts a run; returns `{ runId }` |
| `finishRun({ runId, status })` | Finishes run with `success`, `error`, or `cancelled` |
| `getRun(runId)` | Returns Run or null |
| `listRuns(filter?)` | Returns runs ordered by time (newest first) |

### logs

Log entries for runs. Persisted in SQLite.

| Method | Description |
|--------|-------------|
| `appendLog({ runId, level, message })` | Appends a log entry |
| `listLogs(runId)` | Returns all entries for a run |
| `subscribe(runId, handler)` | Subscribes to new entries; returns unsubscribe function |

### artifacts

Artifacts are files written under `.aro/artifacts/<runId>/`. Indexed in SQLite.

| Method | Description |
|--------|-------------|
| `writeArtifact({ runId, path, content })` | Writes artifact; returns Artifact |
| `listArtifacts(runId)` | Returns artifacts for a run |

### jobs

Job registration and execution. Jobs receive a `JobContext` with logger, workspace facet, artifact writer, and abort signal.

| Method | Description |
|--------|-------------|
| `register(jobDef)` | Registers a job definition |
| `run(jobKey, input)` | Runs a job; returns `{ runId }` |
| `cancel(runId)` | Cancels a running job via AbortSignal |

### tokens

Load/save tokens from workspace (e.g. `tokens/tokens.json`).

| Method | Description |
|--------|-------------|
| `loadTokens()` | Loads tokens from disk; returns parsed JSON or empty object |
| `saveTokens(tokens)` | Saves tokens to disk |
| `diffTokens(a, b)` | Returns `TokenDiff` (added, removed, changed keys) |

### validation

Zod-based validation at boundaries.

| Method | Description |
|--------|-------------|
| `validateTokens(tokens)` | Returns `ValidationResult` with `ok` and optional `issues` |

### shutdown

```ts
core.shutdown(): void
```

Closes the database and clears subscriptions. Call before discarding the Core instance.

---

## Types

### Run

```ts
interface Run {
  id: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
}
```

### LogEntry

```ts
interface LogEntry {
  id: string;
  runId: string;
  level: string;
  message: string;
  createdAt: number;
}
```

### Artifact

```ts
interface Artifact {
  id: string;
  runId: string;
  path: string;
  createdAt: number;
}
```

### JobDefinition

```ts
interface JobDefinition {
  key: string;
  run: (ctx: JobContext, input: unknown) => void | Promise<void>;
}
```

### JobContext

Provided to job `run` functions.

```ts
interface JobContext {
  readonly logger: RunLogger;        // (level, message) => void
  readonly workspace: WorkspaceFacet; // resolve, readText, writeText, exists, mkdirp
  readonly artifactWriter: ArtifactWriter; // ({ path, content }) => Artifact
  readonly abort: AbortSignal;
  progress?: (value: number | { current: number; total: number }) => void;
}
```

### ValidationResult

```ts
interface ValidationResult {
  ok: boolean;
  issues?: ValidationIssue[];
}

interface ValidationIssue {
  path: string;
  message: string;
}
```

### TokenDiff

```ts
interface TokenDiff {
  added: string[];
  removed: string[];
  changed: string[];
}
```

---

## Exports

From `@aro/core`:

- `createCore`
- Types: `AroCore`, `AroCoreOptions`, `Run`, `LogEntry`, `Artifact`, `ValidationIssue`, `ValidationResult`, `TokenDiff`, `JobDefinition`, `JobContext`
