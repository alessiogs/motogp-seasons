#!/usr/bin/env node
// Fails when a feature file imports across the kinds AGENTS.md keeps apart:
//   - queries/ (SQLite reads) never imports logic/: the caller composes a query with logic.
//   - logic/ (pure, no I/O) imports only logic/ and types/ files, and no I/O module.
// Tests (*.test.ts) are exempt: they may build a database to feed logic.
// Usage: node scripts/check-feature-imports.mjs   (run from the repo root; no dependencies)
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const IO_MODULES = /^(node:|fs$|path$|better-sqlite3$|server-only$|next(\/|$)|react(\/|$))/;

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield full;
  }
}

/** The kind folder (`logic`, `queries`, ...) a path sits in, or null. */
const kindOf = (file) => file.split(path.sep).find((part) => ['logic', 'queries', 'components', 'scripts', 'types'].includes(part)) ?? null;

function problemsIn(file) {
  const kind = kindOf(file);
  if (kind !== 'logic' && kind !== 'queries') return [];
  const source = readFileSync(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const problems = [];
  for (const spec of specifiers) {
    const local = spec.startsWith('.') || spec.startsWith('@/');
    const target = local ? kindOf(spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : spec.replaceAll('/', path.sep)) : null;
    if (kind === 'queries' && target === 'logic') {
      problems.push(`${file}: imports '${spec}'; queries/ never imports logic/ (compose them in the caller)`);
    }
    if (kind === 'logic' && local && target !== 'logic' && target !== 'types') {
      problems.push(`${file}: imports '${spec}'; logic/ imports only logic/ and types/ files`);
    }
    if (kind === 'logic' && !local && IO_MODULES.test(spec)) {
      problems.push(`${file}: imports '${spec}'; logic/ is pure, with no I/O`);
    }
  }
  return problems;
}

const problems = [...sourceFiles('src')].flatMap(problemsIn);
for (const problem of problems) console.error(problem);
if (problems.length > 0) process.exit(1);
console.log('Feature imports OK');
