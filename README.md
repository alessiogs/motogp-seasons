# MotoGP Seasons

Relive every Grand Prix World Championship season since 1949, step by step: pick a season and watch the standings evolve after every points-paying session, up to the moment the World Champion is crowned.

Starting with the Premier category (500cc 1949–2001, MotoGP 2002–); the other classes come later. Domain vocabulary is in [GLOSSARY.md](GLOSSARY.md), decisions in [docs/adr/](docs/adr/).

## How it works

- **`db/motogp.db`** (SQLite) is the source of truth. It holds raw results only; standings are never stored. Schema: `db/schema.sql`.
- **`src/lib/standings.ts`** computes standings from raw results and the season's scoring rule: race and sprint points, best-N dropped scores, fastest-lap bonuses, per-result overrides for half points or penalties, and countback tie-breaks.
- **Next.js static export** reads the database at build time and pre-renders one page per season with the standings after every round. The site is plain HTML/JS, no server.
- **GitHub Pages** deploys automatically on every push to `main` (`.github/workflows/deploy.yml`).

## Development

```bash
npm install
npm test          # standings logic
npm run dev       # http://localhost:3000
npm run build     # static site in out/
```

Recreate an empty database from the schema (wipes data): `npm run db:init -- --force`.

## Data notes

- Per-season text files will become the source of truth, with SQLite generated from them at build time ([ADR-0002](docs/adr/0002-text-files-are-the-source-of-truth.md)); until that lands, `db/motogp.db` is still committed.
- Results are loaded from Wikipedia and published under CC BY-SA; motogp.com is used only to check data by hand ([ADR-0007](docs/adr/0007-wikipedia-as-primary-data-source.md)).
- Scoring systems changed many times since 1949. Verify every Scoring rule against a reliable source and record that source before publishing its seasons ([ADR-0003](docs/adr/0003-scoring-is-data.md)).
