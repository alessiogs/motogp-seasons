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

// Seasons whose official table states a full order, ties included: the replayed order must match it rank by rank.
const FULL_ORDER = ['motogp-2024'];

describe.each(readdirSync(tablesDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')))(
  'final Step of %s',
  (name) => {
    const [classCode, year] = name.split('-');

    it("has Standings equal to the official final table (points and order)", () => {
      const official = JSON.parse(readFileSync(path.join(tablesDir, `${name}.json`), 'utf8')) as OfficialTable;
      const season = getSeason(classCode, Number(year))!;
      const steps = computeReplay(season);
      const scored = steps[steps.length - 1].standings.filter((r) => r.points > 0);
      const replayed = scored.map((r) => ({ rider: r.riderId, points: r.points }));
      const table = official.standings.filter((r) => r.points > 0);
      if (FULL_ORDER.includes(name)) {
        expect(replayed).toEqual(table.map(({ rider, points }) => ({ rider, points })));
      } else {
        // Riders level on points are compared as a group: older tables state no order among them
        // (they list tied riders arbitrarily), so only the points order can be checked.
        expect(byPoints(replayed)).toEqual(byPoints(table));
      }
    });
  },
);

describe('1949 500cc', () => {
  it('replays one Step per Round on the 10-8-7-6-5 table, with only the best three Round scores counting', () => {
    const season = getSeason('500cc', 1949)!;
    expect(computeReplay(season)).toHaveLength(6);
    expect(season.rule.points['grand-prix-race']).toEqual([10, 8, 7, 6, 5]);
    expect(season.rule.fastestLapPoints).toBe(1);
    expect(season.rule.countingWindows).toEqual([{ fromRound: 1, toRound: 6, count: 3 }]);
  });

  it('gives Graham 31 Gross points but 30 Championship points, his Isle of Man point being a fastest lap from 10th place', () => {
    const final = computeReplay(getSeason('500cc', 1949)!).at(-1)!.standings;
    const graham = final.find((r) => r.riderId === 'leslie-graham')!;
    expect([graham.grossPoints, graham.points, graham.roundScores[0]]).toEqual([31, 30, 1]);
  });
});

describe('1989 500cc', () => {
  it('replays one Step per championship Round on the 1988-91 points table', () => {
    const season = getSeason('500cc', 1989)!;
    expect(computeReplay(season)).toHaveLength(15);
    expect(season.rule.points['grand-prix-race']).toEqual([20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('scores the Belgian Grand Prix at Half points and notes that its Result is the aggregate of the parts', () => {
    const season = getSeason('500cc', 1989)!;
    const belgium = season.rounds.find((r) => r.number === 10)!;
    expect(belgium.sessions[0].pointsMultiplier).toBe(0.5);
    expect(belgium.notes).toMatch(/aggregate/i);
    const lawson = computeReplay(season)[9].standings.find((r) => r.riderId === 'eddie-lawson')!;
    expect(lawson.roundScores[9]).toBe(10);
  });
});

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
