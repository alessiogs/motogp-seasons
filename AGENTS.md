# AGENTS.md

## Git workflow

`develop` is the integration branch; `main` is the release branch and every push to it deploys to GitHub Pages. Both are protected: changes land only through PRs that pass the `check` job in `.github/workflows/ci.yml`. History is plain commits joined by merge commits: every PR merges with `gh pr merge --merge`, the only method the repo allows.

1. Branch from an up-to-date `develop`, named `<type>/<short-kebab-name>` with type `feat`, `fix`, `chore`, or `docs` (e.g. `feat/season-timeline`).
2. Commit on that branch, push it, and open a PR into `develop`.
3. When `develop` moves ahead, `git merge origin/develop` into the feature branch, resolve any conflicts there, and push. The branch keeps its commits as they are, so pushes stay fast-forward.
4. Merge the PR once `check` is green.
5. To release, open a PR from `develop` into `main` and merge it. CI fails any PR into `main` whose head is not `develop`.

## Code organization

Code lives in `src/features/<feature>/`, one folder per feature, named in the vocabulary of `GLOSSARY.md` (`seasons`, `scoring`, `replay`, `data-build`). Code used by two or more features lives in `src/shared/`, with the same layout.

- **Subfolders by kind**, created only when needed: `components/` (React components), `queries/` (build-time, server-only SQLite reads), `logic/` (pure functions, no I/O), `types/`, `scripts/` (Node entry points). Add a new kind only with a reason, and list it here. The site is a static export (ADR-0001), so Server Actions and route handlers are unavailable; build-time `queries/` take their place.
- **One file per functionality**: each file exports one function or component named after the file, in kebab-case (`logic/compute-standings.ts` exports `computeStandings`). Helpers private to that file stay in it. Tests sit beside their file (`countback.test.ts`).
- **Imports** point at the real file: no `index.ts` barrels. Features may import each other's files as long as no import cycle forms.
- **`src/app/` is routing only**: `page.tsx` reads params, calls a feature query and renders a feature component; `generateStaticParams`, `layout.tsx` and `globals.css` stay there because Next.js requires them. Everything else belongs in a feature.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `alessiogs/motogp-seasons`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
