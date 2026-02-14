import type { Db } from '../infra/db/schema.js';
import * as stmt from '../infra/db/statements.js';
import { createId } from '../kernel/ids.js';
import { createSubscription } from '../kernel/events.js';
import type { LogEntry } from '../types.js';

function rowToLog(r: stmt.LogRow): LogEntry {
  return {
    id: r.id,
    runId: r.run_id,
    traceId: r.trace_id,
    level: r.level,
    message: r.message,
    createdAt: r.created_at,
  };
}

export interface AppendLogEntry {
  runId: string;
  traceId: string;
  level: string;
  message: string;
}

export type Unsubscribe = () => void;

export function createLogsService(db: Db) {
  const runSubs = new Map<string, ReturnType<typeof createSubscription<LogEntry>>>();

  function getOrCreateSub(runId: string) {
    let s = runSubs.get(runId);
    if (!s) {
      s = createSubscription<LogEntry>();
      runSubs.set(runId, s);
    }
    return s;
  }

  return {
    appendLog(entry: AppendLogEntry): void {
      const id = createId();
      const createdAt = Date.now();
      stmt.logInsert(db, {
        id,
        run_id: entry.runId,
        trace_id: entry.traceId,
        level: entry.level,
        message: entry.message,
        created_at: createdAt,
      });
      const logEntry: LogEntry = {
        id,
        runId: entry.runId,
        traceId: entry.traceId,
        level: entry.level,
        message: entry.message,
        createdAt,
      };
      getOrCreateSub(entry.runId).emit(logEntry);
    },

    listLogs(runId: string): LogEntry[] {
      return stmt.logListByRunId(db, runId).map(rowToLog);
    },

    subscribe(runId: string, handler: (entry: LogEntry) => void): Unsubscribe {
      return getOrCreateSub(runId).subscribe(handler);
    },

    _clearSubscriptions(): void {
      runSubs.clear();
    },
  };
}

export type LogsService = ReturnType<typeof createLogsService>;
