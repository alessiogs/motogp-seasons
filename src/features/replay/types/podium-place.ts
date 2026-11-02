import type { PodiumRider } from './podium-rider';

/** One place of a three-place Podium. */
export interface PodiumPlace {
  place: 1 | 2 | 3;
  /** Null when fewer Riders were Classified than this place needs: the place stands empty. */
  rider: PodiumRider | null;
}
