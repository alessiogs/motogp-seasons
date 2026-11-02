/** How a Rider is shown in this Season: their name, the Nationality they raced under and their Season number. */
export interface RiderInfo {
  name: string;
  /** TV-style short name for narrow screens, "F BAG". */
  shortName: string;
  nationality: string | null;
  /** Null when the Season has no Season numbers (ADR-0008). */
  seasonNumber: number | null;
}
