import type { BoxColours } from './box-colours';

/** How one Result's Bike number is shown: a Classification row or a Podium Rider. */
export interface DisplayedNumber {
  /** The Bike number carried in this very Result; null when the source doesn't record it. */
  bikeNumber: number | null;
  /** The Bike number differs from the Rider's Season number; always false in a Season without Season numbers. */
  numberException: boolean;
  /** The number box, in this very Result's Team colour. */
  box: BoxColours;
}
