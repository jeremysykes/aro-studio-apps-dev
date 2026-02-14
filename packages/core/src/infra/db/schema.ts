import Database from 'better-sqlite3';

export type Db = InstanceType<typeof Database>;

export function runSchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      trace_id TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_run_id ON logs(run_id);

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      trace_id TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL,
      job_key TEXT NOT NULL DEFAULT '',
      input_hash TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_artifacts_run_id ON artifacts(run_id);
  `);

  // ── Migrations (idempotent) ───────────────────────────────────────────────

  // Artifact provenance columns
  const artCols = db.prepare('PRAGMA table_info(artifacts)').all() as { name: string }[];
  const artColNames = new Set(artCols.map((c) => c.name));
  if (!artColNames.has('job_key')) {
    db.exec("ALTER TABLE artifacts ADD COLUMN job_key TEXT NOT NULL DEFAULT ''");
  }
  if (!artColNames.has('input_hash')) {
    db.exec("ALTER TABLE artifacts ADD COLUMN input_hash TEXT NOT NULL DEFAULT ''");
  }

  // Trace ID columns (runs, logs, artifacts)
  const runCols = db.prepare('PRAGMA table_info(runs)').all() as { name: string }[];
  if (!new Set(runCols.map((c) => c.name)).has('trace_id')) {
    db.exec("ALTER TABLE runs ADD COLUMN trace_id TEXT NOT NULL DEFAULT ''");
  }

  const logCols = db.prepare('PRAGMA table_info(logs)').all() as { name: string }[];
  if (!new Set(logCols.map((c) => c.name)).has('trace_id')) {
    db.exec("ALTER TABLE logs ADD COLUMN trace_id TEXT NOT NULL DEFAULT ''");
  }

  if (!artColNames.has('trace_id')) {
    db.exec("ALTER TABLE artifacts ADD COLUMN trace_id TEXT NOT NULL DEFAULT ''");
  }
}
