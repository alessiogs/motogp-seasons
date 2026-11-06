import type { StandingRow } from './standing-row';
import type { TitleCondition } from './title-condition';

/** One position in the Replay: the Standings right after one Session. */
export interface ReplayStep {
  roundNumber: number;
  sessionType: string;
  /** How many points-paying Sessions the Round has (1 = a single Session, no Session label needed). */
  sessionsInRound: number;
  standings: StandingRow[];
  /** The World Champion, if crowned at or before this Step. */
  worldChampion: string | null;
  /**
   * Riders with a Title chance in the next Round, in Standings order. Only on the Step before a Round,
   * and empty once a World Champion is crowned.
   */
  titleChances: string[];
  /** What each Rider who can be crowned at the next Step needs from it, in Standings order. */
  titleConditions: TitleCondition[];
}
