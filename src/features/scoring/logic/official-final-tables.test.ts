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

/** [points, riders sorted by id] per run of equal points, in table order. */
function groupByPoints(rows: { rider: string; points: number }[]): [number, string[]][] {
  const groups: [number, string[]][] = [];
  for (const { rider, points } of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0] === points) last[1].push(rider);
    else groups.push([points, [rider]]);
  }
  return groups.map(([points, riders]) => [points, riders.sort()]);
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
      const expected = official.standings.filter((r) => r.points > 0);
      // Riders level on points are compared as a group: older tables list them in an order that
      // follows no tie-break, while the Replay orders them by Countback then Latest-best (ADR-0005).
      expect(groupByPoints(scored.map((r) => ({ rider: r.riderId, points: r.points })))).toEqual(
        groupByPoints(expected),
      );
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
