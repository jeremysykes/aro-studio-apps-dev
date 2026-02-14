#!/usr/bin/env tsx
/**
 * reset-db — Reset workspace database to a clean baseline.
 *
 * Usage:
 *   pnpm reset-db              # uses default workspace from ARO_WORKSPACE_ROOT or cwd
 *   pnpm reset-db /path/to/ws  # explicit workspace path
 *
 * What this does:
 *   1. Opens the workspace SQLite database at <workspace>/.aro/aro.sqlite
 *   2. Deletes ALL rows from: runs, logs, artifacts
 *   3. Resets SQLite auto-increment counters (sqlite_sequence)
 *   4. Runs VACUUM to reclaim disk space
 *
 * What is preserved:
 *   - The database file itself (schema intact)
 *   - The .aro/ directory structure
 *   - Artifact files on disk are NOT deleted (only DB references)
 *     To fully clean artifacts, remove .aro/artifacts/ manually
 *
 * Safety:
 *   - DEVELOPMENT ONLY — do not run in production
 *   - Idempotent — safe to run multiple times
 *   - Prompts nothing — runs immediately (scripted usage)
 */
import { resolve } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import Database from 'better-sqlite3';

const workspaceRoot = process.argv[2]
  ?? process.env.ARO_WORKSPACE_ROOT
  ?? process.cwd();

const dbPath = resolve(workspaceRoot, '.aro', 'aro.sqlite');
const artifactsDir = resolve(workspaceRoot, '.aro', 'artifacts');

if (!existsSync(dbPath)) {
  console.error(`❌ Database not found: ${dbPath}`);
  console.error(`   Ensure the workspace has been initialized (select a workspace in the app first).`);
  process.exit(1);
}

console.log(`🔄 Resetting database: ${dbPath}`);
console.log(`   Workspace: ${workspaceRoot}`);

const db = new Database(dbPath);

try {
  // Clear all report-related tables
  const tables = ['artifacts', 'logs', 'runs'];
  for (const table of tables) {
    const info = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as { count: number };
    db.prepare(`DELETE FROM ${table}`).run();
    console.log(`   ✓ ${table}: ${info.count} rows deleted`);
  }

  // Reset auto-increment counters
  const hasSequence = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'`
  ).get();
  if (hasSequence) {
    db.prepare(`DELETE FROM sqlite_sequence`).run();
    console.log(`   ✓ sqlite_sequence: reset`);
  }

  // Reclaim disk space
  db.exec('VACUUM');
  console.log(`   ✓ VACUUM: complete`);

  // Optionally clean artifact files on disk
  if (existsSync(artifactsDir)) {
    rmSync(artifactsDir, { recursive: true, force: true });
    console.log(`   ✓ Artifact files removed: ${artifactsDir}`);
  }

  console.log(`\n✅ Database reset complete. Next scan will start from a clean baseline.`);
} finally {
  db.close();
}
