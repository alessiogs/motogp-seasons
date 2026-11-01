// Generates the SQLite database from the JSON files in a data directory (ADR-0002):
//   <dataDir>/riders.json, <dataDir>/scoring-rules/*.json, <dataDir>/seasons/*.json
import Database from 'better-sqlite3';
import { mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RiderFile } from '../types/rider-file';

interface RuleFile {
  code: string; name: string; source: string; notes?: string | null;
  /** Years the rule is verified for; a Season of any other year is refused. Absent = any year. */
  validFor?: number[];
  fastestLapPoints: number; fastestLapRequiresFinish: boolean;
  countingWindows: { fromRound: number; toRound: number; count: number }[];
  points: Record<string, number[]>;
}
interface ResultFile {
  rider: string; position: number | null; outcome: string; fastestLap: boolean;
  pointsOverride: number | null; team: string | null; manufacturer: string | null;
  bikeNumber: number | null; nationality: string | null; source: string;
}
interface SeasonFile {
  class: string; year: number; scoringRule: string; notes?: string | null;
  rounds: {
    number: number; name: string; circuit: string | null; country: string | null; date: string | null;
    nonChampionship: boolean; notes?: string | null;
    sessions: {
      type: string; order: number; date: string | null; pointsMultiplier: number; notes?: string | null;
      results: ResultFile[];
    }[];
  }[];
}

const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'schema.sql');

function readJsonFiles<T>(dir: string): { file: string; data: T }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, data: JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as T }));
}

/** Recreates `dbPath` from the JSON files in `dataDir`. Throws on data that must not be published. */
export function buildDatabase(dataDir: string, dbPath: string): void {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  rmSync(dbPath, { force: true });
  const db = new Database(dbPath);
  try {
    db.exec(readFileSync(SCHEMA, 'utf8'));
    db.transaction(() => {
      const riderIds = loadRiders(db, dataDir);
      const ruleIds = loadRules(db, dataDir);
      loadSeasons(db, dataDir, riderIds, ruleIds);
    })();
  } finally {
    db.close();
  }
}

function loadRiders(db: Database.Database, dataDir: string): Map<string, number> {
  const ids = new Map<string, number>();
  const insert = db.prepare('INSERT INTO riders (slug, name) VALUES (?, ?)');
  const insertSource = db.prepare('INSERT INTO rider_source_ids (rider_id, source, source_id) VALUES (?, ?, ?)');
  const riders = JSON.parse(readFileSync(path.join(dataDir, 'riders.json'), 'utf8')) as RiderFile[];
  for (const rider of riders) {
    const id = Number(insert.run(rider.id, rider.name).lastInsertRowid);
    ids.set(rider.id, id);
    for (const [source, sourceId] of Object.entries(rider.sourceIds)) insertSource.run(id, source, sourceId);
  }
  return ids;
}

function loadRules(db: Database.Database, dataDir: string): Map<string, { id: number; types: Set<string>; validFor: number[] | null }> {
  const rules = new Map<string, { id: number; types: Set<string>; validFor: number[] | null }>();
  const insert = db.prepare(
    `INSERT INTO scoring_rules (code, name, fastest_lap_points, fastest_lap_requires_finish, source, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertPoints = db.prepare('INSERT INTO scoring_points (rule_id, session_type, position, points) VALUES (?, ?, ?, ?)');
  const insertWindow = db.prepare('INSERT INTO counting_windows (rule_id, from_round, to_round, count) VALUES (?, ?, ?, ?)');
  for (const { file, data: rule } of readJsonFiles<RuleFile>(path.join(dataDir, 'scoring-rules'))) {
    if (!rule.source?.trim()) throw new Error(`Scoring rule ${file} has no verification source; unverified rules are not published`);
    const id = Number(
      insert.run(rule.code, rule.name, rule.fastestLapPoints, rule.fastestLapRequiresFinish ? 1 : 0, rule.source, rule.notes ?? null)
        .lastInsertRowid,
    );
    for (const [type, table] of Object.entries(rule.points)) {
      table.forEach((points, i) => insertPoints.run(id, type, i + 1, points));
    }
    for (const w of rule.countingWindows) insertWindow.run(id, w.fromRound, w.toRound, w.count);
    rules.set(rule.code, { id, types: new Set(Object.keys(rule.points)), validFor: rule.validFor ?? null });
  }
  return rules;
}

function loadSeasons(
  db: Database.Database,
  dataDir: string,
  riderIds: Map<string, number>,
  rules: Map<string, { id: number; types: Set<string>; validFor: number[] | null }>,
): void {
  const classId = db.prepare('SELECT id FROM classes WHERE code = ?');
  const insertSeason = db.prepare('INSERT INTO seasons (year, class_id, scoring_rule_id, notes) VALUES (?, ?, ?, ?)');
  const insertRound = db.prepare(
    `INSERT INTO rounds (season_id, round_number, name, circuit, country, date, non_championship, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertSession = db.prepare(
    'INSERT INTO sessions (round_id, type, session_order, date, points_multiplier, notes) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertResult = db.prepare(
    `INSERT INTO results (session_id, rider_id, position, outcome, fastest_lap, points_override,
                          team, manufacturer, bike_number, nationality, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const { file, data: season } of readJsonFiles<SeasonFile>(path.join(dataDir, 'seasons'))) {
    const cls = classId.get(season.class) as { id: number } | undefined;
    if (!cls) throw new Error(`${file}: unknown class "${season.class}"`);
    const rule = rules.get(season.scoringRule);
    if (!rule) throw new Error(`${file}: unknown scoring rule "${season.scoringRule}"`);
    if (rule.validFor && !rule.validFor.includes(season.year)) {
      throw new Error(`${file}: scoring rule "${season.scoringRule}" is only verified for ${rule.validFor.join(', ')}, not ${season.year}`);
    }

    const seasonId = Number(insertSeason.run(season.year, cls.id, rule.id, season.notes ?? null).lastInsertRowid);
    for (const round of season.rounds) {
      const roundId = Number(
        insertRound.run(seasonId, round.number, round.name, round.circuit, round.country, round.date, round.nonChampionship ? 1 : 0, round.notes ?? null)
          .lastInsertRowid,
      );
      for (const session of round.sessions) {
        if (!rule.types.has(session.type)) {
          throw new Error(`${file}: round ${round.number} has a "${session.type}" session but rule "${season.scoringRule}" has no points table for it`);
        }
        const sessionId = Number(
          insertSession.run(roundId, session.type, session.order, session.date, session.pointsMultiplier, session.notes ?? null)
            .lastInsertRowid,
        );
        for (const r of session.results) {
          const riderId = riderIds.get(r.rider);
          if (riderId == null) throw new Error(`${file}: unknown rider "${r.rider}"`);
          insertResult.run(
            sessionId, riderId, r.position, r.outcome, r.fastestLap ? 1 : 0, r.pointsOverride,
            r.team, r.manufacturer, r.bikeNumber, r.nationality, r.source,
          );
        }
      }
    }
  }
}
