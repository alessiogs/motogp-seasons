import type { KnownMismatch } from '../types/official-table';

/**
 * The table the replay is expected to equal: the printed rows, except that the Rider of a declared known
 * mismatch is expected at his declared replayed points. Everything else stays as printed, so any other
 * difference (or a replay that matches neither value for that Rider) still fails the comparison.
 */
export function applyKnownMismatch(
  standings: { rider: string; points: number }[],
  knownMismatch: KnownMismatch | undefined,
): { rider: string; points: number }[] {
  if (!knownMismatch) return standings;
  const row = standings.find((r) => r.rider === knownMismatch.rider);
  if (!row) throw new Error(`Known mismatch names ${knownMismatch.rider}, who is not in the official table`);
  if (row.points !== knownMismatch.printedPoints) {
    throw new Error(
      `Known mismatch for ${knownMismatch.rider} declares ${knownMismatch.printedPoints} printed points, the table prints ${row.points}`,
    );
  }
  return standings.map((r) => (r === row ? { ...r, points: knownMismatch.replayedPoints } : r));
}
