import type { Result } from '@/features/seasons/types/result';
import type { ScoringRule } from '../types/scoring-rule';
import type { StandingRow } from '../types/standing-row';
import type { OutcomeClause, RivalMargin, SessionResult, TitleCondition } from '../types/title-condition';
import type { PlayedSession } from '../types/played-session';
import type { TitleRace } from '../types/title-race';
import { computeStandings } from './compute-standings';
import { pointsFor } from './points-for';

/**
 * The title fight at each Step, given every Session of the Season (grouped by Round, in order)
 * and the Standings after each of them.
 *
 * Every question is answered pairwise by replaying a hypothetical future through computeStandings,
 * so Counting windows, the Fastest-lap bonus, Countback and the Latest-best tie-break apply exactly
 * as they do to real Results. Hypothetical Sessions pay full points: Half points are only decided
 * when a Session is stopped, so they cannot be counted on beforehand.
 */
export function computeTitleRace(
  sessionsByRound: PlayedSession[][],
  standings: StandingRow[][],
  rule: ScoringRule,
): TitleRace[] {
  const all = sessionsByRound.flat();
  // Every Rider entered in the Season is a rival, including those who have not raced yet.
  const riders = [...new Set(all.flatMap((p) => p.session.results.map((r) => r.riderId)))];
  const race: TitleRace[] = [];
  let worldChampion: string | null = null;

  all.forEach((current, i) => {
    const played = all.slice(0, i + 1);
    const future = all.slice(i + 1);
    const leader = standings[i][0]?.riderId;
    if (worldChampion == null && leader != null && isUncatchable(leader, played, future, riders, rule)) {
      worldChampion = leader;
    }
    if (worldChampion != null || future.length === 0) {
      race.push({ worldChampion, titleChances: [], titleConditions: [] });
      return;
    }
    // Riders in Standings order, then any who have not raced yet.
    const contenders = [...new Set([...standings[i].map((row) => row.riderId), ...riders])];

    let titleChances: string[] = [];
    const nextRound = future[0].round;
    if (nextRound !== current.round) {
      const roundSessions = future.filter((p) => p.round === nextRound);
      const afterRound = future.slice(roundSessions.length);
      // A Rider's best case in the Round, against every rival at once: he wins every Session and nobody
      // else scores. If that does not crown him, nothing does.
      titleChances = contenders.filter((x) =>
        isUncatchable(x, [...played, ...roundSessions.map((p) => withResults(p, [hypothetical(x, WIN)]))], afterRound, riders, rule),
      );
    }

    const [next, ...afterNext] = future;
    const titleConditions = contenders
      .filter((x) => isUncatchable(x, [...played, withResults(next, [hypothetical(x, WIN)])], afterNext, riders, rule))
      .map((x) => titleCondition(x, played, next, afterNext, contenders, rule));

    race.push({ worldChampion, titleChances, titleConditions });
  });
  return race;
}

const WIN: SessionResult = { position: 1, fastestLap: true };

/**
 * What `x` needs from `next` to be crowned there. Every pair of results for `x` and each rival is
 * checked; the condition is stated as margins when margins describe the outcome exactly, otherwise
 * as outcomes.
 */
function titleCondition(
  x: string,
  played: PlayedSession[],
  next: PlayedSession,
  afterNext: PlayedSession[],
  riders: string[],
  rule: ScoringRule,
): TitleCondition {
  const options = resultOptions(next, rule);
  const pointsOf = (o: SessionResult) => pointsFor(hypothetical('', o), withResults(next, []).session, rule);

  // safe[r][i][j]: x has result options[i], rival r options[j]; null when the pair cannot happen.
  const grids = riders
    .filter((r) => r !== x)
    .map((r) => {
      const history = pairOnly(played, x, r);
      const safe = options.map((ox) =>
        options.map((or) =>
          compatible(ox, or)
            ? !catches(r, [...history, withResults(next, [hypothetical(x, ox), hypothetical(r, or)])], afterNext, rule)
            : null,
        ),
      );
      return { rivalId: r, safe };
    })
    .filter(({ safe }) => safe.some((row) => row.some((cell) => cell === false)));

  const margins = grids.map(({ rivalId, safe }) => marginFor(rivalId, safe, options, pointsOf));
  if (margins.every((m): m is RivalMargin => m != null)) return { riderId: x, kind: 'margin', rivals: margins };
  return { riderId: x, kind: 'outcome', clauses: outcomeClauses(grids, options) };
}

