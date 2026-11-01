/** One Round of the Season's calendar, championship or not. */
export interface CalendarEntry {
  roundNumber: number;
  name: string;
  date: string | null;
  notes: string | null;
  /** Held but scoring nothing: it has no Step. */
  nonChampionship: boolean;
  /** How many Steps the Round adds to the Replay. */
  steps: number;
}
