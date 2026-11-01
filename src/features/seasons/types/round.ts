import type { Session } from './session';

export interface Round {
  number: number;
  name: string;
  circuit: string | null;
  /** Country at the time. */
  country: string | null;
  date: string | null;
  nonChampionship: boolean;
  notes?: string | null;
  sessions: Session[];
}
