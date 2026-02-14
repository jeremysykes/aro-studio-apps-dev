import type { Db } from './schema.js';

export interface RunRow {
  id: string;
  status: string;
  started_at: number;
  finished_at: number | null;
  created_at: number;
}

export function runInsert(
  db: Db,
  row: { id: string; status: string; started_at: number; created_at: number }
): void {
  const stmt = db.prepare(
    `INSERT INTO runs (id, status, started_at, finished_at, created_at) VALUES (?, ?, ?, NULL, ?)`
  );
  stmt.run(row.id, row.status, row.started_at, row.created_at);
}

export function runUpdateStatus(
  db: Db,
  runId: string,
  status: string,
  finished_at: number
): void {
  const stmt = db.prepare(`UPDATE runs SET status = ?, finished_at = ? WHERE id = ?`);
  stmt.run(status, finished_at, runId);
}

export function runGet(db: Db, runId: string): RunRow | undefined {
  const stmt = db.prepare(`SELECT * FROM runs WHERE id = ?`);
  return stmt.get(runId) as RunRow | undefined;
}

export function runList(db: Db, _filter?: unknown): RunRow[] {
  const stmt = db.prepare(`SELECT * FROM runs ORDER BY started_at DESC`);
  return stmt.all() as RunRow[];
}

export interface LogRow {
  id: string;
  run_id: string;
  level: string;
  message: string;
  created_at: number;
}

export function logInsert(
  db: Db,
  row: { id: string; run_id: string; level: string; message: string; created_at: number }
): void {
  const stmt = db.prepare(
    `INSERT INTO logs (id, run_id, level, message, created_at) VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(row.id, row.run_id, row.level, row.message, row.created_at);
}

export function logListByRunId(db: Db, runId: string): LogRow[] {
  const stmt = db.prepare(`SELECT * FROM logs WHERE run_id = ? ORDER BY created_at ASC`);
  return stmt.all(runId) as LogRow[];
}

export interface ArtifactRow {
  id: string;
  run_id: string;
  path: string;
  job_key: string;
  input_hash: string;
  created_at: number;
}

export function artifactInsert(
  db: Db,
  row: { id: string; run_id: string; path: string; job_key: string; input_hash: string; created_at: number }
): void {
  const stmt = db.prepare(
    `INSERT INTO artifacts (id, run_id, path, job_key, input_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run(row.id, row.run_id, row.path, row.job_key, row.input_hash, row.created_at);
}

export function artifactListByRunId(db: Db, runId: string): ArtifactRow[] {
  const stmt = db.prepare(`SELECT * FROM artifacts WHERE run_id = ? ORDER BY created_at ASC`);
  return stmt.all(runId) as ArtifactRow[];
}
