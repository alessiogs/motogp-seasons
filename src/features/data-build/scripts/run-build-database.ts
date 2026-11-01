// `npm run data:build`: data/ (JSON, committed) -> db/motogp.db (generated, git-ignored).
import path from 'node:path';
import { buildDatabase } from './build-database';

const dbPath = path.join(process.cwd(), 'db', 'motogp.db');
buildDatabase(path.join(process.cwd(), 'data'), dbPath);
console.log(`Built ${path.relative(process.cwd(), dbPath)} from data/`);
