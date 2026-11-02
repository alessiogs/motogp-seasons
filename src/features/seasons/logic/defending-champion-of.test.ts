import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '../queries/get-season';
import { defendingChampionOf } from './defending-champion-of';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-')), 'test.db');
  buildDatabase(fixtureDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe('defendingChampionOf', () => {
  it("names the previous Season's World Champion", () => {
    // 500cc 1999: Rider One 5 (Sprint) + 4.5 (override) = 9.5 beats Rider Two's (10 + 1) x 0.5 = 5.5.
    expect(defendingChampionOf(getSeason('500cc', 1999))).toEqual({ riderId: 'rider-one', name: 'Rider One' });
  });

  it('is null when there is no previous Season', () => {
    expect(defendingChampionOf(null)).toBeNull();
  });

  it('is null when the previous Season crowned nobody', () => {
    expect(defendingChampionOf({ ...getSeason('500cc', 1999)!, rounds: [] })).toBeNull();
  });
});
