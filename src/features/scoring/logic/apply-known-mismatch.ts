import type { KnownMismatch } from '../types/official-table';

/**
 * The table the replay is expected to equal: the printed rows, except that the Rider of each declared known
 * mismatch is expected at his declared replayed points. Everything else stays as printed, so any other
 * difference (or a replay that matches neither value for such a Rider) still fails the comparison.
 */
export function applyKnownMismatch(
  standings: { rider: string; points: number }[],
  knownMismatch: KnownMismatch | KnownMismatch[] | undefined,
): { rider: string; points: number }[] {
  const declared = knownMismatch === undefined ? [] : Array.isArray(knownMismatch) ? knownMismatch : [knownMismatch];
  let expected = standings;
  for (const mismatch of declared) {
    const row = expected.find((r) => r.rider === mismatch.rider);
    if (!row) throw new Error(`Known mismatch names ${mismatch.rider}, who is not in the official table`);
    if (row.points !== mismatch.printedPoints) {
      throw new Error(
        `Known mismatch for ${mismatch.rider} declares ${mismatch.printedPoints} printed points, the table prints ${row.points}`,
      );
    }
    expected = expected.map((r) => (r === row ? { ...r, points: mismatch.replayedPoints } : r));
  }
  return expected;
}
