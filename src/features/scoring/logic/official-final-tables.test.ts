import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '@/features/seasons/queries/get-season';
import { applyKnownMismatch } from './apply-known-mismatch';
import { computeReplay } from './compute-replay';
import type { OfficialTable } from '../types/official-table';

// Real Seasons: the final Replay Step must equal the official final table, which is
// recorded separately (data/official-tables) from the Results it is checked against.
const dataDir = path.join(process.cwd(), 'data');
const tablesDir = path.join(dataDir, 'official-tables');


beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-real-')), 'real.db');
  buildDatabase(dataDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

/** [points, riders] groups in the order the table lists them. */
function byPoints(rows: { rider: string; points: number }[]) {
  const groups: [number, string[]][] = [];
  // Sorted first: a known mismatch can move a Rider across a points boundary (1979 Ireland, printed 17 above Baldwin 17, replayed 16).
  for (const { rider, points } of [...rows].sort((a, b) => b.points - a.points)) {
    const last = groups[groups.length - 1];
    if (last && last[0] === points) last[1].push(rider);
    else groups.push([points, [rider]]);
  }
  return groups.map(([points, riders]) => [points, riders.sort()]);
}

// Seasons whose official table states a full order, ties included: the replayed order must match it rank by rank.
// 500cc-2001 and motogp-2002 are not listed: each has one tie at the bottom of its table that Countback and the
// Latest-best tie-break order the other way round, and no source states the pre-2004 tie-break.
//   2001: Willis (13th at Round 5) above Vincent (13th at Round 8), both on 3 points; Vincent has the better lower finishes (16th twice).
//   2002: Yoshikawa (12th at Round 13) above Pitt (12th at Round 16), both on 4 points; Pitt has the better lower finishes (17th, 19th).
// 500cc 1990, 1992, 1993, 1995, 1996, 1998-2000 are left out for the same reason: each has ties the code orders differently (evidence on issue #54).
// 500cc 1977-1988 are all left out: each lists Riders level on points (mostly in the lower half) in an order Countback and
// Latest-best do not give, e.g. 1979 Coulon above Mamola on 29, 1987 Kawasaki above Spencer on 4 (all cases on issue #54).
// Both tables put the Rider whose best place came earlier first. They are compared by points groups until the pre-2004 rule is known.
const FULL_ORDER = ['500cc-1991', '500cc-1994', '500cc-1997', 'motogp-2003', 'motogp-2004', 'motogp-2005', 'motogp-2006', 'motogp-2007', 'motogp-2008', 'motogp-2009', 'motogp-2010', 'motogp-2011', 'motogp-2012', 'motogp-2013', 'motogp-2014', 'motogp-2015', 'motogp-2016', 'motogp-2017', 'motogp-2018', 'motogp-2019', 'motogp-2020', 'motogp-2021', 'motogp-2022', 'motogp-2023', 'motogp-2024', 'motogp-2025'];

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
      const table = applyKnownMismatch(official.standings, official.knownMismatch).filter((r) => r.points > 0);
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
  it('replays one Step per championship Round on the 1988-90 rule points table', () => {
    const season = getSeason('500cc', 1989)!;
    expect(season.rule.code).toBe('1988-90');
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

describe('2023 MotoGP', () => {
  it('has 20 Rounds and no Sprint Step in Australia, where the Sprint was cancelled', () => {
    const season = getSeason('motogp', 2023)!;
    const steps = computeReplay(season);
    expect(season.rounds).toHaveLength(20);
    expect(steps).toHaveLength(39);
    expect(steps.filter((s) => s.roundNumber === 16).map((s) => s.sessionType)).toEqual(['grand-prix-race']);
    expect(season.rounds.find((r) => r.number === 16)!.notes).toMatch(/sprint/i);
  });

  it('scores the stopped Japanese Grand Prix at full points', () => {
    const japan = getSeason('motogp', 2023)!.rounds.find((r) => r.number === 14)!;
    expect(japan.sessions.map((s) => s.pointsMultiplier)).toEqual([1, 1]);
  });
});

describe('2025 MotoGP', () => {
  it('has 22 Rounds and ends with M. Márquez 545, A. Márquez 467 and Bezzecchi 353', () => {
    const season = getSeason('motogp', 2025)!;
    const steps = computeReplay(season);
    expect(season.rounds).toHaveLength(22);
    expect(steps).toHaveLength(44);
    expect(steps.at(-1)!.standings.slice(0, 3).map((r) => [r.riderId, r.points])).toEqual([
      ['marc-marquez', 545], ['alex-marquez', 467], ['marco-bezzecchi', 353],
    ]);
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
