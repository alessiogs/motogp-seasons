import type { ReplayStep } from '@/features/scoring/types/replay-step';
import type { CalendarEntry } from './calendar-entry';
import type { ClassificationRow } from './classification-row';
import type { PodiumStep } from './podium-step';
import type { StandingsViewRow } from './standings-view-row';

/** One Step of the Replay as the Season page shows it. */
export interface ReplayViewStep extends ReplayStep {
  /** The Round the Step's Session belongs to. */
  round: CalendarEntry;
  standings: StandingsViewRow[];
  /** The World Champion is crowned at this very Step. */
  crowning: boolean;
  /** The full Classification of the Step's Session. */
  classification: ClassificationRow[];
  /** The Session's Podium: always three steps, in display order 2nd, 1st, 3rd. */
  podium: PodiumStep[];
  /** The rest of the Classification: 4th place on, then the Riders not Classified. */
  belowPodium: ClassificationRow[];
}
