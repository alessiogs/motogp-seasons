import type { Season } from '@/features/seasons/types/season';
import { computeReplay } from './compute-replay';

/** The World Champion of a Season: the Rider crowned by its last Step, or null when it crowned nobody. */
export function worldChampionOf(season: Season): string | null {
  return computeReplay(season).at(-1)?.worldChampion ?? null;
}
