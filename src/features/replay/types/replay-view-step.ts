import type { ParticipantsStep } from './participants-step';
import type { SessionStep } from './session-step';

/** One Step of the Replay as the Season page shows it: the Participants step, then one per points-paying Session. */
export type ReplayViewStep = ParticipantsStep | SessionStep;
