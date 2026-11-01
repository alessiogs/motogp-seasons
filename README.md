# MotoGP Seasons

Relive every Grand Prix World Championship season since 1949, step by step: pick a season and watch the standings evolve after every points-paying session, up to the moment the World Champion is crowned.

Starting with the Premier category (500cc 1949–2001, MotoGP 2002–); the other classes come later. Domain vocabulary is in [GLOSSARY.md](GLOSSARY.md), decisions in [docs/adr/](docs/adr/).

## How it works

- **`data/`** (JSON, committed) is the source of truth: `seasons/<class>-<year>.json`, `scoring-rules/*.json`, `riders.json`. `npm run data:build` generates `db/motogp.db` (SQLite, git-ignored) from it; schema in `src/features/data-build/schema.sql`. Standings are never stored.
- **`src/features/scoring/logic/compute-replay.ts`** turns a Season into Replay Steps, one per Session: position points, Sprint and Grand Prix race, Counting windows, fastest-lap bonus, points multipliers and overrides, Countback and Latest-best tie-breaks.
- **Next.js static export** reads the database at build time and pre-renders one page per season (`/[class]/[year]`) with the standings after every session. The site is plain HTML/JS, no server.
- **GitHub Pages** deploys automatically on every push to `main` (`.github/workflows/deploy.yml`).

## Development

```bash
npm install
npm test          # scoring and data seams
npm run dev       # http://localhost:3000 (builds the database first)
npm run build     # static site in out/ (builds the database first)
```

Load a season from Wikipedia as a first draft to review and correct by hand: `npm run data:load-wikipedia -- motogp 2024`.

## Data notes

- Per-season text files are the source of truth, with SQLite generated from them at build time ([ADR-0002](docs/adr/0002-text-files-are-the-source-of-truth.md)). `data/official-tables/` holds each season's official final table, which tests compare the last Replay Step against.
- Results are loaded from Wikipedia and published under CC BY-SA; motogp.com is used only to check data by hand ([ADR-0007](docs/adr/0007-wikipedia-as-primary-data-source.md)).
- Scoring systems changed many times since 1949. Verify every Scoring rule against a reliable source and record that source before publishing its seasons ([ADR-0003](docs/adr/0003-scoring-is-data.md)).
