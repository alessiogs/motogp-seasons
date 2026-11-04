// Subset of vitest's API over node:test. Extend when a test needs more.
import * as nt from 'node:test';
import assert from 'node:assert/strict';
const { before, after, beforeEach, afterEach } = nt;
const fmt = (name: string, row: any) => name
  .replace(/\$([a-zA-Z_][\w.]*)/g, (_, k) => String(k.split('.').reduce((o: any, x: string) => o?.[x], row)))
  .replace(/%[sdiofj#]/g, () => JSON.stringify(Array.isArray(row) ? row.shift?.() : row));
const withEach = (fn: any) => Object.assign((...a: any[]) => fn(...a), {
  each: (rows: any[]) => (name: string, body: any) => rows.forEach((row) => fn(fmt(name, Array.isArray(row) ? [...row] : row), () => (Array.isArray(row) ? body(...row) : body(row)))),
  skip: (fn as any).skip, only: (fn as any).only,
});
export const describe = withEach(nt.describe); export const it = withEach(nt.it); export const test = it;
export { beforeEach, afterEach };
export const beforeAll = before; export const afterAll = after;
export const defineConfig = (c: any) => c;
export const vi = { fn: (impl: any = () => undefined) => { const f: any = (...a: any[]) => { f.mock.calls.push(a); return impl(...a); }; f.mock = { calls: [] }; return f; } };
const isPlainObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const partial = (a: any, p: any): boolean => {
  if (Array.isArray(p)) return Array.isArray(a) && a.length === p.length && p.every((x, i) => partial(a[i], x));
  if (isPlainObj(p)) return isPlainObj(a) && Object.keys(p).every((k) => partial(a[k], p[k]));
  try { assert.deepStrictEqual(a, p); return true; } catch { return false; }
};
const loose = (a: any, b: any) => { try { assert.deepStrictEqual(JSON.parse(JSON.stringify(a ?? null)), JSON.parse(JSON.stringify(b ?? null))); return true; } catch { return false; } };
function matchers(a: any, neg: boolean) {
  const ok = (c: boolean, msg: string) => { if (c === neg) throw new assert.AssertionError({ message: (neg ? 'NOT ' : '') + msg, actual: a }); };
  const throws = () => { try { a(); return null; } catch (e) { return e as any; } };
  return {
    toBe: (b: any) => ok(Object.is(a, b), `expected ${JSON.stringify(a)} toBe ${JSON.stringify(b)}`),
    toEqual: (b: any) => ok(loose(a, b), `expected ${JSON.stringify(a)}\n toEqual ${JSON.stringify(b)}`),
    toStrictEqual: (b: any) => ok(loose(a, b), `expected ${JSON.stringify(a)}\n toStrictEqual ${JSON.stringify(b)}`),
    toMatchObject: (b: any) => ok(partial(a, b), `expected ${JSON.stringify(a)}\n toMatchObject ${JSON.stringify(b)}`),
    toHaveLength: (n: number) => ok(a?.length === n, `expected length ${a?.length} to be ${n}`),
    toBeDefined: () => ok(a !== undefined, 'expected defined'),
    toBeUndefined: () => ok(a === undefined, 'expected undefined'),
    toBeNull: () => ok(a === null, `expected ${JSON.stringify(a)} toBeNull`),
    toBeTruthy: () => ok(!!a, 'expected truthy'),
    toBeFalsy: () => ok(!a, 'expected falsy'),
    toBeGreaterThan: (n: number) => ok(a > n, `expected ${a} > ${n}`),
    toBeGreaterThanOrEqual: (n: number) => ok(a >= n, `expected ${a} >= ${n}`),
    toBeLessThan: (n: number) => ok(a < n, `expected ${a} < ${n}`),
    toBeLessThanOrEqual: (n: number) => ok(a <= n, `expected ${a} <= ${n}`),
    toBeCloseTo: (n: number, d = 2) => ok(Math.abs(a - n) < 10 ** -d / 2, `expected ${a} ≈ ${n}`),
    toContain: (x: any) => ok(a?.includes?.(x), `expected ${JSON.stringify(a)} to contain ${JSON.stringify(x)}`),
    toContainEqual: (x: any) => ok(Array.isArray(a) && a.some((y) => loose(y, x)), `expected array to contain ${JSON.stringify(x)}`),
    toHaveProperty: (k: string, v?: any) => ok(a != null && k in Object(a) && (v === undefined || loose(a[k], v)), `expected property ${k}`),
    toMatch: (r: RegExp | string) => ok(typeof r === 'string' ? String(a).includes(r) : r.test(String(a)), `expected ${a} to match ${r}`),
    toThrow: (r?: RegExp | string) => { const e = throws(); ok(!!e && (r == null || (typeof r === 'string' ? String(e.message).includes(r) : r.test(String(e.message)))), `expected to throw ${r ?? ''}${e ? ' (threw: ' + e.message + ')' : ''}`); },
  };
}
export const expect = (a: any) => ({ ...matchers(a, false), not: matchers(a, true) });
