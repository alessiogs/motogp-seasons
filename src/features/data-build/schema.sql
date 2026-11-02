-- MotoGP Replay: generated database (ADR-0002).
-- Built from the JSON files in data/ by `npm run data:build`; never edited by hand, never committed.
-- Stores raw facts only. Standings are always computed, never stored.

PRAGMA foreign_keys = ON;

-- Categories link Classes of one lineage (Premier: 500cc -> MotoGP). They order the home page (ADR-0006).
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

CREATE TABLE classes (
  id           INTEGER PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,          -- 'motogp', '500cc': the URL segment
  name         TEXT NOT NULL,
  category_id  INTEGER NOT NULL REFERENCES categories(id),
  sort_order   INTEGER NOT NULL               -- order within the Category
);

-- A Scoring rule (ADR-0003). Reused across many Seasons.
CREATE TABLE scoring_rules (
  id                           INTEGER PRIMARY KEY,
  code                         TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  fastest_lap_points           REAL NOT NULL DEFAULT 0,
  fastest_lap_requires_finish  INTEGER NOT NULL DEFAULT 1,
  source                       TEXT NOT NULL CHECK (length(source) > 0),  -- what it was verified against
  notes                        TEXT
);

-- Points per finishing position, per Session type. Session type is an open set:
-- a type is points-paying exactly when it has rows here.
CREATE TABLE scoring_points (
  rule_id       INTEGER NOT NULL REFERENCES scoring_rules(id),
  session_type  TEXT NOT NULL,
  position      INTEGER NOT NULL CHECK (position >= 1),
  points        REAL NOT NULL,
  PRIMARY KEY (rule_id, session_type, position)
);

-- Only the best `count` Round scores from from_round..to_round count. No rows = every Round score counts.
CREATE TABLE counting_windows (
  rule_id     INTEGER NOT NULL REFERENCES scoring_rules(id),
  from_round  INTEGER NOT NULL,
  to_round    INTEGER NOT NULL,
  count       INTEGER NOT NULL,
  PRIMARY KEY (rule_id, from_round)
);

CREATE TABLE seasons (
  id               INTEGER PRIMARY KEY,
  year             INTEGER NOT NULL,
  class_id         INTEGER NOT NULL REFERENCES classes(id),
  scoring_rule_id  INTEGER NOT NULL REFERENCES scoring_rules(id),
  notes            TEXT,
  UNIQUE (year, class_id)
);

CREATE TABLE rounds (
  id                INTEGER PRIMARY KEY,
  season_id         INTEGER NOT NULL REFERENCES seasons(id),
  round_number      INTEGER NOT NULL,
  name              TEXT NOT NULL,
  circuit           TEXT,
  country           TEXT,                  -- country at the time
  date              TEXT,                  -- ISO date of the main Session
  non_championship  INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  UNIQUE (season_id, round_number)
);

CREATE TABLE sessions (
  id                 INTEGER PRIMARY KEY,
  round_id           INTEGER NOT NULL REFERENCES rounds(id),
  type               TEXT NOT NULL,        -- 'sprint', 'grand-prix-race', ...
  session_order      INTEGER NOT NULL,
  date               TEXT,
  points_multiplier  REAL NOT NULL DEFAULT 1,
  notes              TEXT,
  UNIQUE (round_id, session_order)
);

-- A Rider is one real person; slug is the stable ID used by the data files.
CREATE TABLE riders (
  id    INTEGER PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

-- Each source's own ID for a Rider, used for matching.
CREATE TABLE rider_source_ids (
  rider_id   INTEGER NOT NULL REFERENCES riders(id),
  source     TEXT NOT NULL,
  source_id  TEXT NOT NULL,
  PRIMARY KEY (rider_id, source)
);

-- A Team is one identity within a Season, under its one display name (data/teams/<class>-<year>.json).
CREATE TABLE teams (
  id         INTEGER PRIMARY KEY,
  season_id  INTEGER NOT NULL REFERENCES seasons(id),
  name       TEXT NOT NULL,
  UNIQUE (season_id, name)
);

-- One row per Rider per Session.
CREATE TABLE results (
  id               INTEGER PRIMARY KEY,
  session_id       INTEGER NOT NULL REFERENCES sessions(id),
  rider_id         INTEGER NOT NULL REFERENCES riders(id),
  position         INTEGER,                -- NULL if not classified
  outcome          TEXT NOT NULL CHECK (outcome IN ('FIN', 'DNF', 'DNS', 'DSQ', 'NC')),
  fastest_lap      INTEGER NOT NULL DEFAULT 0,
  points_override  REAL,                   -- ONLY for anomalies affecting one Result
  team_id          INTEGER REFERENCES teams(id),  -- NULL when the source names no Team
  manufacturer     TEXT,
  bike_number      INTEGER,
  nationality      TEXT,                   -- the flag the Rider raced under this Season
  source           TEXT NOT NULL CHECK (length(source) > 0),
  UNIQUE (session_id, rider_id)
);

CREATE INDEX idx_results_session ON results(session_id);
CREATE INDEX idx_sessions_round ON sessions(round_id);
CREATE INDEX idx_rounds_season ON rounds(season_id);

-- Categories and Classes (GLOSSARY.md).
INSERT INTO categories (id, code, name, sort_order) VALUES
  (1, 'premier', 'Premier', 1),
  (2, 'intermediate', 'Intermediate', 2),
  (3, 'lightweight', 'Lightweight', 3),
  (4, '350cc', '350cc', 4),
  (5, 'smallest', 'Smallest', 5);

INSERT INTO classes (code, name, category_id, sort_order) VALUES
  ('500cc', '500cc', 1, 1),
  ('motogp', 'MotoGP', 1, 2),
  ('250cc', '250cc', 2, 1),
  ('moto2', 'Moto2', 2, 2),
  ('125cc', '125cc', 3, 1),
  ('moto3', 'Moto3', 3, 2),
  ('350cc', '350cc', 4, 1),
  ('50cc', '50cc', 5, 1),
  ('80cc', '80cc', 5, 2);
