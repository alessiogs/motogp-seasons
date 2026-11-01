// Build-time data access. Only imported by server components, so it runs in Node
// during `next build` and never ships to the browser.
import 'server-only';
import Database from 'better-sqlite3';
import path from 'node:path';

let _db: Database.Database | null = null;
let _dbPath: string | null = null;

/** The generated database (`npm run data:build`); MOTOGP_DB_PATH overrides the location, for tests. */
export function getDatabase() {
  const dbPath = process.env.MOTOGP_DB_PATH ?? path.join(process.cwd(), 'db', 'motogp.db');
  if (_db && _dbPath !== dbPath) {
    _db.close();
    _db = null;
  }
  _dbPath = dbPath;
  _db ??= new Database(dbPath, { readonly: true, fileMustExist: true });
  return _db;
}
