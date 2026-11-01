export interface ClassificationRow {
  riderId: string;
  /** "1", "2", ... for a finishing position; an en dash when there is none. */
  positionLabel: string;
  /** Null for a normal finish; otherwise how the Result ended, in words. */
  outcomeLabel: string | null;
  team: string | null;
  manufacturer: string | null;
  bikeNumber: number | null;
}
