import type { ReplayViewStep } from '../types/replay-view-step';
import { sessionLabel } from './session-label';

/** A Step in words: "Participants", or its Round ("Round 3 · Qatar"), with the Session when the Round has several. */
export function stepLabel(step: ReplayViewStep): string {
  if (step.kind === 'participants') return 'Participants';
  const round = `Round ${step.roundNumber} · ${step.round.name}`;
  return step.sessionsInRound > 1 ? `${round} · ${sessionLabel(step.sessionType)}` : round;
}
