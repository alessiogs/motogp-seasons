// Resolve hooks so repo tests run under plain `node --experimental-strip-types --test` without node_modules.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const H = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.HARNESS_ROOT || process.cwd();
const exts = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts'];
const find = (base) => { for (const e of exts) { const p = base + e; if (existsSync(p) && statSync(p).isFile()) return p; } return null; };
const map = { vitest: 'vitest-shim.ts', 'vitest/config': 'vitest-shim.ts', 'better-sqlite3': 'better-sqlite3-shim.mjs', 'server-only': 'empty.mjs' };
export async function resolve(spec, ctx, next) {
  if (map[spec]) return { url: pathToFileURL(path.join(H, map[spec])).href, shortCircuit: true };
  let base = null;
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2));
  else if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL?.startsWith('file:')) base = path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec);
  if (base) { const f = find(base); if (f) return { url: pathToFileURL(f).href, shortCircuit: true, ...(f.endsWith('.json') ? { importAttributes: { type: 'json' } } : {}) }; }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`, shortCircuit: true };
  return next(url, ctx);
}
