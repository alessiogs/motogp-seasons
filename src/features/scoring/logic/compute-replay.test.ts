import { describe, it, expect } from 'vitest';
import { computeReplay } from './compute-replay';
import type { Season } from '@/features/seasons/types/season';
import type { Round } from '@/features/seasons/types/round';
import type { Session } from '@/features/seasons/types/session';
import type { Result } from '@/features/seasons/types/result';
import type { ScoringRule } from '../types/scoring-rule';

// Made-up Seasons built from small helpers; every expected value is worked out by hand in its test.

const modern: ScoringRule = {
  code: 'test-modern',
  name: 'Test modern',
  points: {
    'grand-prix-race': [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    sprint: [12, 9, 7, 6, 5, 4, 3, 2, 1],
  },
  countingWindows: [],
  fastestLapPoints: 0,
  fastestLapRequiresFinish: true,
  source: 'made up',
};

/** Early-era style: 10-8-7-6-5, Fastest-lap bonus of 1 for finishers. */
const early: ScoringRule = {
  ...modern,
  code: 'test-early',
  points: { 'grand-prix-race': [10, 8, 7, 6, 5] },
  fastestLapPoints: 1,
};

const base = { team: null, manufacturer: null, bikeNumber: null, nationality: null, source: 'test' };

/** finishers('a', 'b') = a wins, b second. Pass a Result for anything unusual. */
function finishers(...order: Array<string | Result>): Result[] {
  return order.map((entry, i) =>
    typeof entry === 'string' ? { ...base, riderId: entry, position: i + 1, outcome: 'FIN' as const } : entry,
  );
}

const retired = (riderId: string, extra: Partial<Result> = {}): Result =>
  ({ ...base, riderId, position: null, outcome: 'DNF', ...extra });

const session = (type: string, order: number, res: Result[], extra: Partial<Session> = {}): Session => ({
  type, order, date: null, pointsMultiplier: 1, results: res, ...extra,
});

const gp = (...order: Array<string | Result>) => session('grand-prix-race', 2, finishers(...order));
const sprint = (...order: Array<string | Result>) => session('sprint', 1, finishers(...order));

const round = (number: number, sessions: Session[], extra: Partial<Round> = {}): Round => ({
  number, name: `Round ${number}`, circuit: null, country: null, date: null, nonChampionship: false, sessions, ...extra,
});

const season = (rounds: Round[], rule: ScoringRule = modern): Season => ({
  classCode: 'test', className: 'Test', year: 2000, rule, rounds, riders: {},
});

/** [riderId, Championship points] in ranked order after the given Step. */
const table = (s: Season, step: number) => computeReplay(s)[step].standings.map((r) => [r.riderId, r.points]);
const order = (s: Season, step: number) => computeReplay(s)[step].standings.map((r) => r.riderId);

describe('computeReplay', () => {
  it('gives one Step per Session, Sprint then Grand Prix race, labelled with Round and Session', () => {
    const steps = computeReplay(season([
      round(1, [sprint('a', 'b'), gp('b', 'a')]),
      round(2, [gp('a', 'b')]),
    ]));
    expect(steps.map((s) => [s.roundNumber, s.sessionType, s.sessionsInRound])).toEqual([
      [1, 'sprint', 2], [1, 'grand-prix-race', 2], [2, 'grand-prix-race', 1],
    ]);
  });

  it('adds Sprint and Grand Prix race points Step by Step', () => {
    const s = season([round(1, [sprint('a', 'b'), gp('b', 'a')])]);
    expect(table(s, 0)).toEqual([['a', 12], ['b', 9]]);
    // a: 12 + 20, b: 9 + 25
    expect(table(s, 1)).toEqual([['b', 34], ['a', 32]]);
  });

  it('reports Gross points, Round scores, wins and podiums from Grand Prix races', () => {
    const s = season([
      round(1, [sprint('a', 'b'), gp('b', 'a', 'c')]),
      round(2, [gp('a', 'c', 'b')]),
    ]);
    const a = computeReplay(s)[2].standings.find((r) => r.riderId === 'a')!;
    expect(a).toMatchObject({ points: 57, grossPoints: 57, roundScores: [32, 25], wins: 1, podiums: 2 });
  });

  it('scores nothing for riders who did not finish', () => {
    const s = season([round(1, [session('grand-prix-race', 2, [...finishers('a'), retired('b')])])]);
    expect(table(s, 0)).toEqual([['a', 25], ['b', 0]]);
  });

  it('lets a points override replace the computed points', () => {
    const s = season([
      round(1, [gp('a', { ...base, riderId: 'b', position: 2, outcome: 'FIN', pointsOverride: 5 })]),
    ]);
    expect(table(s, 0)).toEqual([['a', 25], ['b', 5]]);
  });

  it('scales a Session by its points multiplier (Half points)', () => {
    const s = season([
      round(1, [session('grand-prix-race', 2, finishers('a', 'b'), { pointsMultiplier: 0.5 })]),
    ]);
    expect(table(s, 0)).toEqual([['a', 12.5], ['b', 10]]);
  });

  it('adds the Fastest-lap bonus to finishers only', () => {
    const s = season([
      round(1, [session('grand-prix-race', 2, [
        { ...base, riderId: 'a', position: 1, outcome: 'FIN' },
        { ...base, riderId: 'b', position: 2, outcome: 'FIN', fastestLap: true },
        retired('c', { fastestLap: true }),
      ])]),
    ], early);
    expect(table(s, 0)).toEqual([['a', 10], ['b', 9], ['c', 0]]);
  });

  it('lets a points override beat both the points multiplier and the Fastest-lap bonus', () => {
    const s = season([
      round(1, [session('grand-prix-race', 2, [
        { ...base, riderId: 'a', position: 1, outcome: 'FIN', fastestLap: true, pointsOverride: 3 },
        { ...base, riderId: 'b', position: 2, outcome: 'FIN' },
      ], { pointsMultiplier: 0.5 })]),
    ], early);
    // a: override 3 only (not 10 x 0.5 + 1); b: 8 x 0.5
    expect(table(s, 0)).toEqual([['b', 4], ['a', 3]]);
  });

  it('applies the Half points multiplier before adding the Fastest-lap bonus', () => {
    const s = season([
      round(1, [session('grand-prix-race', 2, [
        { ...base, riderId: 'a', position: 1, outcome: 'FIN', fastestLap: true },
      ], { pointsMultiplier: 0.5 })]),
    ], early);
    // 10 x 0.5 + 1
    expect(table(s, 0)).toEqual([['a', 6]]);
  });

  it('gives a Fastest-lap bonus to a classified finisher outside the points', () => {
    const s = season([
      round(1, [session('grand-prix-race', 2, [
        ...finishers('a', 'b', 'c', 'd', 'e'),
        { ...base, riderId: 'f', position: 10, outcome: 'FIN', fastestLap: true },
      ])]),
    ], early);
    expect(table(s, 0).find(([id]) => id === 'f')).toEqual(['f', 1]);
  });

  it('adds no Step and no points for a Non-championship round', () => {
    const s = season([
      round(1, [gp('a', 'b')]),
      round(2, [gp('b', 'a')], { nonChampionship: true }),
      round(3, [gp('a', 'b')]),
    ]);
    const steps = computeReplay(s);
    expect(steps.map((x) => x.roundNumber)).toEqual([1, 3]);
    expect(table(s, 1)).toEqual([['a', 50], ['b', 40]]);
  });

  describe('ranking', () => {
    it('breaks a points tie by Countback on Grand Prix race finishes, ignoring Sprints', () => {
      // z: Sprint 3rd (7) + GP win (25) = 32. a: Sprint win (12) + GP 2nd (20) = 32.
      // z has the Grand Prix win; a's Sprint win does not count. (Ids chosen so that
      // falling back to alphabetical order would put a first.)
      const s = season([round(1, [sprint('a', 'x', 'z'), gp('z', 'a')])]);
      expect(table(s, 1).filter(([r]) => r === 'a' || r === 'z')).toEqual([['z', 32], ['a', 32]]);
    });

    it('breaks a full Countback tie by the Latest-best tie-break, so ranks are never shared', () => {
      // Each rider wins one Grand Prix and finishes second in the other: identical finishes, 45 points.
      // a won Round 1, b won Round 2: b achieved the best place more recently and ranks ahead.
      const s = season([round(1, [gp('a', 'b')]), round(2, [gp('b', 'a')])]);
      const final = computeReplay(s)[1].standings;
      expect(final.map((r) => [r.riderId, r.points, r.rank])).toEqual([['b', 45, 1], ['a', 45, 2]]);
    });
  });

  describe('Counting windows', () => {
    const best2 = (n = 2): ScoringRule => ({ ...early, countingWindows: [{ fromRound: 1, toRound: 10, count: n }] });
    // Round scores for a: 10, 5 (position 5), 8.
    const threeRounds = (rule: ScoringRule) => season([
      round(1, [gp('a', 'b')]),
      round(2, [gp('b', 'c', 'd', 'e', 'a')]),
      round(3, [gp('b', 'a')]),
    ], rule);

    it('counts every Round score until a window has more Rounds than it counts', () => {
      const a = computeReplay(threeRounds(best2()))[1].standings.find((r) => r.riderId === 'a')!;
      expect(a).toMatchObject({ points: 15, grossPoints: 15, droppedRounds: [] });
    });

    it('drops the worst Round scores progressively, from Rounds already run', () => {
      const a = computeReplay(threeRounds(best2()))[2].standings.find((r) => r.riderId === 'a')!;
      expect(a).toMatchObject({ points: 18, grossPoints: 23, droppedRounds: [2], roundScores: [10, 5, 8] });
    });

    it('marks the earlier Round as dropped when two Round scores are equal', () => {
      const tie = season([round(1, [gp('a')]), round(2, [gp('a')]), round(3, [gp('a')])], best2());
      expect(computeReplay(tie)[2].standings[0]).toMatchObject({ points: 20, grossPoints: 30, droppedRounds: [1] });
    });

    it('applies two independent windows (1976: best 3 of the first 5 plus best 3 of the last 5)', () => {
      const rule: ScoringRule = {
        ...early,
        countingWindows: [{ fromRound: 1, toRound: 5, count: 1 }, { fromRound: 6, toRound: 10, count: 1 }],
      };
      // a scores 10, 8, then 10, 8 in two windows of two rounds each (rounds 1-2 and 6-7).
      const rounds = [
        round(1, [gp('a')]), round(2, [gp('x', 'a')]), round(3, [gp('x')]), round(4, [gp('x')]), round(5, [gp('x')]),
        round(6, [gp('a')]), round(7, [gp('x', 'a')]),
      ];
      const a = computeReplay(season(rounds, rule))[6].standings.find((r) => r.riderId === 'a')!;
      expect(a).toMatchObject({ points: 20, grossPoints: 36, droppedRounds: [2, 7] });
    });
  });
});
