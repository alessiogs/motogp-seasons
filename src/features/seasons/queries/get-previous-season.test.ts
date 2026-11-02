import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getPreviousSeason } from './get-previous-season';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-')), 'test.db');
  buildDatabase(fixtureDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe('getPreviousSeason', () => {
  it("returns the previous year's Season in the same Category, crossing Classes", () => {
    const previous = getPreviousSeason('motogp', 2000);
    expect([previous?.classCode, previous?.year]).toEqual(['500cc', 1999]);
  });

  it('returns null when the previous Season is not loaded', () => {
    expect(getPreviousSeason('500cc', 1999)).toBeNull();
  });
});
