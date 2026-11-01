import type { Result } from './result';

export interface Session {
  /** Open set: any type with a points table in the Scoring rule pays points ('sprint', 'grand-prix-race', ...). */
  type: string;
  order: number;
  date: string | null;
  /** 1 normally, 0.5 for Half points. */
  pointsMultiplier: number;
  notes?: string | null;
  results: Result[];
}
