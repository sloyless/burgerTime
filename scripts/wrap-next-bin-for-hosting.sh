#!/usr/bin/env bash
# Firebase Hosting web frameworks invoke `next build` directly (Turbopack on Next 16).
# Wrap the CLI so deploy uses webpack — required for serverExternalPackages / Admin SSR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/node_modules/.bin/next"
REAL="$ROOT/node_modules/.bin/next.real"

if [[ ! -f "$REAL" ]]; then
  if [[ ! -x "$BIN" ]]; then
    echo "wrap-next-bin-for-hosting: next binary not found at $BIN" >&2
    exit 1
  fi
  mv "$BIN" "$REAL"
  cat >"$BIN" <<'WRAP'
#!/usr/bin/env bash
REAL="$(dirname "$0")/next.real"
if [[ "$1" == "build" ]]; then
  exec "$REAL" build --webpack "${@:2}"
fi
exec "$REAL" "$@"
WRAP
  chmod +x "$BIN"
fi
