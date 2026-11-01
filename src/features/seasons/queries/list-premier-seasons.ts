import { getDatabase } from '@/shared/queries/get-database';
import type { SeasonSummary } from '../types/season-summary';

/** Premier-class seasons (500cc + MotoGP), oldest first. */
export function listPremierSeasons(): SeasonSummary[] {
  return getDatabase()
    .prepare(
      `SELECT s.year, c.name AS className
         FROM seasons s
         JOIN classes c              ON c.id = s.class_id
         JOIN class_group_members gm ON gm.class_id = c.id
         JOIN class_groups g         ON g.id = gm.group_id
        WHERE g.code = 'premier'
        ORDER BY s.year`,
    )
    .all() as SeasonSummary[];
}
