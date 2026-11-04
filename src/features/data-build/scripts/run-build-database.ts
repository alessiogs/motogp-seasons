// `npm run data:build`: data/ (JSON, committed) -> db/motogp.db (generated, git-ignored).
import path from 'node:path';
import { buildDatabase } from './build-database';

const dbPath = path.join(process.cwd(), 'db', 'motogp.db');
const warnings = buildDatabase(path.join(process.cwd(), 'data'), dbPath);
// In GitHub Actions, `::warning::` lines show up as annotations on the PR's checks.
const prefix = process.env.GITHUB_ACTIONS ? '::warning::' : 'warning: ';
for (const warning of warnings) console.warn(prefix + warning);
console.log(`Built ${path.relative(process.cwd(), dbPath)} from data/`);
