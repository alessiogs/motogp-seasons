import { describe, expect, it } from 'vitest';
import type { SessionStep } from '../types/session-step';
import { stepLabel } from './step-label';

function sessionStep(sessionType: string, sessionsInRound: number): SessionStep {
  return {
    kind: 'session',
    roundNumber: 3,
    sessionType,
    sessionsInRound,
    round: { roundNumber: 3, name: 'Qatar', date: null, notes: null, nonChampionship: false, steps: sessionsInRound },
    standings: [],
    worldChampion: null,
    titleChances: [],
    titleConditions: [],
    crowning: false,
    defendingChampion: null,
    podium: [],
    belowPodium: [],
  };
}

describe('stepLabel', () => {
  it('names the Participants step', () => {
    expect(stepLabel({ kind: 'participants', standings: [], defendingChampion: null })).toEqual('Participants');
  });

  it('names a Session step by its Round, and by its Session when the Round has more than one', () => {
    expect(stepLabel(sessionStep('grand-prix-race', 1))).toEqual('Round 3 · Qatar');
    expect(stepLabel(sessionStep('sprint', 2))).toEqual('Round 3 · Qatar · Sprint');
  });
});
