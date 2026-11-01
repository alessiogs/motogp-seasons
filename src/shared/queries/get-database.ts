// Build-time data access. Only imported by server components, so it runs in Node
// during `next build` and never ships to the browser.
import 'server-only';
import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'db', 'motogp.db');

let _db: Database.Database | null = null;
export function getDatabase() {
  _db ??= new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return _db;
}
