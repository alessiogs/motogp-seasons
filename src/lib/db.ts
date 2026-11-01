// Build-time data access. Only imported by server components, so it runs in Node
// during `next build` and never ships to the browser.
import 'server-only';
import Database from 'better-sqlite3';
import path from 'node:path';
import type { Result, ScoringRule, Session, Status } from './standings';

const DB_PATH = path.join(process.cwd(), 'db', 'motogp.db');

let _db: Database.Database | null = null;
function db() {
  _db ??= new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return _db;
}

export interface SeasonSummary {
  year: number;
  className: string;
}

export interface SeasonData {
  year: number;
  className: string;
  rule: ScoringRule;
  rounds: { number: number; name: string; date: string | null; country: string | null }[];
  riders: Record<number, { name: string; nationality: string | null }>;
  results: Result[];
}

/** Premier-class seasons (500cc + MotoGP), oldest first. */
export function listPremierSeasons(): SeasonSummary[] {
  return db()
    .prepare(
      `SELECT s.year, c.name AS className
         FROM seasons s
         JOIN classes c              ON c.id = s.class_id
         JOIN class_group_members gm ON gm.class_id = c.id
         JOIN class_groups g         ON g.id = gm.group_id
        WHERE g.code = 'premier'
        ORDER BY s.year`,
    )
    .all() as SeasonSummary[];
}

export function getPremierSeason(year: number): SeasonData | null {
  const season = db()
    .prepare(
      `SELECT s.id, s.year, c.name AS className, s.scoring_rule_id AS ruleId
         FROM seasons s
         JOIN classes c              ON c.id = s.class_id
         JOIN class_group_members gm ON gm.class_id = c.id
         JOIN class_groups g         ON g.id = gm.group_id
        WHERE g.code = 'premier' AND s.year = ?`,
    )
    .get(year) as { id: number; year: number; className: string; ruleId: number } | undefined;
  if (!season) return null;

  const rounds = db()
    .prepare(
      `SELECT r.round_number AS number, r.name, r.date, ci.country
         FROM rounds r LEFT JOIN circuits ci ON ci.id = r.circuit_id
        WHERE r.season_id = ? ORDER BY r.round_number`,
    )
    .all(season.id) as SeasonData['rounds'];

  const rows = db()
    .prepare(
      `SELECT ro.round_number AS round, re.session, re.rider_id AS riderId, re.position,
              re.status, re.fastest_lap AS fastestLap, re.points_override AS pointsOverride,
              ri.first_name AS firstName, ri.last_name AS lastName, ri.nationality
         FROM results re
         JOIN rounds ro ON ro.id = re.round_id
         JOIN riders ri ON ri.id = re.rider_id
        WHERE ro.season_id = ?`,
    )
    .all(season.id) as Array<{
      round: number; session: Session; riderId: number; position: number | null; status: Status;
      fastestLap: number; pointsOverride: number | null;
      firstName: string | null; lastName: string; nationality: string | null;
    }>;

  const riders: SeasonData['riders'] = {};
  const results: Result[] = rows.map((r) => {
    riders[r.riderId] ??= {
      name: [r.firstName, r.lastName].filter(Boolean).join(' '),
      nationality: r.nationality,
    };
    return {
      round: r.round, session: r.session, riderId: r.riderId, position: r.position,
      status: r.status, fastestLap: r.fastestLap === 1, pointsOverride: r.pointsOverride,
    };
  });

  return { year: season.year, className: season.className, rule: getRule(season.ruleId), rounds, riders, results };
}

function getRule(ruleId: number): ScoringRule {
  const rule = db()
    .prepare(
      `SELECT best_n AS bestN, fastest_lap_points AS flp, fastest_lap_requires_finish AS flf
         FROM scoring_rules WHERE id = ?`,
    )
    .get(ruleId) as { bestN: number | null; flp: number; flf: number };

  const points: ScoringRule['points'] = { race: [], sprint: [] };
  const rows = db()
    .prepare(`SELECT session, position, points FROM scoring_points WHERE rule_id = ? ORDER BY position`)
    .all(ruleId) as { session: Session; position: number; points: number }[];
  for (const p of rows) points[p.session][p.position - 1] = p.points;

  return { points, bestN: rule.bestN, fastestLapPoints: rule.flp, fastestLapRequiresFinish: rule.flf === 1 };
}
