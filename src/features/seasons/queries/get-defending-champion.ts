import { getDatabase } from '@/shared/queries/get-database';
import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { DefendingChampion } from '../types/defending-champion';
import { getSeason } from './get-season';

/**
 * The World Champion of the previous year's Season in the same Category, whatever its Class
 * (500cc 2001 -> MotoGP 2002). Null when that Season is not loaded or crowned nobody.
 */
export function getDefendingChampion(classCode: string, year: number): DefendingChampion | null {
  const previous = getDatabase()
    .prepare(
      `SELECT pc.code AS classCode
         FROM classes c
         JOIN classes pc ON pc.category_id = c.category_id
         JOIN seasons s  ON s.class_id = pc.id
        WHERE c.code = ? AND s.year = ?`,
    )
    .get(classCode, year - 1) as { classCode: string } | undefined;
  if (!previous) return null;

  const season = getSeason(previous.classCode, year - 1);
  if (!season) return null;
  const riderId = computeReplay(season).at(-1)?.worldChampion ?? null;
  if (riderId == null) return null;
  return { riderId, name: season.riders[riderId]?.name ?? riderId };
}
