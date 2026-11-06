import type { ClassificationRow } from '../types/classification-row';

/** The rows of a Classification that stand on its Podium: its first three Classified Riders, in order. */
export function podiumRowsOf(rows: ClassificationRow[]): ClassificationRow[] {
  return rows.filter((r) => r.outcomeLabel === null).slice(0, 3);
}
