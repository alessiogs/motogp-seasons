import { describe, it, expect } from 'vitest';
import { pointsFor } from './points-for';
import type { Result } from '../types/result';
import type { ScoringRule } from '../types/scoring-rule';

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
