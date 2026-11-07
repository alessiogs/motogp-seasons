import type { ReplayViewStep } from '../types/replay-view-step';
import { sessionLabel } from './session-label';

/**
 * A Step in words: "Participants", or its Round out of the Season's Rounds ("Round 3 of 20 · Qatar"), with the
 * Session when the Round has several. `rounds` counts every Round of the calendar, Non-championship rounds
 * included, since they keep their number.
 */
export function stepLabel(step: ReplayViewStep, rounds: number): string {
  if (step.kind === 'participants') return 'Participants';
  const round = `Round ${step.roundNumber} of ${rounds} · ${step.round.name}`;
  return step.sessionsInRound > 1 ? `${round} · ${sessionLabel(step.sessionType)}` : round;
}
