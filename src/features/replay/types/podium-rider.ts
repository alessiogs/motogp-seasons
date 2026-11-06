import type { DisplayedNumber } from './displayed-number';

/** A Rider standing on a Podium place: the top of the Classification, so everything comes from that Result. */
export interface PodiumRider extends DisplayedNumber {
  riderId: string;
  team: string | null;
  manufacturer: string | null;
}
