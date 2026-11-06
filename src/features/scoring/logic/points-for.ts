import type { Result } from '@/features/seasons/types/result';
import type { Session } from '@/features/seasons/types/session';
import type { ScoringRule } from '../types/scoring-rule';

/** Points one Result is worth: position points x the Session's multiplier, plus the Fastest-lap bonus. */
export function pointsFor(result: Result, session: Session, rule: ScoringRule): number {
  if (result.pointsOverride != null) return result.pointsOverride;

  const classified = result.outcome === 'FIN' && result.position != null;
  let points = 0;
  if (classified) {
    points = (rule.points[session.type]?.[result.position! - 1] ?? 0) * session.pointsMultiplier;
  }
  if (result.fastestLap && rule.fastestLapPoints > 0 && (classified || !rule.fastestLapRequiresFinish)) {
    points += rule.fastestLapPoints;
  }
  return points;
}
