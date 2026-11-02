/** A Rider standing on a Podium step. Box colour belongs here once the view model has it (#26). */
export interface PodiumRider {
  riderId: string;
  team: string | null;
  manufacturer: string | null;
  /** The Rider's Season number, not the Bike number of this Result; null when the Season has none. */
  seasonNumber: number | null;
}
