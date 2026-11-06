import type { ScoringRule } from '@/features/scoring/types/scoring-rule';
import type { Round } from './round';

export interface Season {
  classCode: string;
  className: string;
  year: number;
  rule: ScoringRule;
  rounds: Round[];
  /** `abbreviation` overrides the short name's surname letters (see the Rider data). */
  riders: Record<string, { name: string; abbreviation?: string }>;
  notes?: string | null;
}
