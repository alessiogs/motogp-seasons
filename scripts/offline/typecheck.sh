#!/usr/bin/env bash
# Partial typecheck of src/**/*.ts (not .tsx) for sessions with no node_modules. Run from the repo root.
# Errors about modules it cannot see (react, next, better-sqlite3, vitest) are filtered out;
# anything printed is a real error. Prints nothing when clean. CI's `npm run typecheck` covers .tsx.
# Uses the first TypeScript it finds: TSC=<path to tsc>, then node_modules/.bin/tsc, then tsc on PATH.
# @types/node comes from TYPE_ROOTS=<dir> or the global npm root.
set -euo pipefail
tsc="${TSC:-}"
[ -z "$tsc" ] && [ -x node_modules/.bin/tsc ] && tsc=node_modules/.bin/tsc
[ -z "$tsc" ] && tsc="$(command -v tsc || true)"
[ -n "$tsc" ] && [ -x "$tsc" ] || { echo "typecheck.sh: no TypeScript found at '${tsc}'; set TSC=<path to tsc>" >&2; exit 2; }
type_roots="${TYPE_ROOTS:-}"
if [ -z "$type_roots" ]; then
  for dir in node_modules/@types "$(npm root -g 2>/dev/null)/@types" /opt/node-tools/node_modules/@types; do
    [ -d "$dir/node" ] && { type_roots="$(cd "$dir" && pwd)"; break; }
  done
fi
config="$(mktemp --suffix=.json)"
trap 'rm -f "$config"' EXIT
cat > "$config" <<JSON
{ "compilerOptions": { "target": "ES2022", "lib": ["dom","esnext"], "strict": true, "noEmit": true, "skipLibCheck": true,
  "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true, "isolatedModules": true, "esModuleInterop": true,
  "paths": { "@/*": ["$PWD/src/*"] }, "typeRoots": ["${type_roots}"], "types": ["node"] },
  "include": ["$PWD/src/**/*.ts"] }
JSON
"$tsc" -p "$config" 2>&1 | grep -E "error TS" | grep -vE "TS2307|TS7016|TS2882|\.test\.ts.*TS7006" || true
