
This document defines the IPC surface between the Electron main process and the renderer. Desktop exposes a narrow, intent-based API to renderers and forwards calls to Core. The renderer never sees Core directly.

## Invariants

- The renderer communicates only via the preload-exposed API (through `contextBridge`).
- All API methods are asynchronous from the renderer's perspective (IPC is async).
- The main process holds the Core instance and translates API calls into Core calls.
- No raw Core handles, DB paths, or filesystem primitives are exposed.

---

## Preload API shape

The preload script exposes an object, e.g. `window.aro`, with the following namespaces and methods. All return Promises.

```ts
interface AroPreloadAPI {
  workspace: {
    select(): Promise<{ path: string } | null>;
    getCurrent(): Promise<{ path: string } | null>;
  };
  job: {
    run(jobKey: string, input?: unknown): Promise<{ runId: string }>;
    cancel(runId: string): Promise<void>;
    listRegistered(): Promise<string[]>;
  };
  runs: {
    list(): Promise<Run[]>;
    get(runId: string): Promise<Run | null>;
  };
  logs: {
    list(runId: string): Promise<LogEntry[]>;
    subscribe(runId: string, callback: (entry: LogEntry) => void): Promise<() => void>;
  };
  artifacts: {
    list(runId: string): Promise<Artifact[]>;
    read(runId: string, path: string): Promise<string>;
  };
}
```

---

## IPC channel mapping

| Preload method | IPC channel (invoke) | Main process action |
|----------------|----------------------|----------------------|
| `workspace.select()` | `workspace:select` | Show native folder picker; on choice, `createCore({ workspaceRoot })`, persist path, return `{ path }` |
| `workspace.getCurrent()` | `workspace:getCurrent` | Return current workspace path or null if none |
| `job.run(key, input)` | `job:run` | `core.jobs.run(key, input)` → return `{ runId }` |
| `job.cancel(runId)` | `job:cancel` | `core.jobs.cancel(runId)` |
| `job.listRegistered()` | `job:listRegistered` | Return keys from registered job definitions (Desktop tracks these or Core exposes; for MVP, Desktop registers a trivial job and returns it) |
| `runs.list()` | `runs:list` | `core.runs.listRuns()` → return runs |
| `runs.get(runId)` | `runs:get` | `core.runs.getRun(runId)` → return run or null |
| `logs.list(runId)` | `logs:list` | `core.logs.listLogs(runId)` → return entries |
| `logs.subscribe(runId, cb)` | `logs:subscribe` | `core.logs.subscribe(runId, handler)`; main forwards events to renderer via `logs:entry` |
| `artifacts.list(runId)` | `artifacts:list` | `core.artifacts.listArtifacts(runId)` → return artifacts |
| `artifacts.read(runId, path)` | `artifacts:read` | Resolve artifact path via Core/workspace, read file, return content |

---

## IPC events (main → renderer)

| Event | When | Payload |
|-------|------|---------|
| `logs:entry` | New log entry for a subscribed run | `{ runId: string; entry: LogEntry }` |
| `workspace:changed` | Workspace was selected or cleared | `{ path: string } \| null` |

---

## Core forwarding (concrete mapping)

| IPC / preload | Core API |
|---------------|----------|
| `workspace:select` (after user picks dir) | `createCore({ workspaceRoot })`; store `core`; previous core gets `core.shutdown()` |
| `workspace:getCurrent` | Return stored workspace path (Desktop state) |
| `job:run` | `core.jobs.run(jobKey, input)` |
| `job:cancel` | `core.jobs.cancel(runId)` |
| `job:listRegistered` | Desktop must register at least one job with Core for MVP; return `core.jobs` internal registry or a Desktop-maintained list of keys |
| `runs:list` | `core.runs.listRuns()` |
| `runs:get` | `core.runs.getRun(runId)` |
| `logs:list` | `core.logs.listLogs(runId)` |
| `logs:subscribe` | `core.logs.subscribe(runId, (entry) => sendToRenderer('logs:entry', { runId, entry }))`; return unsubscribe to renderer |
| `artifacts:list` | `core.artifacts.listArtifacts(runId)` |
| `artifacts:read` | `core.workspace.readText('.aro/artifacts/' + runId + '/' + path)` — artifact path is relative to the run directory |

**Note on `job.listRegistered`:** Core's `jobs.register()` is called by whoever has job definitions. For MVP, Desktop (main process) registers a simple "hello" or "echo" job so the UI can trigger something. Core does not expose `listRegistered` today; Desktop can maintain a list of registered keys, or Core could add a `listRegisteredKeys()` method. For MVP, a single known job key (e.g. `"hello"`) is sufficient.

---

## Types (shared between main and renderer)

```ts
interface Run {
  id: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
}

interface LogEntry {
  id: string;
  runId: string;
  level: string;
  message: string;
  createdAt: number;
}

interface Artifact {
  id: string;
  runId: string;
  path: string;
  createdAt: number;
}
```

These match Core's exported types.

---

## Out of scope for MVP

- Tokens, validation (no `tokens:*` or `validation:*` channels)
- Module loading, module-specific IPC
- Multi-window, multi-workspace
- Progress events (Core supports `ctx.progress`; Desktop can add `job:progress` later)
