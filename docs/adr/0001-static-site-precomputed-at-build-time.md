# Static site, everything precomputed at build time

The data is historical and changes only when new Results are added, so the site is a Next.js static export (`output: 'export'`) hosted on GitHub Pages, with no backend. Every Season's Standings at every Step are computed at build time by pure, unit-tested TypeScript functions (not SQL, where Dropped scores and tie-breaks are awkward) and shipped as static HTML/JSON.

## Consequences

- Server-only Next.js features (Server Actions, route handlers at request time, ISR) are unavailable; anything "dynamic" must be computable at build time or run in the browser.
- New data reaches the site only through a deploy (a release PR from `develop` into `main`).
