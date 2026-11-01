import { getDatabase } from '@/shared/queries/get-database';
import type { ScoringRule } from '@/features/scoring/types/scoring-rule';
import type { Result } from '../types/result';
import type { Round } from '../types/round';
import type { Season } from '../types/season';
import type { Session } from '../types/session';

/** One complete Season (Scoring rule, Rounds, Sessions, Results), or null if there is no data for it. */
export function getSeason(classCode: string, year: number): Season | null {
  const db = getDatabase();
  const season = db
    .prepare(
      `SELECT s.id, s.year, s.notes, c.code AS classCode, c.name AS className, s.scoring_rule_id AS ruleId
         FROM seasons s JOIN classes c ON c.id = s.class_id
        WHERE c.code = ? AND s.year = ?`,
    )
    .get(classCode, year) as
    | { id: number; year: number; notes: string | null; classCode: string; className: string; ruleId: number }
    | undefined;
  if (!season) return null;

  const rounds = (db
    .prepare(
      `SELECT id, round_number AS number, name, circuit, country, date, non_championship AS nonChampionship, notes
         FROM rounds WHERE season_id = ? ORDER BY round_number`,
    )
    .all(season.id) as Array<Omit<Round, 'sessions' | 'nonChampionship'> & { id: number; nonChampionship: number }>);

  const sessionRows = db
    .prepare(
      `SELECT se.id, se.round_id AS roundId, se.type, se.session_order AS "order", se.date,
              se.points_multiplier AS pointsMultiplier, se.notes
         FROM sessions se JOIN rounds ro ON ro.id = se.round_id
        WHERE ro.season_id = ? ORDER BY se.session_order`,
    )
    .all(season.id) as Array<Omit<Session, 'results'> & { id: number; roundId: number }>;

  const resultRows = db
    .prepare(
      `SELECT re.session_id AS sessionId, ri.slug AS riderId, ri.name AS riderName, re.position, re.outcome,
              re.fastest_lap AS fastestLap, re.points_override AS pointsOverride, re.team, re.manufacturer,
              re.bike_number AS bikeNumber, re.nationality, re.source
         FROM results re
         JOIN sessions se ON se.id = re.session_id
         JOIN rounds ro   ON ro.id = se.round_id
         JOIN riders ri   ON ri.id = re.rider_id
        WHERE ro.season_id = ? ORDER BY re.id`,
    )
    .all(season.id) as Array<Omit<Result, 'fastestLap'> & { sessionId: number; riderName: string; fastestLap: number }>;

  const riders: Season['riders'] = {};
  const resultsBySession = new Map<number, Result[]>();
  for (const { sessionId, riderName, fastestLap, ...result } of resultRows) {
    riders[result.riderId] = { name: riderName };
    const list = resultsBySession.get(sessionId) ?? [];
    list.push({ ...result, fastestLap: fastestLap === 1 });
    resultsBySession.set(sessionId, list);
  }

  const sessionsByRound = new Map<number, Session[]>();
  for (const { id, roundId, ...session } of sessionRows) {
    const list = sessionsByRound.get(roundId) ?? [];
    list.push({ ...session, results: resultsBySession.get(id) ?? [] });
    sessionsByRound.set(roundId, list);
  }

  return {
    classCode: season.classCode,
    className: season.className,
    year: season.year,
    notes: season.notes,
    rule: getRule(season.ruleId),
    rounds: rounds.map(({ id, nonChampionship, ...round }) => ({
      ...round,
      nonChampionship: nonChampionship === 1,
      sessions: sessionsByRound.get(id) ?? [],
    })),
    riders,
  };
}

function getRule(ruleId: number): ScoringRule {
  const db = getDatabase();
  const rule = db
    .prepare(
      `SELECT code, name, source, notes, fastest_lap_points AS fastestLapPoints,
              fastest_lap_requires_finish AS requiresFinish
         FROM scoring_rules WHERE id = ?`,
    )
    .get(ruleId) as Omit<ScoringRule, 'points' | 'countingWindows' | 'fastestLapRequiresFinish'> & { requiresFinish: number };

  const points: ScoringRule['points'] = {};
  const rows = db
    .prepare('SELECT session_type AS type, position, points FROM scoring_points WHERE rule_id = ? ORDER BY position')
    .all(ruleId) as { type: string; position: number; points: number }[];
  for (const p of rows) (points[p.type] ??= [])[p.position - 1] = p.points;

  const countingWindows = db
    .prepare('SELECT from_round AS fromRound, to_round AS toRound, count FROM counting_windows WHERE rule_id = ? ORDER BY from_round')
    .all(ruleId) as ScoringRule['countingWindows'];

  const { requiresFinish, ...rest } = rule;
  return { ...rest, fastestLapRequiresFinish: requiresFinish === 1, points, countingWindows };
}
