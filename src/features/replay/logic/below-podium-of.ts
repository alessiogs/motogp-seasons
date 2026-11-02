import type { ClassificationRow } from '../types/classification-row';

/** The rest of a Classification below its Podium: everything after its first three Classified Riders. */
export function belowPodiumOf(rows: ClassificationRow[]): ClassificationRow[] {
  const onPodium = new Set(rows.filter((r) => r.outcomeLabel === null).slice(0, 3).map((r) => r.riderId));
  return rows.filter((r) => !onPodium.has(r.riderId));
}
