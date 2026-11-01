# Per-Season text files are the source of truth; SQLite is generated

Raw data lives in one text file per Season committed to the repo, and the SQLite database is generated from those files at build time, then read only during the build; it never ships to the browser and is not committed. Only raw facts (Rounds, Sessions, Results, Scoring rules) are stored; Standings are always computed, never stored.

We originally committed `db/motogp.db` as the source of truth, but every change lands through a reviewed PR, and a binary database cannot be reviewed in a diff. Text files keep data changes and each row's source readable in review, while SQLite still gives the build relational queries.

## Considered options

- **Committed SQLite file**: rejected, data PRs are unreviewable.
- **Shipping the database to the browser (sql.js)**: rejected, only useful for free-form querying, which the site does not offer.
