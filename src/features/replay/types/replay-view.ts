import type { CalendarEntry } from './calendar-entry';
import type { ReplayViewStep } from './replay-view-step';
import type { RiderInfo } from './rider-info';

/** Everything the Season page renders, derived from one Season. */
export interface ReplayView {
  year: number;
  className: string;
  /** The Season's Scoring rule has Counting windows: show Gross points and Dropped scores. */
  hasCountingWindows: boolean;
  /** The Season's Scoring rule pays a Fastest-lap bonus: Title conditions mention the fastest lap. */
  fastestLapBonus: boolean;
  /** Every Rider with a Result in the Season, by Rider id. */
  riders: Record<string, RiderInfo>;
  /** One per points-paying Session, in order. */
  steps: ReplayViewStep[];
  /** Every Round of the Season, Non-championship rounds included. */
  calendar: CalendarEntry[];
}
