import type { ReplayStep } from '@/features/scoring/types/replay-step';
import type { CalendarEntry } from './calendar-entry';
import type { ClassificationRow } from './classification-row';
import type { PodiumPlace } from './podium-place';
import type { StandingsViewRow } from './standings-view-row';

/** A Step of the Replay after one points-paying Session, as the Season page shows it. */
export interface SessionStep extends ReplayStep {
  kind: 'session';
  /** The Round the Step's Session belongs to. */
  round: CalendarEntry;
  standings: StandingsViewRow[];
  /** The World Champion is crowned at this very Step. */
  crowning: boolean;
  /** The Defending Champion, labelled on this Step: null once a World Champion is crowned, or when there is none taking part. */
  defendingChampion: string | null;
  /** The Session's Podium: always three places, in display order 2nd, 1st, 3rd. */
  podium: PodiumPlace[];
  /** The rest of the Session's Classification: 4th place on, then the Riders not Classified. */
  belowPodium: ClassificationRow[];
}
