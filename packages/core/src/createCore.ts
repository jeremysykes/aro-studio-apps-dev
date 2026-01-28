import { resolve, isAbsolute, relative } from 'node:path';
import { openDb, closeDb } from './infra/db/connection.js';
import type { Db } from './infra/db/schema.js';
import { createWorkspaceService } from './services/workspace.js';
import { createRunsService } from './services/runs.js';
import { createLogsService } from './services/logs.js';
import { createArtifactsService } from './services/artifacts.js';
import { createJobsService } from './services/jobs.js';
import { createTokensService } from './services/tokens.js';
import { createValidationService } from './services/validation.js';
import type { AroCoreOptions, AroCore } from './types.js';

function resolveTokensPath(workspaceRoot: string, tokensPath?: string): string {
  if (!tokensPath) return 'tokens/tokens.json';
  if (isAbsolute(tokensPath)) {
    const rel = relative(workspaceRoot, tokensPath);
    if (rel.startsWith('..')) throw new Error('tokensPath must be within workspace');
    return rel;
  }
  return tokensPath;
}

export function createCore(options: AroCoreOptions): AroCore {
  const { workspaceRoot } = options;
  const dbPath = options.dbPath ?? resolve(workspaceRoot, '.aro', 'aro.sqlite');
  const tokensPathRel = resolveTokensPath(workspaceRoot, options.tokensPath);

  const workspace = createWorkspaceService(workspaceRoot);
  workspace.initWorkspace();

  let db: Db | null = openDb(dbPath);
  let shutDown = false;
  const runs = createRunsService(db);
  const logs = createLogsService(db);
  const artifacts = createArtifactsService(db, workspaceRoot);
  const jobs = createJobsService(runs, logs, artifacts, workspace, () => shutDown);
  const tokens = createTokensService(
    (p) => workspace.readText(p),
    (p, c) => workspace.writeText(p, c),
    tokensPathRel
  );
  const validation = createValidationService();

  return {
    workspace,
    runs,
    logs: { appendLog: logs.appendLog, listLogs: logs.listLogs, subscribe: logs.subscribe },
    artifacts,
    jobs,
    tokens,
    validation,
    shutdown() {
      shutDown = true;
      if (db) {
        closeDb(db);
        db = null;
      }
      logs._clearSubscriptions();
    },
  };
}
