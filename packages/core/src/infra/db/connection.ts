import Database from 'better-sqlite3';
import { runSchema, type Db } from './schema.js';

export type { Db } from './schema.js';

export function openDb(dbPath: string): Db {
  const db = new Database(dbPath);
  runSchema(db);
  return db;
}

export function closeDb(db: Db): void {
  db.close();
}
