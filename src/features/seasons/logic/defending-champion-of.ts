import { worldChampionOf } from '@/features/scoring/logic/world-champion-of';
import type { DefendingChampion } from '../types/defending-champion';
import type { Season } from '../types/season';

/**
 * The Defending Champion of a Season: the World Champion of its previous Season (getPreviousSeason).
 * Null when there is no previous Season or it crowned nobody.
 */
export function defendingChampionOf(previousSeason: Season | null): DefendingChampion | null {
  if (!previousSeason) return null;
  const riderId = worldChampionOf(previousSeason);
  if (riderId == null) return null;
  return { riderId, name: previousSeason.riders[riderId]?.name ?? riderId };
}
