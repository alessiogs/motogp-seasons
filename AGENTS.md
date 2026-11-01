# AGENTS.md

## Git workflow

`develop` is the integration branch; `main` is the release branch and every push to it deploys to GitHub Pages. Both are protected: changes land only through PRs that pass the `check` job in `.github/workflows/ci.yml`. History is plain commits joined by merge commits: every PR merges with `gh pr merge --merge`, the only method the repo allows.

1. Branch from an up-to-date `develop`, named `<type>/<short-kebab-name>` with type `feat`, `fix`, `chore`, or `docs` (e.g. `feat/season-timeline`).
2. Commit on that branch, push it, and open a PR into `develop`.
3. When `develop` moves ahead, `git merge origin/develop` into the feature branch, resolve any conflicts there, and push. The branch keeps its commits as they are, so pushes stay fast-forward.
4. Merge the PR once `check` is green.
5. To release, open a PR from `develop` into `main` and merge it. CI fails any PR into `main` whose head is not `develop`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `alessiogs/motogp-seasons`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
