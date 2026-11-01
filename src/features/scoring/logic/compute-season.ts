import type { Result } from '../types/result';
import type { ScoringRule } from '../types/scoring-rule';
import type { StandingRow } from '../types/standing-row';
import { computeStandings } from './compute-standings';

/** Standings after every round: index 0 = after round 1. Ideal for the slider JSON. */
export function computeSeason(results: Result[], rule: ScoringRule): StandingRow[][] {
  const lastRound = results.reduce((m, r) => Math.max(m, r.round), 0);
  return Array.from({ length: lastRound }, (_, i) => computeStandings(results, rule, i + 1));
}
