import type { BoxColours } from './box-colours';

/** A Rider standing on a Podium step: the top of the Classification, so everything comes from that Result. */
export interface PodiumRider {
  riderId: string;
  team: string | null;
  manufacturer: string | null;
  /** The Bike number carried in this Result; null when the source doesn't record it. */
  bikeNumber: number | null;
  /** The Bike number differs from the Rider's Season number; always false in a Season without Season numbers. */
  numberException: boolean;
  /** The number box, in this Result's Team colour. */
  box: BoxColours;
}
