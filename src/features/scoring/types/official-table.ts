/**
 * A data/official-tables/<class>-<year>.json file: the official final table of a Season, as printed,
 * which the final-Standings test compares the last Replay Step against.
 */
export interface OfficialTable {
  /** Where the table was read. */
  source: string;
  standings: { rider: string; points: number }[];
  /**
   * Optional. Declares that the Season's Results provably don't add up to the printed total of a Rider
   * (e.g. 500cc 1988 Valesi, 26 against 19). One entry per Rider, normally one in a table. The final-Standings
   * test then expects the replayed points here instead of the printed ones; any other difference still fails.
   */
  knownMismatch?: KnownMismatch | KnownMismatch[];
}

export interface KnownMismatch {
  rider: string;
  /** The points the Replay gives him, from the recorded Results. */
  replayedPoints: number;
  /** The points the official table prints for him; must equal his row in `standings`. */
  printedPoints: number;
  /** Why the two differ, with the evidence. */
  reason: string;
}
