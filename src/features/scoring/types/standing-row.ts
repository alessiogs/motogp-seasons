export interface StandingRow {
  /** No shared ranks: ties are always broken. */
  rank: number;
  riderId: string;
  /** Championship points (after Dropped scores) */
  points: number;
  /** All points scored, before Dropped scores */
  grossPoints: number;
  /** Round score per Round, index 0 = Round 1 (0 for Rounds not scored) */
  roundScores: number[];
  /** Round numbers whose score was dropped */
  droppedRounds: number[];
  wins: number;
  podiums: number;
}
