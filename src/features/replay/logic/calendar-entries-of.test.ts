import { describe, expect, it } from 'vitest';
import type { Round } from '@/features/seasons/types/round';
import type { ReplayStep } from '@/features/scoring/types/replay-step';
import { calendarEntriesOf } from './calendar-entries-of';

function round(number: number, extra: Partial<Round> = {}): Round {
  return { number, name: `Round ${number}`, circuit: null, country: null, date: null, nonChampionship: false, sessions: [], ...extra };
}

function step(roundNumber: number): ReplayStep {
  return { roundNumber, sessionType: 'grand-prix-race', sessionsInRound: 1, standings: [], worldChampion: null, titleChances: [], titleConditions: [] };
}

describe('calendarEntriesOf', () => {
  it('lists every Round in order, with the Steps each adds to the Replay', () => {
    const entries = calendarEntriesOf([round(1), round(2)], [step(1), step(2), step(2)]);
    expect(entries.map((e) => [e.roundNumber, e.steps])).toEqual([[1, 1], [2, 2]]);
  });

  it('keeps a Non-championship round in the calendar with no Step', () => {
    const entries = calendarEntriesOf([round(1), round(2, { nonChampionship: true }), round(3)], [step(1), step(3)]);
    expect(entries.map((e) => [e.roundNumber, e.nonChampionship, e.steps])).toEqual([
      [1, false, 1],
      [2, true, 0],
      [3, false, 1],
    ]);
  });

  it('carries the Round note, or null', () => {
    const entries = calendarEntriesOf([round(1, { notes: 'Half points' }), round(2)], []);
    expect(entries.map((e) => e.notes)).toEqual(['Half points', null]);
  });
});
