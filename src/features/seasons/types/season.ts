import type { ScoringRule } from '@/features/scoring/types/scoring-rule';
import type { Round } from './round';

export interface Season {
  classCode: string;
  className: string;
  year: number;
  rule: ScoringRule;
  rounds: Round[];
  riders: Record<string, { name: string }>;
  notes?: string | null;
}
