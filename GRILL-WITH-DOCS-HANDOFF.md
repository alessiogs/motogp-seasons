# GRILL-WITH-DOCS HANDOFF (temporary file)

> **For the agent running `/grill-with-docs`:** this file is the starting brief for the session.
> Read it first, use it to ground the grilling, and turn what gets settled into the skill's usual
> outputs: the domain glossary in `CONTEXT.md` and ADRs for decisions that warrant one.
> **When the session is done, delete this file.** Nothing here should survive outside `CONTEXT.md`,
> the ADRs and the README.

---

## 1. What the project is

A static website to **relive every MotoGP premier-class season, round by round**: pick a year,
move a slider, and see the championship standings after each race.

- Repo: `github.com/alessiogs/motogp-seasons` (public)
- Site: `https://alessiogs.github.io/motogp-seasons/` (deployed, currently shows "No seasons in the database yet")
- Owner: Alessio (solo developer, comfortable with React)

**Scope v1:** premier class only = **500cc (1949–2001)** + **MotoGP (2002–today)**.
**Later:** all other classes (350cc, 250cc, Moto2, 125cc, Moto3, 50cc/80cc, sidecars?, MotoE?).

## 2. Current state of the code (first commit)

| Path | What it is |
|---|---|
| `db/schema.sql` | SQLite schema + seeds (classes 500cc/MotoGP, "premier" class group, 2023+ scoring rule) |
| `db/motogp.db` | SQLite database built from the schema. **No seasons/results yet.** Committed to the repo |
| `src/lib/standings.ts` | Pure standings logic (no I/O): `pointsFor`, `computeStandings`, `computeSeason` |
| `src/lib/standings.test.ts` | Vitest tests (9, passing) |
| `src/lib/db.ts` | Build-time data access with better-sqlite3 (`listPremierSeasons`, `getPremierSeason`) |
| `src/app/page.tsx` | Home: seasons grouped by decade |
| `src/app/season/[year]/page.tsx` | Season page, pre-rendered per year via `generateStaticParams` |
| `src/app/season/[year]/SeasonReplay.tsx` | Client component: round slider, table with position change ▲▼, gap, wins |
| `scripts/init-db.mjs` | Recreates the DB from the schema (`npm run db:init -- --force`) |
| `.github/workflows/deploy.yml` | Install → test → build → deploy to GitHub Pages |

## 3. Decisions already taken (ADR candidates)

1. **Fully static site, no backend.** Data is historical; everything is precomputed at build time.
2. **Next.js 15 App Router with `output: 'export'`**, hosted on **GitHub Pages** via GitHub Actions.
   `basePath` comes from `NEXT_PUBLIC_BASE_PATH=/motogp-seasons` (set in the workflow).
3. **SQLite is the source of truth**, committed to the repo, read only at build time
   (better-sqlite3 in server components). The DB never ships to the browser.
   (Rejected: shipping the DB to the browser with sql.js — only useful for free-form querying.)
4. **Store raw results only, never standings.** Standings are always computed.
5. **Scoring rules are data**, not code: `scoring_rules` (best-N, fastest-lap bonus) + `scoring_points`
   (points per position per session). Each season references one rule.
6. **Standings logic is a pure, unit-tested TypeScript function**, not SQL (dropped scores are awkward in SQL).
7. **Dropped scores are applied progressively**: after round k, best-N uses only rounds 1..k, so mid-season
   tables match what they looked like at the time.
8. **Tie-break = countback on main-race finishes** (wins, then 2nds, …). Sprint finishes are not counted.
9. **Anomalies via `points_override`** on a single result (half points for shortened races, penalties).
10. **500cc and MotoGP are one "premier class"** through `class_groups`, so URLs/UI treat them as one series.
11. **Data source: no official public API.** Plan to scrape (motogp.com's undocumented JSON backend for
    recent years; Wikipedia/archives for older ones).

## 4. Domain glossary candidates (for CONTEXT.md)

- **Season**: one championship year of one class.
- **Class**: 500cc, MotoGP, Moto2, …
- **Class group**: a lineage of classes shown as one series (premier = 500cc + MotoGP).
- **Round**: one Grand Prix event in a season, numbered from 1.
- **Session**: a points-paying race within a round: `race` (main) or `sprint` (since 2023).
- **Result**: one rider's outcome in one session (position, status FIN/DNF/DNS/DSQ/NC, fastest lap).
- **Scoring rule**: points table per session + best-N + fastest-lap bonus.
- **Round score**: a rider's total points in one round (race + sprint + bonuses).
- **Best-N / dropped scores**: only the best N round scores count toward the championship.
- **Gross points vs championship points**: before vs after dropped scores.
- **Countback**: tie-break by number of wins, then 2nds, and so on.
- **Standings**: the ranked table after a given round. Never stored.
- **Points override**: manual points for one result when the normal rule doesn't apply.

## 5. Open questions to grill

**Data**
- Which sources exactly, per era? Reliability, licensing/terms of use of scraping motogp.com and Wikipedia.
- Rider identity across sources and eras (name spellings, same rider in different classes): what is the canonical ID/slug?
- Teams and manufacturers: per result, per season, or both? Team names change yearly.
- Nationality: ISO codes? Historic countries (West Germany, Czechoslovakia, Yugoslavia)?
- Cancelled/abandoned races, rounds with no premier-class race, races run in two parts (aggregate).

**Scoring**
- Every historical points table and best-N rule: where do we verify them, and how do we record the source?
- Is "best-N" always per round, or per race? Any seasons with split counting (best N of first half + best M of second half)?
- Best-N tie rule: when two round scores are equal, which one is "dropped"? (Currently: the earlier round; arbitrary but deterministic.)
- Fastest-lap bonus: which seasons, and does it require finishing?
- Countback: should sprint results ever count? What did the official regulations say per era?
- Do we show the points that counted at the time, or reconstruct anything retroactively (penalties applied later)?

**Product / UI**
- URL scheme: `/season/[year]` now; with more classes, `/[class-group]/[year]`?
- What else per round: race winner, podium, circuit, "championship decided here" moment?
- Charts: points-over-season line chart, position "bump chart"? Animations on slider change?
- Mobile-first? Dark mode (already follows the system)?

## 6. Mini roadmap

1. ~~Define stack~~ ✅
2. ~~SQLite schema + standings function with tests~~ ✅
3. ~~Next.js static site + GitHub Pages deploy~~ ✅ (live, empty)
4. **Scraper**: load two contrasting seasons first, e.g. **2024** (race + sprint) and **1950**
   (early points table, best-N, fastest lap?), to validate the schema against real data.
5. **Verify scoring rules** for those two seasons against a reliable source; fix schema if needed.
6. **Scale to all premier-class seasons 1949–today**, recording the source of every row.
7. **UI polish**: animated position swaps (Framer Motion), points-over-season chart (Recharts), round details.
8. **Other classes** (Moto2/250cc, Moto3/125cc, 350cc, 50/80cc…) using `class_groups`.

## 7. Known environment notes

- The cloud agent environment that wrote this could not reach the npm registry, so the full
  `next build` has only been verified in GitHub Actions (latest deploy run: success).
- There is no `package-lock.json` yet; CI uses `npm install`. Generate and commit a lockfile on the first local install.
