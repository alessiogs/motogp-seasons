import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import type { Season } from '../types/season';
import { getSeason } from './get-season';
import { listSeasons } from './list-seasons';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

const fixtureSeason: Season = {
  classCode: '500cc',
  className: '500cc',
  year: 1999,
  notes: 'Fixture season',
  rule: {
    code: 'mini-rule',
    name: 'Mini rule',
    source: 'made up for tests',
    notes: 'Fixture',
    fastestLapPoints: 1,
    fastestLapRequiresFinish: true,
    countingWindows: [{ fromRound: 1, toRound: 2, count: 1 }],
    points: { 'grand-prix-race': [10, 8, 6], sprint: [5, 3] },
  },
  riders: { 'rider-one': { name: 'Rider One' }, 'rider-two': { name: 'Rider Two' } },
  rounds: [
    {
      number: 1,
      name: 'Fixture Grand Prix',
      circuit: 'Fixture Circuit',
      country: 'ITA',
      date: '1999-04-11',
      nonChampionship: false,
      notes: null,
      sessions: [
        {
          type: 'sprint',
          order: 1,
          date: '1999-04-10',
          pointsMultiplier: 1,
          notes: null,
          results: [
            { riderId: 'rider-one', position: 1, outcome: 'FIN', fastestLap: false, pointsOverride: null, team: 'Team A', manufacturer: 'Maker A', bikeNumber: 1, nationality: 'ITA', source: 'fixture' },
            { riderId: 'rider-two', position: null, outcome: 'DNF', fastestLap: false, pointsOverride: null, team: null, manufacturer: null, bikeNumber: null, nationality: null, source: 'fixture' },
          ],
        },
        {
          type: 'grand-prix-race',
          order: 2,
          date: '1999-04-11',
          pointsMultiplier: 0.5,
          notes: 'Stopped early',
          results: [
            { riderId: 'rider-two', position: 1, outcome: 'FIN', fastestLap: true, pointsOverride: null, team: 'Team B', manufacturer: 'Maker B', bikeNumber: 2, nationality: 'ESP', source: 'fixture' },
            { riderId: 'rider-one', position: 2, outcome: 'FIN', fastestLap: false, pointsOverride: 4.5, team: 'Team A', manufacturer: 'Maker A', bikeNumber: 1, nationality: 'ITA', source: 'fixture' },
          ],
        },
      ],
    },
    {
      number: 2,
      name: 'Fixture Exhibition',
      circuit: null,
      country: null,
      date: null,
      nonChampionship: true,
      notes: 'Held but no points',
      sessions: [],
    },
  ],
};

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-')), 'test.db');
  buildDatabase(fixtureDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe('data seam: Season JSON -> generated SQLite -> build-time query', () => {
  it('returns the same Season that the JSON files describe', () => {
    expect(getSeason('500cc', 1999)).toEqual(fixtureSeason);
  });

  it('returns null for a Season that has no data', () => {
    expect(getSeason('motogp', 1999)).toBeNull();
  });

  it('lists Seasons by Class, Classes ordered by Category', () => {
    expect(listSeasons()).toEqual([{ classCode: '500cc', className: '500cc', year: 1999 }]);
  });
});
