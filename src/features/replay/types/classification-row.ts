export interface ClassificationRow {
  riderId: string;
  /** "1", "2", ... for a finishing position; an en dash when there is none. */
  positionLabel: string;
  /** Null for a normal finish; otherwise how the Result ended, in words. */
  outcomeLabel: string | null;
  team: string | null;
  manufacturer: string | null;
  /** The Bike number carried in this very Result; null when the source doesn't record it. */
  bikeNumber: number | null;
  /** The Bike number differs from the Rider's Season number; always false in a Season without Season numbers. */
  numberException: boolean;
}
