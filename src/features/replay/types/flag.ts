export interface Flag {
  /** The code as stored on the Result. */
  code: string;
  name: string;
  /** Null for a country with no emoji flag (most that no longer exist): show the code as a badge. */
  emoji: string | null;
}
