/** One Rider's result in a Session, as far as the title is concerned. `position` null = scores no points. */
export interface SessionResult {
  position: number | null;
  fastestLap: boolean;
}

/** He must outscore `rivalId` in the next Step by `margin` points (zero or less: may be outscored by -margin). */
export interface RivalMargin {
  rivalId: string;
  margin: number;
  /** A smaller margin that is enough if he wins the Session, because he then wins the tie-break. */
  marginIfWins?: number;
}

/**
 * One way of being crowned: he finishes `worst` or better, and each listed rival finishes no better
 * than `atBest`. A clause whose `worst` scores no points needs nothing from him.
 */
export interface OutcomeClause {
  worst: SessionResult;
  rivals: { rivalId: string; atBest: SessionResult }[];
}

/**
 * What a Rider needs from the next Step to be crowned World Champion there.
 * `margin`: he must outscore every listed rival by its margin. `outcome`: used when no single margin per
 * rival is exact (typically with Counting windows); any one clause is enough.
 */
export type TitleCondition =
  | { riderId: string; kind: 'margin'; rivals: RivalMargin[] }
  | { riderId: string; kind: 'outcome'; clauses: OutcomeClause[] };
