#!/usr/bin/env bash
# Usage: run-tests.sh [test files...]  — run from the repo (or worktree) root. No args = every *.test.ts under src/.
H="$(cd "$(dirname "$0")" && pwd)"
export HARNESS_ROOT="$PWD"
files=("$@"); [ ${#files[@]} -eq 0 ] && mapfile -t files < <(find src -name '*.test.ts' | sort)
exec node --no-warnings --experimental-strip-types --import "$H/register.mjs" --test --test-reporter=spec "${files[@]}" 2>&1
