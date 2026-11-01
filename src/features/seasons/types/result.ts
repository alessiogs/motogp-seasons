import type { Outcome } from './outcome';

/** One Rider's outcome in one Session. */
export interface Result {
  /** Stable Rider ID (slug), independent of name spellings. */
  riderId: string;
  position: number | null;
  outcome: Outcome;
  fastestLap?: boolean;
  /** Only for anomalies affecting one Result (penalty). Replaces computed points, bonus included. */
  pointsOverride?: number | null;
  team: string | null;
  manufacturer: string | null;
  bikeNumber: number | null;
  /** The flag the Rider raced under this Season. */
  nationality: string | null;
  /** Where this Result came from, for auditing. */
  source: string;
}
