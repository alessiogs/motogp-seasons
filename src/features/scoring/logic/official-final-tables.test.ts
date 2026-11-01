import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '@/features/seasons/queries/get-season';
import { computeReplay } from './compute-replay';

// Real Seasons: the final Replay Step must equal the official final table, which is
// recorded separately (data/official-tables) from the Results it is checked against.
const dataDir = path.join(process.cwd(), 'data');
const tablesDir = path.join(dataDir, 'official-tables');

interface OfficialTable {
  standings: { position: number; rider: string; points: number }[];
}

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-real-')), 'real.db');
  buildDatabase(dataDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe.each(readdirSync(tablesDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')))(
  'final Step of %s',
  (name) => {
    const [classCode, year] = name.split('-');

    it("has Standings equal to the official final table (points and order)", () => {
      const official = JSON.parse(readFileSync(path.join(tablesDir, `${name}.json`), 'utf8')) as OfficialTable;
      const season = getSeason(classCode, Number(year))!;
      const steps = computeReplay(season);
      const scored = steps[steps.length - 1].standings.filter((r) => r.points > 0);
      expect(scored.map((r) => `${r.riderId} ${r.points}`)).toEqual(
        official.standings.filter((r) => r.points > 0).map((r) => `${r.rider} ${r.points}`),
      );
    });
  },
);

describe('2024 MotoGP', () => {
  it('replays with 2 Steps per Round, Sprint then Grand Prix race', () => {
    const steps = computeReplay(getSeason('motogp', 2024)!);
    expect(steps).toHaveLength(40);
    expect(steps.slice(0, 4).map((s) => [s.roundNumber, s.sessionType])).toEqual([
      [1, 'sprint'], [1, 'grand-prix-race'], [2, 'sprint'], [2, 'grand-prix-race'],
    ]);
  });

  it('has a source on every Result and a verification source on the Scoring rule', () => {
    const season = getSeason('motogp', 2024)!;
    expect(season.rule.source.length).toBeGreaterThan(0);
    const results = season.rounds.flatMap((r) => r.sessions.flatMap((s) => s.results));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.source.length > 0)).toBe(true);
  });
});
