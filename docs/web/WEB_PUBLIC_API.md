
This document defines the HTTP/WS API surface between the Web frontend and backend. Web exposes the same intent-based capabilities as Desktop (see DESKTOP_PUBLIC_API.md) but over HTTP and WebSocket instead of IPC. The frontend never sees Core directly.

## Invariants

- The frontend communicates only via the Web API (fetch for REST, WebSocket for logs subscription).
- All API methods are asynchronous.
- The backend holds the Core instance and translates API calls into Core calls.
- No raw Core handles, DB paths, or filesystem primitives are exposed.

---

## API shape (mirrors Desktop)

The Web API exposes the same capabilities as Desktop's preload API. All REST endpoints return JSON.

### Workspace

| Capability        | Desktop (IPC)           | Web (HTTP)                          |
|-------------------|-------------------------|-------------------------------------|
| Get current       | `workspace:getCurrent`   | `GET /api/workspace/current`        |
| Select (MVP: N/A) | `workspace:select`       | MVP: workspace from env; no endpoint |

**Response:** `{ path: string } \| null`

### Job

| Capability    | Desktop (IPC)     | Web (HTTP)                      |
|---------------|-------------------|---------------------------------|
| Run           | `job:run`         | `POST /api/job/run`             |
| Cancel        | `job:cancel`      | `POST /api/job/cancel`          |
| List registered | `job:listRegistered` | `GET /api/job/registered`    |

**Run request:** `{ jobKey: string; input?: unknown }`  
**Run response:** `{ runId: string }`  
**Cancel request:** `{ runId: string }`

### Runs

| Capability | Desktop (IPC) | Web (HTTP)            |
|------------|---------------|-----------------------|
| List       | `runs:list`   | `GET /api/runs`       |
| Get        | `runs:get`    | `GET /api/runs/:runId`|

### Logs

| Capability | Desktop (IPC)     | Web (HTTP)                       |
|------------|-------------------|----------------------------------|
| List       | `logs:list`       | `GET /api/logs/:runId`           |
| Subscribe  | `logs:subscribe`  | `WebSocket /api/logs/:runId/stream` |

**Subscribe:** Frontend opens WebSocket; backend pushes `{ runId, entry }` as log entries arrive.

### Artifacts

| Capability | Desktop (IPC)    | Web (HTTP)                 |
|------------|------------------|----------------------------|
| List       | `artifacts:list` | `GET /api/artifacts/:runId` |
| Read       | `artifacts:read` | `GET /api/artifacts/:runId/:path` |

### App / module

| Capability       | Desktop (IPC)            | Web (HTTP)              |
|------------------|--------------------------|-------------------------|
| Get active module | `app:getActiveModuleKey` | `GET /api/app/active-module` |

**Response:** `{ key: string }`

---

## Core forwarding (concrete mapping)

| Web API                        | Core API                     |
|--------------------------------|------------------------------|
| `GET /api/workspace/current`    | Return workspace path from env (backend state) |
| `POST /api/job/run`            | `core.jobs.run(jobKey, input)` |
| `POST /api/job/cancel`         | `core.jobs.cancel(runId)`    |
| `GET /api/job/registered`      | Return registered job keys (Web tracks these)  |
| `GET /api/runs`                | `core.runs.listRuns()`       |
| `GET /api/runs/:runId`         | `core.runs.getRun(runId)`    |
| `GET /api/logs/:runId`         | `core.logs.listLogs(runId)`  |
| `WS /api/logs/:runId/stream`   | `core.logs.subscribe(runId, handler)`; push to WebSocket |
| `GET /api/artifacts/:runId`    | `core.artifacts.listArtifacts(runId)` |
| `GET /api/artifacts/:runId/:path` | Resolve via Core/workspace, read file, return content |

---

## Types (shared between frontend and backend)

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

## Workspace in browser context (MVP)

For MVP, the workspace is **env-configured** on the backend (`ARO_WORKSPACE_ROOT` or `process.cwd()`). The frontend receives the current workspace path from `GET /api/workspace/current` for display. No workspace selection UI in the browser for MVP. Future: project selector, URL param, or auth-based workspace.

---

## Out of scope for MVP

- Tokens, validation (no `tokens` or `validation` endpoints)
- Workspace selection in the browser
- Progress events (Core supports `ctx.progress`; Web can add later)
