import { describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from './build-database';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

function fixtureWithRuleValidFor(years: number[]) {
  const dir = mkdtempSync(path.join(tmpdir(), 'motogp-validfor-'));
  cpSync(fixtureDir, dir, { recursive: true });
  const rulePath = path.join(dir, 'scoring-rules', 'mini-rule.json');
  const rule = JSON.parse(readFileSync(rulePath, 'utf8'));
  writeFileSync(rulePath, JSON.stringify({ ...rule, validFor: years }));
  return dir;
}

describe('buildDatabase', () => {
  it('refuses a Season whose year is not in the Scoring rule\'s validFor list', () => {
    const dir = fixtureWithRuleValidFor([1998]);
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).toThrow(/only verified for 1998, not 1999/);
  });

  it('accepts a Season whose year is in the list', () => {
    const dir = fixtureWithRuleValidFor([1999]);
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).not.toThrow();
  });
});
