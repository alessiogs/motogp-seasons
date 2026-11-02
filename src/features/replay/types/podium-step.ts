import type { PodiumRider } from './podium-rider';

/** One step of a three-step Podium. */
export interface PodiumStep {
  place: 1 | 2 | 3;
  /** Null when fewer Riders were Classified than this place needs: the step stands empty. */
  rider: PodiumRider | null;
}
