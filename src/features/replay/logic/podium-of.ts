import type { ClassificationRow } from '../types/classification-row';

/** The top three finishers of a Classification. */
export function podiumOf(rows: ClassificationRow[]): ClassificationRow[] {
  return rows.filter((r) => r.outcomeLabel === null).slice(0, 3);
}
