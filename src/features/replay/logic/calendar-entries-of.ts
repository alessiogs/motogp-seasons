import type { ReplayStep } from '@/features/scoring/types/replay-step';
import type { Round } from '@/features/seasons/types/round';
import type { CalendarEntry } from '../types/calendar-entry';

/** The Season's calendar: every Round, Non-championship rounds included, with its note and its Step count. */
export function calendarEntriesOf(rounds: Round[], steps: ReplayStep[]): CalendarEntry[] {
  return rounds.map((round) => ({
    roundNumber: round.number,
    name: round.name,
    date: round.date,
    notes: round.notes?.trim() || null,
    nonChampionship: round.nonChampionship,
    steps: steps.filter((s) => s.roundNumber === round.number).length,
  }));
}
