import { describe, it, expect } from 'vitest';
import { computeStandings, computeSeason, pointsFor, type Result, type ScoringRule } from './standings';

const modern: ScoringRule = {
  points: {
    race: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    sprint: [12, 9, 7, 6, 5, 4, 3, 2, 1],
  },
  bestN: null,
  fastestLapPoints: 0,
  fastestLapRequiresFinish: true,
};

// Made-up early-era style rule for testing mechanics (not a real season's rule).
const bestTwo: ScoringRule = {
  points: { race: [10, 8, 7, 6, 5], sprint: [] },
  bestN: 2,
  fastestLapPoints: 1,
  fastestLapRequiresFinish: true,
};

const fin = (round: number, riderId: number, position: number, session: 'race' | 'sprint' = 'race'): Result =>
  ({ round, session, riderId, position, status: 'FIN' });

describe('pointsFor', () => {
  it('scores race and sprint positions', () => {
    expect(pointsFor(fin(1, 1, 1), modern)).toBe(25);
    expect(pointsFor(fin(1, 1, 1, 'sprint'), modern)).toBe(12);
    expect(pointsFor(fin(1, 1, 16), modern)).toBe(0);
  });

  it('gives nothing for DNF', () => {
    expect(pointsFor({ round: 1, session: 'race', riderId: 1, position: null, status: 'DNF' }, modern)).toBe(0);
  });

  it('adds fastest lap bonus only when finished', () => {
    expect(pointsFor({ ...fin(1, 1, 2), fastestLap: true }, bestTwo)).toBe(9);
    expect(pointsFor({ round: 1, session: 'race', riderId: 1, position: null, status: 'DNF', fastestLap: true }, bestTwo)).toBe(0);
  });

  it('respects overrides (half points)', () => {
    expect(pointsFor({ ...fin(1, 1, 1), pointsOverride: 12.5 }, modern)).toBe(12.5);
  });
});

describe('computeStandings', () => {
  it('sums race + sprint', () => {
    const results = [fin(1, 1, 1), fin(1, 1, 2, 'sprint'), fin(1, 2, 2), fin(1, 2, 1, 'sprint')];
    const s = computeStandings(results, modern, 1);
    expect(s.map((r) => [r.riderId, r.points])).toEqual([[1, 34], [2, 32]]);
  });

  it('breaks ties by countback on race wins', () => {
    // Both on 41 points; rider 1 has a win, rider 2 doesn't, so rider 1 ranks ahead.
    const results = [
      fin(1, 1, 1), fin(2, 1, 3),                       // 25 + 16 = 41
      fin(1, 2, 2), fin(2, 2, 2), fin(2, 2, 9, 'sprint'), // 20 + 20 + 1 = 41
    ];
    const s = computeStandings(results, modern, 2);
    expect(s[0]).toMatchObject({ riderId: 1, rank: 1, points: 41 });
    expect(s[1]).toMatchObject({ riderId: 2, rank: 2, points: 41 });
  });

  it('only counts rounds up to the requested one', () => {
    const results = [fin(1, 1, 1), fin(2, 2, 1), fin(3, 2, 1)];
    expect(computeStandings(results, modern, 1).map((r) => r.riderId)).toEqual([1]);
    expect(computeStandings(results, modern, 3)[0].riderId).toBe(2);
  });

  it('applies best-N dropped scores progressively', () => {
    const results = [fin(1, 1, 1), fin(2, 1, 5), fin(3, 1, 2)]; // 10, 5, 8
    expect(computeStandings(results, bestTwo, 2)[0]).toMatchObject({ points: 15, droppedRounds: [] });
    expect(computeStandings(results, bestTwo, 3)[0]).toMatchObject({ points: 18, grossPoints: 23, droppedRounds: [2] });
  });
});

describe('computeSeason', () => {
  it('returns one standings table per round', () => {
    const season = computeSeason([fin(1, 1, 1), fin(2, 2, 1), fin(3, 1, 1)], modern);
    expect(season).toHaveLength(3);
    expect(season[2][0]).toMatchObject({ riderId: 1, points: 50 });
  });
});
