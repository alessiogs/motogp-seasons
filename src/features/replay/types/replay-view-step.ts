import type { ReplayStep } from '@/features/scoring/types/replay-step';
import type { CalendarEntry } from './calendar-entry';
import type { ClassificationRow } from './classification-row';
import type { PodiumStep } from './podium-step';
import type { StandingsViewRow } from './standings-view-row';

/**
 * One Step of the Replay as the Season page shows it: the Participants step, then one per points-paying
 * Session. The Participants step has no Session: roundNumber 0, empty sessionType, sessionsInRound 0.
 */
export interface ReplayViewStep extends ReplayStep {
  kind: 'participants' | 'session';
  /** The Round the Step's Session belongs to; null on the Participants step. */
  round: CalendarEntry | null;
  standings: StandingsViewRow[];
  /** The World Champion is crowned at this very Step. */
  crowning: boolean;
  /** The Defending Champion, labelled on this Step: null once a World Champion is crowned, or when there is none taking part. */
  defendingChampion: string | null;
  /** The full Classification of the Step's Session. */
  classification: ClassificationRow[];
  /** The Session's Podium: always three steps, in display order 2nd, 1st, 3rd. */
  podium: PodiumStep[];
  /** The rest of the Classification: 4th place on, then the Riders not Classified. */
  belowPodium: ClassificationRow[];
}
