import type { Result } from '../types/result';
import type { ScoringRule } from '../types/scoring-rule';
import type { StandingRow } from '../types/standing-row';
import { applyBestN } from './apply-best-n';
import { countback } from './countback';
import { pointsFor } from './points-for';

/**
 * Standings after `uptoRound` (inclusive).
 * Dropped scores are applied per round total, using only rounds run so far,
 * which matches how standings looked at the time.
 * Ties are broken by countback on main-race finishes (wins, then 2nds, ...).
 */
export function computeStandings(
  results: Result[],
  rule: ScoringRule,
  uptoRound: number,
): StandingRow[] {
  type Acc = { roundScores: number[]; finishes: number[] };
  const byRider = new Map<number, Acc>();

  for (const r of results) {
    if (r.round > uptoRound) continue;
    let acc = byRider.get(r.riderId);
    if (!acc) {
      acc = { roundScores: new Array(uptoRound).fill(0), finishes: [] };
      byRider.set(r.riderId, acc);
    }
    acc.roundScores[r.round - 1] += pointsFor(r, rule);
    if (r.session === 'race' && r.status === 'FIN' && r.position != null) {
      acc.finishes[r.position - 1] = (acc.finishes[r.position - 1] ?? 0) + 1;
    }
  }

  const rows = [...byRider.entries()].map(([riderId, acc]) => {
    const grossPoints = sum(acc.roundScores);
    const { kept, droppedRounds } = applyBestN(acc.roundScores, rule.bestN);
    return {
      riderId,
      points: kept,
      grossPoints,
      roundScores: acc.roundScores,
      droppedRounds,
      wins: acc.finishes[0] ?? 0,
      podiums: (acc.finishes[0] ?? 0) + (acc.finishes[1] ?? 0) + (acc.finishes[2] ?? 0),
      finishes: acc.finishes,
    };
  });

  rows.sort((a, b) => b.points - a.points || countback(a.finishes, b.finishes) || a.riderId - b.riderId);

  // Equal rank only if points AND countback are identical.
  return rows.map((row, i) => {
    let rank = i + 1;
    for (let j = i - 1; j >= 0; j--) {
      const prev = rows[j];
      if (prev.points === row.points && countback(prev.finishes, row.finishes) === 0) rank = j + 1;
      else break;
    }
    const { finishes, ...rest } = row;
    return { rank, ...rest };
  });
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
