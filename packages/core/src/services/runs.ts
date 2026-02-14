import type { Db } from '../infra/db/schema.js';
import * as stmt from '../infra/db/statements.js';
import { createId } from '../kernel/ids.js';
import type { Run } from '../types.js';

function rowToRun(r: stmt.RunRow): Run {
  return {
    id: r.id,
    traceId: r.trace_id,
    status: r.status,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    createdAt: r.created_at,
  };
}

export interface StartRunParams {
  traceId?: string;
}

export interface FinishRunParams {
  runId: string;
  status: 'success' | 'error' | 'cancelled';
}

export function createRunsService(db: Db) {
  return {
    startRun(params?: StartRunParams): { runId: string } {
      const runId = createId();
      const now = Date.now();
      stmt.runInsert(db, {
        id: runId,
        trace_id: params?.traceId ?? '',
        status: 'running',
        started_at: now,
        created_at: now,
      });
      return { runId };
    },

    finishRun(params: FinishRunParams): void {
      stmt.runUpdateStatus(db, params.runId, params.status, Date.now());
    },

    getRun(runId: string): Run | null {
      const row = stmt.runGet(db, runId);
      return row ? rowToRun(row) : null;
    },

    listRuns(_filter?: unknown): Run[] {
      return stmt.runList(db, _filter).map(rowToRun);
    },
  };
}

export type RunsService = ReturnType<typeof createRunsService>;
