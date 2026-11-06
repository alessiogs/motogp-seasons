import { getDatabase } from '@/shared/queries/get-database';
import type { SeasonSummary } from '../types/season-summary';

/** Every Season, Classes ordered by Category (then within it), oldest Season first. */
export function listSeasons(): SeasonSummary[] {
  return getDatabase()
    .prepare(
      `SELECT c.code AS classCode, c.name AS className, s.year
         FROM seasons s
         JOIN classes c    ON c.id = s.class_id
         JOIN categories g ON g.id = c.category_id
        ORDER BY g.sort_order, c.sort_order, s.year`,
    )
    .all() as SeasonSummary[];
}
