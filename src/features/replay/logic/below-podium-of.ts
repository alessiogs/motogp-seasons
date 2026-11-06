import type { ClassificationRow } from '../types/classification-row';
import { podiumRowsOf } from './podium-rows-of';

/** The rest of a Classification below its Podium: everything after its first three Classified Riders. */
export function belowPodiumOf(rows: ClassificationRow[]): ClassificationRow[] {
  const onPodium = new Set(podiumRowsOf(rows).map((r) => r.riderId));
  return rows.filter((r) => !onPodium.has(r.riderId));
}
