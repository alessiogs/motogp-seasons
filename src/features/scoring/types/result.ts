import type { Session } from './session';
import type { Status } from './status';

export interface Result {
  round: number;
  session: Session;
  riderId: number;
  position: number | null;
  status: Status;
  fastestLap?: boolean;
  /** Only for anomalies (half points, penalties). Replaces computed points, bonus included. */
  pointsOverride?: number | null;
}