/** The single margin (and a smaller one if he wins) that describes `safe` exactly, or null if none does. */
function marginFor(
  rivalId: string,
  safe: (boolean | null)[][],
  options: SessionResult[],
  pointsOf: (o: SessionResult) => number,
): RivalMargin | null {
  const pairs = safe.flatMap((row, i) =>
    row.flatMap((cell, j) =>
      cell == null ? [] : [{ d: pointsOf(options[i]) - pointsOf(options[j]), wins: options[i].position === 1, safe: cell }],
    ),
  );
  const smallestAbove = (ps: typeof pairs) => {
    const worstUnsafe = Math.max(...ps.filter((p) => !p.safe).map((p) => p.d));
    const above = ps.filter((p) => p.d > worstUnsafe).map((p) => p.d);
    return above.length ? Math.min(...above) : null;
  };
  const margin = smallestAbove(pairs);
  if (margin == null) return null;
  const ifWins = smallestAbove(pairs.filter((p) => p.wins));
  const marginIfWins = ifWins != null && ifWins < margin ? ifWins : undefined;
  const exact = pairs.every(
    (p) => p.safe === (p.d >= margin || (p.wins && marginIfWins != null && p.d >= marginIfWins)),
  );
  // "By N, or by N-1 if he wins" where no result short of a win is enough would make N meaningless.
  if (!exact || (marginIfWins != null && !pairs.some((p) => p.safe && !p.wins))) return null;
  return marginIfWins == null ? { rivalId, margin } : { rivalId, margin, marginIfWins };
}

/**
 * Outcome terms: for each result of his (best first), the best result each rival may have. A rival's
 * requirement never relaxes as his result gets worse, so "finishes `worst` or better" is exact.
 */
function outcomeClauses(grids: { rivalId: string; safe: (boolean | null)[][] }[], options: SessionResult[]): OutcomeClause[] {
  const required = grids.map(() => 0);
  const clauses: OutcomeClause[] = [];
  let previous = '';
  for (let i = 0; i < options.length; i++) {
    grids.forEach(({ safe }, g) => {
      const worstUnsafe = safe[i].reduce((m, cell, j) => (cell === false ? j : m), -1);
      required[g] = Math.max(required[g], worstUnsafe + 1);
    });
    if (required.some((j) => j >= options.length)) break;
    const rivals = grids
      .map(({ rivalId }, g) => ({ rivalId, atBest: options[required[g]], j: required[g] }))
      .filter(({ j }) => j > 0)
      .map(({ rivalId, atBest }) => ({ rivalId, atBest }));
    const key = JSON.stringify(rivals);
    if (key === previous) clauses[clauses.length - 1].worst = options[i];
    else clauses.push({ worst: options[i], rivals });
    previous = key;
  }
  return clauses;
}

/**
 * Every result a Rider can have in the Session, best first: each points-paying position, then no
 * points; each with and without the fastest lap where the Rule pays a bonus for it.
 * A finish outside the points is treated as no finish: it could only matter on a Countback that goes
 * below the last points-paying place.
 */
function resultOptions(next: PlayedSession, rule: ScoringRule): SessionResult[] {
  const table = rule.points[next.session.type] ?? [];
  const positions: (number | null)[] = [...table.map((_, i) => i + 1), null];
  const bonus = rule.fastestLapPoints > 0;
  return positions.flatMap((position) => {
    const withLap = bonus && (position != null || !rule.fastestLapRequiresFinish);
    return withLap ? [{ position, fastestLap: true }, { position, fastestLap: false }] : [{ position, fastestLap: false }];
  });
}

function compatible(a: SessionResult, b: SessionResult) {
  return (a.position == null || a.position !== b.position) && !(a.fastestLap && b.fastestLap);
}

/** No rival can finish ahead of `x`, whatever happens in `future`. */
function isUncatchable(x: string, played: PlayedSession[], future: PlayedSession[], riders: string[], rule: ScoringRule) {
  return riders.every((r) => r === x || !catches(r, pairOnly(played, x, r), future, rule));
}

/**
 * Can `r` still finish ahead of the other Rider in `history` (Sessions holding only their two Results)?
 * Tested on `r`'s best case, which dominates every other: `r` wins every remaining Session with the
 * fastest lap (most points, most wins, latest best place) and the other scores nothing more (fewest
 * points, no Countback gain). Their order does not depend on anyone else's Results.
 */
function catches(r: string, history: PlayedSession[], future: PlayedSession[], rule: ScoringRule) {
  const best = future.map((p) => withResults(p, [hypothetical(r, WIN)]));
  return computeStandings([...history, ...best], rule)[0]?.riderId === r;
}

function pairOnly(played: PlayedSession[], x: string, r: string): PlayedSession[] {
  return played.map((p) =>
    withResults(p, p.session.results.filter((res) => res.riderId === x || res.riderId === r), p.session.pointsMultiplier),
  );
}

/** A copy of the Session with other Results; hypothetical Sessions pay full points. */
function withResults(p: PlayedSession, results: Result[], pointsMultiplier = 1): PlayedSession {
  return { round: p.round, session: { ...p.session, pointsMultiplier, results } };
}

function hypothetical(riderId: string, { position, fastestLap }: SessionResult): Result {
  return {
    riderId,
    position,
    outcome: position == null ? 'DNF' : 'FIN',
    fastestLap,
    team: null,
    manufacturer: null,
    bikeNumber: null,
    nationality: null,
    source: 'hypothetical',
  };
}
