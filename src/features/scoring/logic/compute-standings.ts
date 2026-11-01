import type { Round } from '@/features/seasons/types/round';
import type { Session } from '@/features/seasons/types/session';
import type { ScoringRule } from '../types/scoring-rule';
import type { StandingRow } from '../types/standing-row';
import { GRAND_PRIX_RACE } from '../types/session-type';
import { applyCountingWindows } from './apply-counting-windows';
import { countback } from './countback';
import { pointsFor } from './points-for';

export interface PlayedSession {
  round: Round;
  session: Session;
}

/**
 * Standings after the given Sessions (in the order they were run), built from final official Results.
 * Ties: Championship points, then Countback on Grand Prix race finishes (Sprints ignored),
 * then the Latest-best tie-break (ADR-0005). Ranks are never shared.
 */
export function computeStandings(played: PlayedSession[], rule: ScoringRule): StandingRow[] {
  type Acc = { roundScores: number[]; finishes: number[]; lastFinishAt: number[] };
  const roundsRun = played.reduce((m, p) => Math.max(m, p.round.number), 0);
  const byRider = new Map<string, Acc>();

  played.forEach(({ round, session }, stepIndex) => {
    for (const result of session.results) {
      let acc = byRider.get(result.riderId);
      if (!acc) {
        acc = { roundScores: new Array(roundsRun).fill(0), finishes: [], lastFinishAt: [] };
        byRider.set(result.riderId, acc);
      }
      acc.roundScores[round.number - 1] += pointsFor(result, session, rule);
      if (session.type === GRAND_PRIX_RACE && result.outcome === 'FIN' && result.position != null) {
        acc.finishes[result.position - 1] = (acc.finishes[result.position - 1] ?? 0) + 1;
        acc.lastFinishAt[result.position - 1] = stepIndex;
      }
    }
  });

  const rows = [...byRider.entries()].map(([riderId, acc]) => {
    const grossPoints = acc.roundScores.reduce((a, b) => a + b, 0);
    const { kept, droppedRounds } = applyCountingWindows(acc.roundScores, rule.countingWindows);
    return { riderId, acc, points: kept, grossPoints, droppedRounds };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      countback(a.acc.finishes, b.acc.finishes) ||
      latestBest(a.acc, b.acc) ||
      a.riderId.localeCompare(b.riderId),
  );

  return rows.map(({ riderId, acc, points, grossPoints, droppedRounds }, i) => ({
    rank: i + 1,
    riderId,
    points,
    grossPoints,
    roundScores: acc.roundScores,
    droppedRounds,
    wins: acc.finishes[0] ?? 0,
    podiums: (acc.finishes[0] ?? 0) + (acc.finishes[1] ?? 0) + (acc.finishes[2] ?? 0),
  }));
}

/** Only reached when Countback is level: the Rider whose best place came later ranks ahead (negative if `a` does). */
function latestBest(a: { finishes: number[]; lastFinishAt: number[] }, b: typeof a): number {
  const best = a.finishes.findIndex((n) => n > 0);
  if (best === -1) return 0;
  return (b.lastFinishAt[best] ?? -1) - (a.lastFinishAt[best] ?? -1);
}
