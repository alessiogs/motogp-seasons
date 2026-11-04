// Minimal better-sqlite3 API over node:sqlite, enough for this repo's build and queries.
import { DatabaseSync } from 'node:sqlite';
const plain = (r) => (r == null ? r : { ...r });
class Statement {
  constructor(s) { this.s = s; }
  get(...a) { return plain(this.s.get(...a)); }
  all(...a) { return this.s.all(...a).map(plain); }
  run(...a) { return this.s.run(...a); }
}
export default class Database {
  constructor(file, opts = {}) { this.db = new DatabaseSync(file, { readOnly: !!opts.readonly }); }
  prepare(sql) { return new Statement(this.db.prepare(sql)); }
  exec(sql) { this.db.exec(sql); return this; }
  pragma(p) { return this.db.prepare(`PRAGMA ${p}`).all().map(plain); }
  transaction(fn) { return (...a) => { this.db.exec('BEGIN'); try { const r = fn(...a); this.db.exec('COMMIT'); return r; } catch (e) { this.db.exec('ROLLBACK'); throw e; } }; }
  close() { this.db.close(); }
}
