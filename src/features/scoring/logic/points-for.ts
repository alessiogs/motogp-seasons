import type { Result } from '../types/result';
import type { ScoringRule } from '../types/scoring-rule';

/** Points a single result is worth under the rule. */
export function pointsFor(r: Result, rule: ScoringRule): number {
  if (r.pointsOverride != null) return r.pointsOverride;

  const classified = r.status === 'FIN' && r.position != null;
  let pts = 0;
  if (classified) pts = rule.points[r.session][r.position! - 1] ?? 0;

  if (r.fastestLap && rule.fastestLapPoints > 0 && (classified || !rule.fastestLapRequiresFinish)) {
    pts += rule.fastestLapPoints;
  }
  return pts;
}
