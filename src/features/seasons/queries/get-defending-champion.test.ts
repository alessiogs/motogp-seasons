import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getDefendingChampion } from './get-defending-champion';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-')), 'test.db');
  buildDatabase(fixtureDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe('getDefendingChampion', () => {
  it("returns the previous Season's World Champion in the same Category, crossing Classes", () => {
    // 500cc 1999: Rider One 5 (Sprint) + 4.5 (override) = 9.5 beats Rider Two's (10 + 1) x 0.5 = 5.5.
    expect(getDefendingChampion('motogp', 2000)).toEqual({ riderId: 'rider-one', name: 'Rider One' });
  });

  it('returns null when the previous Season is not loaded', () => {
    expect(getDefendingChampion('500cc', 1999)).toBeNull();
  });
});
