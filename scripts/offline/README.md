# Offline checks

For agent sessions where `npm ci` can't reach the registry, so there is no `node_modules`. They stand in for `npm test` and `npm run typecheck` closely enough to work test-first; CI's `check` job stays the real gate.

Run both from the repo (or worktree) root:

- `scripts/offline/run-tests.sh [files...]` runs `src/**/*.test.ts` (or the files given) on Node's test runner with type stripping. `loader.mjs` swaps in small stand-ins: `vitest` → `vitest-shim.ts` (describe/it/each/expect subset), `better-sqlite3` → `better-sqlite3-shim.mjs` (over `node:sqlite`), `server-only` → `empty.mjs`, and resolves the `@/` alias.
- `scripts/offline/typecheck.sh` typechecks `src/**/*.ts` and prints only real errors; empty output means clean.

Limits, all covered by CI:

- `.ts` tests only: a test that imports JSX (`.tsx`) won't load. Keep tested code in `logic/`, `queries/` and `scripts/` `.ts` files.
- `.tsx` files aren't typechecked.
- Type stripping rejects enums, namespaces and parameter properties in `.ts` files.
- A test needing a vitest matcher the shim lacks: add it to `vitest-shim.ts`.
