# @aro/core

Headless Node engine for Aro Studio: workspace, jobs, runs, logs, artifacts, tokens, and validation.

## Setup

```bash
pnpm install
pnpm build
```

If tests fail with `Could not locate the bindings file` for better-sqlite3, rebuild the native addon:

```bash
pnpm rebuild better-sqlite3
```

## Usage

```ts
import { createCore } from '@aro/core';

const core = createCore({ workspaceRoot: '/path/to/workspace' });
core.workspace.initWorkspace();
const { runId } = core.runs.startRun();
core.logs.appendLog({ runId, level: 'info', message: 'Started' });
core.runs.finishRun({ runId, status: 'success' });
core.shutdown();
```

## Test

```bash
pnpm test
```
