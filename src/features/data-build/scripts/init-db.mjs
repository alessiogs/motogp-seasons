// Recreates db/motogp.db from db/schema.sql. Deletes existing data!
import Database from 'better-sqlite3';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const DB = 'db/motogp.db';
if (existsSync(DB) && !process.argv.includes('--force')) {
  console.error(`${DB} already exists. Re-run with --force to wipe and recreate it.`);
  process.exit(1);
}
rmSync(DB, { force: true });
const db = new Database(DB);
db.exec(readFileSync('db/schema.sql', 'utf8'));
db.close();
console.log(`Created ${DB}`);
