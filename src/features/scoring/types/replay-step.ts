import type { StandingRow } from './standing-row';

/** One position in the Replay: the Standings right after one Session. */
export interface ReplayStep {
  roundNumber: number;
  sessionType: string;
  /** How many points-paying Sessions the Round has (1 = a single Session, no Session label needed). */
  sessionsInRound: number;
  standings: StandingRow[];
}
