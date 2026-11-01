import type { Season } from '@/features/seasons/types/season';
import type { ReplayStep } from '../types/replay-step';
import type { PlayedSession } from '../types/played-session';
import type { TitleRace } from '../types/title-race';
import { computeStandings } from './compute-standings';
import { computeTitleRace } from './compute-title-race';

/** Season in, ordered Replay Steps out: one per points-paying Session, Non-championship rounds skipped. */
export function computeReplay(season: Season): ReplayStep[] {
  const sessionsByRound = [...season.rounds]
    .sort((a, b) => a.number - b.number)
    .filter((round) => !round.nonChampionship)
    .map((round) =>
      [...round.sessions]
        .sort((a, b) => a.order - b.order)
        .filter((session) => season.rule.points[session.type] != null)
        .map((session): PlayedSession => ({ round, session })),
    );

  const played: PlayedSession[] = [];
  const steps: Omit<ReplayStep, keyof TitleRace>[] = [];
  for (const sessions of sessionsByRound) {
    for (const p of sessions) {
      played.push(p);
      steps.push({
        roundNumber: p.round.number,
        sessionType: p.session.type,
        sessionsInRound: sessions.length,
        standings: computeStandings(played, season.rule),
      });
    }
  }
  const titleRace = computeTitleRace(sessionsByRound, steps.map((s) => s.standings), season.rule);
  return steps.map((step, i) => ({ ...step, ...titleRace[i] }));
}
