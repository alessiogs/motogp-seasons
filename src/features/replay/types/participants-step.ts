import type { StandingsViewRow } from './standings-view-row';

/** The first Step of the Replay, before any Session: every Participant on 0 points. */
export interface ParticipantsStep {
  kind: 'participants';
  /** Every Participant on 0 points: the Defending Champion first, then by Season number, then by name. */
  standings: StandingsViewRow[];
  /** The Defending Champion, labelled on this Step; null when there is none taking part. */
  defendingChampion: string | null;
}
