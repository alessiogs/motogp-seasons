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
  standings: { rider: string; points: number }[];
}

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-real-')), 'real.db');
  buildDatabase(dataDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

/** [points, riders] groups in the order the table lists them. */
function byPoints(rows: { rider: string; points: number }[]) {
  const groups: [number, string[]][] = [];
  for (const { rider, points } of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0] === points) last[1].push(rider);
    else groups.push([points, [rider]]);
  }
  return groups.map(([points, riders]) => [points, riders.sort()]);
}

describe.each(readdirSync(tablesDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')))(
  'final Step of %s',
  (name) => {
    const [classCode, year] = name.split('-');

    it("has Standings equal to the official final table (points and order)", () => {
      const official = JSON.parse(readFileSync(path.join(tablesDir, `${name}.json`), 'utf8')) as OfficialTable;
      const season = getSeason(classCode, Number(year))!;
      const steps = computeReplay(season);
      const scored = steps[steps.length - 1].standings.filter((r) => r.points > 0);
      // Riders level on points are compared as a group: the official tables record their order
      // only where a source stated it, and older tables list them in no stated order.
      expect(byPoints(scored.map((r) => ({ rider: r.riderId, points: r.points })))).toEqual(
        byPoints(official.standings.filter((r) => r.points > 0)),
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

describe('1976 500cc', () => {
  const season = () => getSeason('500cc', 1976)!;

  it('replays the 10 Rounds that had a 500cc race, one Step each', () => {
    const steps = computeReplay(season());
    expect(steps.map((s) => s.roundNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('uses two Counting windows and records what the rule was verified against', () => {
    const { rule } = season();
    expect(rule.countingWindows).toEqual([
      { fromRound: 1, toRound: 5, count: 3 },
      { fromRound: 6, toRound: 10, count: 3 },
    ]);
    expect(rule.source.length).toBeGreaterThan(0);
  });

  it('counts every score until a fourth Round of the first window has run', () => {
    // Sheene won Rounds 1-3: 45 points, nothing dropped yet.
    const sheene = computeReplay(season())[2].standings.find((r) => r.riderId === 'barry-sheene')!;
    expect(sheene).toMatchObject({ points: 45, grossPoints: 45, droppedRounds: [] });
  });

  it('drops a Round from the first window once Round 5 is run, the earliest of equal scores', () => {
    // Wins in Rounds 1, 2, 3 and 5 (no start in Round 4): 60 gross, best 3 = 45.
    const sheene = computeReplay(season())[4].standings.find((r) => r.riderId === 'barry-sheene')!;
    expect(sheene).toMatchObject({ points: 45, grossPoints: 60, droppedRounds: [1] });
  });

  it('gives Sheene 72 points from 87 gross at the end, the 1976 final table', () => {
    const sheene = computeReplay(season()).at(-1)!.standings[0];
    expect(sheene).toMatchObject({ riderId: 'barry-sheene', points: 72, grossPoints: 87, droppedRounds: [1] });
  });
});
