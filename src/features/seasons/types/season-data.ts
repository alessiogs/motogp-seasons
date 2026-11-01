import type { Result } from '@/features/scoring/types/result';
import type { ScoringRule } from '@/features/scoring/types/scoring-rule';

export interface SeasonData {
  year: number;
  className: string;
  rule: ScoringRule;
  rounds: { number: number; name: string; date: string | null; country: string | null }[];
  riders: Record<number, { name: string; nationality: string | null }>;
  results: Result[];
}
