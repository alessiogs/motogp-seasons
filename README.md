# MotoGP Seasons

Relive every MotoGP season since 1949, round by round: pick a year and watch the championship standings evolve after each race.

Starting with the premier class (500cc 1949–2001, MotoGP 2002–); Moto2/Moto3 and the older classes come later.

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

Scoring systems changed many times since 1949. Each season points to a `scoring_rules` row; verify every historical points table and best-N rule against a reliable source before seeding it.
