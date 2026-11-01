// Pure standings logic: no DB access, no I/O. Easy to unit test.
// Load rows from SQLite at build time, map them to these types, call computeSeason().

export type Session = 'race' | 'sprint';
export type Status = 'FIN' | 'DNF' | 'DNS' | 'DSQ' | 'NC';

export interface ScoringRule {
  /** points[session][position - 1] */
  points: Record<Session, number[]>;
  /** null = every round counts; otherwise only the best N round scores count */
  bestN: number | null;
  fastestLapPoints: number;
  fastestLapRequiresFinish: boolean;
}

export interface Result {
  round: number;
  session: Session;
  riderId: number;
  position: number | null;
  status: Status;
  fastestLap?: boolean;
  /** Only for anomalies (half points, penalties). Replaces computed points, bonus included. */
  pointsOverride?: number | null;
}

export interface StandingRow {
  rank: number;
  riderId: number;
  /** Championship points (after dropped scores) */
  points: number;
  /** All points scored, before drops */
  grossPoints: number;
  /** Points from each round so far, index 0 = round 1 */
  roundScores: number[];
  /** Rounds whose score was dropped (1-based round numbers) */
  droppedRounds: number[];
  wins: number;
  podiums: number;
}

/** Points a single result is worth under the rule. */
export function pointsFor(r: Result, rule: ScoringRule): number {
  if (r.pointsOverride != null) return r.pointsOverride;

  const classified = r.status === 'FIN' && r.position != null;
  let pts = 0;
  if (classified) pts = rule.points[r.session][r.position! - 1] ?? 0;

  if (r.fastestLap && rule.fastestLapPoints > 0 && (classified || !rule.fastestLapRequiresFinish)) {
    pts += rule.fastestLapPoints;
  }
  return pts;
}

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

/** Standings after every round: index 0 = after round 1. Ideal for the slider JSON. */
export function computeSeason(results: Result[], rule: ScoringRule): StandingRow[][] {
  const lastRound = results.reduce((m, r) => Math.max(m, r.round), 0);
  return Array.from({ length: lastRound }, (_, i) => computeStandings(results, rule, i + 1));
}

// --- helpers ---------------------------------------------------------------

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function applyBestN(roundScores: number[], bestN: number | null) {
  if (bestN == null || roundScores.length <= bestN) {
    return { kept: sum(roundScores), droppedRounds: [] as number[] };
  }
  // Sort round indices by score desc; on equal scores drop the earlier round (stable, arbitrary but deterministic).
  const order = roundScores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score || b.idx - a.idx);
  const kept = sum(order.slice(0, bestN).map((o) => o.score));
  const droppedRounds = order
    .slice(bestN)
    .filter((o) => o.score > 0)
    .map((o) => o.idx + 1)
    .sort((a, b) => a - b);
  return { kept, droppedRounds };
}

/** Negative if `a` ranks higher. Compares wins, then 2nds, 3rds, ... */
function countback(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
