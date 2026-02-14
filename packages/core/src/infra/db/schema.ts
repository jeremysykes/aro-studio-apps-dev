import Database from 'better-sqlite3';

export type Db = InstanceType<typeof Database>;

export function runSchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_run_id ON logs(run_id);

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      path TEXT NOT NULL,
      job_key TEXT NOT NULL DEFAULT '',
      input_hash TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_artifacts_run_id ON artifacts(run_id);
  `);

  // ── Migrations (idempotent) ───────────────────────────────────────────────
  const cols = db.prepare('PRAGMA table_info(artifacts)').all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('job_key')) {
    db.exec("ALTER TABLE artifacts ADD COLUMN job_key TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('input_hash')) {
    db.exec("ALTER TABLE artifacts ADD COLUMN input_hash TEXT NOT NULL DEFAULT ''");
  }
}
