import type { Session } from './session';

export interface ScoringRule {
  /** points[session][position - 1] */
  points: Record<Session, number[]>;
  /** null = every round counts; otherwise only the best N round scores count */
  bestN: number | null;
  fastestLapPoints: number;
  fastestLapRequiresFinish: boolean;
}
