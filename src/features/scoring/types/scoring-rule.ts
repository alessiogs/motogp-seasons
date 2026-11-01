/** Only the best `count` Round scores from rounds `fromRound`..`toRound` count. */
export interface CountingWindow {
  fromRound: number;
  toRound: number;
  count: number;
}

export interface ScoringRule {
  code: string;
  name: string;
  /** points[sessionType][position - 1]; a Session type without a table pays nothing and is not a Step. */
  points: Record<string, number[]>;
  /** Empty = every Round score counts. */
  countingWindows: CountingWindow[];
  fastestLapPoints: number;
  fastestLapRequiresFinish: boolean;
  /** What the rule was verified against. Seasons with an unverified rule are not published. */
  source: string;
  notes?: string | null;
}
