import { getDatabase } from '@/shared/queries/get-database';
import type { Season } from '../types/season';
import { getSeason } from './get-season';

/**
 * The previous year's Season in the same Category, whatever its Class (500cc 2001 before MotoGP 2002).
 * Null when that Season is not loaded.
 */
export function getPreviousSeason(classCode: string, year: number): Season | null {
  const previous = getDatabase()
    .prepare(
      `SELECT pc.code AS classCode
         FROM classes c
         JOIN classes pc ON pc.category_id = c.category_id
         JOIN seasons s  ON s.class_id = pc.id
        WHERE c.code = ? AND s.year = ?`,
    )
    .get(classCode, year - 1) as { classCode: string } | undefined;
  return previous ? getSeason(previous.classCode, year - 1) : null;
}
