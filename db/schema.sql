-- MotoGP Replay: source-of-truth database
-- Store RAW results only. Standings are always computed, never stored.

PRAGMA foreign_keys = ON;

-- 500cc, MotoGP, 350cc, 250cc, Moto2, 125cc, Moto3, 50cc, 80cc, MotoE...
CREATE TABLE classes (
  id    INTEGER PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,          -- 'motogp', '500cc', 'moto2'
  name  TEXT NOT NULL                  -- 'MotoGP', '500cc'
);

-- Logical grouping so 500cc (1949-2001) and MotoGP (2002-) can share URLs/UI
-- as "premier class". Optional but handy.
CREATE TABLE class_groups (
  id    INTEGER PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,          -- 'premier', 'intermediate', 'lightweight'
  name  TEXT NOT NULL
);
CREATE TABLE class_group_members (
  group_id INTEGER NOT NULL REFERENCES class_groups(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  PRIMARY KEY (group_id, class_id)
);

-- A scoring system. Reused across many seasons.
CREATE TABLE scoring_rules (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,   -- e.g. '2023+ race + sprint'
  best_n              INTEGER,         -- NULL = all results count; else only best N round scores count
  fastest_lap_points  INTEGER NOT NULL DEFAULT 0,  -- bonus used in some early seasons
  fastest_lap_requires_finish INTEGER NOT NULL DEFAULT 1,
  notes               TEXT
);

-- Points per finishing position, per session type.
CREATE TABLE scoring_points (
  rule_id   INTEGER NOT NULL REFERENCES scoring_rules(id),
  session   TEXT NOT NULL CHECK (session IN ('race', 'sprint')),
  position  INTEGER NOT NULL CHECK (position >= 1),
  points    REAL NOT NULL,             -- REAL: half points exist for shortened races
  PRIMARY KEY (rule_id, session, position)
);

CREATE TABLE seasons (
  id               INTEGER PRIMARY KEY,
  year             INTEGER NOT NULL,
  class_id         INTEGER NOT NULL REFERENCES classes(id),
  scoring_rule_id  INTEGER NOT NULL REFERENCES scoring_rules(id),
  notes            TEXT,
  UNIQUE (year, class_id)
);

CREATE TABLE circuits (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  city     TEXT,
  country  TEXT                         -- ISO 3166-1 alpha-2 where possible
);

CREATE TABLE rounds (
  id            INTEGER PRIMARY KEY,
  season_id     INTEGER NOT NULL REFERENCES seasons(id),
  round_number  INTEGER NOT NULL,
  name          TEXT NOT NULL,          -- 'Gran Premio d''Italia'
  circuit_id    INTEGER REFERENCES circuits(id),
  date          TEXT,                   -- ISO date of the main race
  UNIQUE (season_id, round_number)
);

CREATE TABLE riders (
  id           INTEGER PRIMARY KEY,
  first_name   TEXT,
  last_name    TEXT NOT NULL,
  nationality  TEXT,
  birth_date   TEXT,
  slug         TEXT NOT NULL UNIQUE     -- 'valentino-rossi'
);

CREATE TABLE manufacturers (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE            -- 'Ducati', 'MV Agusta', 'Norton'
);

CREATE TABLE teams (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL                   -- team names change yearly; keep it simple
);

-- One row per rider per session (race or sprint).
CREATE TABLE results (
  id               INTEGER PRIMARY KEY,
  round_id         INTEGER NOT NULL REFERENCES rounds(id),
  session          TEXT NOT NULL CHECK (session IN ('race', 'sprint')),
  rider_id         INTEGER NOT NULL REFERENCES riders(id),
  team_id          INTEGER REFERENCES teams(id),
  manufacturer_id  INTEGER REFERENCES manufacturers(id),
  bike_number      INTEGER,
  position         INTEGER,              -- NULL if not classified
  status           TEXT NOT NULL DEFAULT 'FIN'
                   CHECK (status IN ('FIN', 'DNF', 'DNS', 'DSQ', 'NC')),
  fastest_lap      INTEGER NOT NULL DEFAULT 0,
  points_override  REAL,                 -- set ONLY for anomalies (half points, penalties)
  source           TEXT,                 -- where this row came from, for auditing
  UNIQUE (round_id, session, rider_id)
);

CREATE INDEX idx_results_round ON results(round_id);
CREATE INDEX idx_results_rider ON results(rider_id);
CREATE INDEX idx_rounds_season ON rounds(season_id);

-- ---------------------------------------------------------------------------
-- Seed: classes and the premier-class group (500cc 1949-2001, MotoGP 2002-)
-- ---------------------------------------------------------------------------
INSERT INTO classes (id, code, name) VALUES
  (1, '500cc', '500cc'),
  (2, 'motogp', 'MotoGP');

INSERT INTO class_groups (id, code, name) VALUES (1, 'premier', 'Premier class');
INSERT INTO class_group_members (group_id, class_id) VALUES (1, 1), (1, 2);

-- ---------------------------------------------------------------------------
-- Seed: current scoring system (verified, in use since sprints began in 2023).
-- Add historical systems as you research them; verify each against a reliable
-- source (early seasons used different tables, fastest-lap bonuses and best-N).
-- ---------------------------------------------------------------------------
INSERT INTO scoring_rules (id, name, best_n, notes)
VALUES (1, '2023+ race + sprint', NULL, 'Full race 25..1 to 15th, sprint 12..1 to 9th');

INSERT INTO scoring_points (rule_id, session, position, points) VALUES
  (1,'race',1,25),(1,'race',2,20),(1,'race',3,16),(1,'race',4,13),(1,'race',5,11),
  (1,'race',6,10),(1,'race',7,9),(1,'race',8,8),(1,'race',9,7),(1,'race',10,6),
  (1,'race',11,5),(1,'race',12,4),(1,'race',13,3),(1,'race',14,2),(1,'race',15,1),
  (1,'sprint',1,12),(1,'sprint',2,9),(1,'sprint',3,7),(1,'sprint',4,6),(1,'sprint',5,5),
  (1,'sprint',6,4),(1,'sprint',7,3),(1,'sprint',8,2),(1,'sprint',9,1);
