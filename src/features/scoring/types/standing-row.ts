export interface StandingRow {
  rank: number;
  riderId: number;
  /** Championship points (after dropped scores) */
  points: number;
  /** All points scored, before drops */
  grossPoints: number;
  /** Points from each round so far, index 0 = round 1 */
  roundScores: number[];
  /** Rounds whose score was dropped (1-based round numbers) */
  droppedRounds: number[];
  wins: number;
  podiums: number;
}
