import { describe, it, expect } from 'vitest';
import { computeSeason } from './compute-season';
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

const fin = (round: number, riderId: number, position: number, session: 'race' | 'sprint' = 'race'): Result =>
  ({ round, session, riderId, position, status: 'FIN' });

describe('computeSeason', () => {
  it('returns one standings table per round', () => {
    const season = computeSeason([fin(1, 1, 1), fin(2, 2, 1), fin(3, 1, 1)], modern);
    expect(season).toHaveLength(3);
    expect(season[2][0]).toMatchObject({ riderId: 1, points: 50 });
  });
});
