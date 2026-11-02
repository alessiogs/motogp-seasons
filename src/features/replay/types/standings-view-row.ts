import type { StandingRow } from '@/features/scoring/types/standing-row';

/** One Standings row as the Season page shows it. */
export interface StandingsViewRow extends StandingRow {
  /** Places gained (positive) or lost (negative) since the previous Step; 0 on the first Step or for a new Rider. */
  rankChange: number;
  /** Championship points behind the leader; null for the leader. */
  gap: number | null;
}
