#!/usr/bin/env bash
# [cavedin] Fails if an upstream merge reintroduced telemetry. Run after every sync.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
need() { grep -q "$2" "$1" || { echo "MISSING kill switch in $1: $2"; fail=1; }; }
need packages/cli/src/index.ts 'const CAVEDIN_NO_TELEMETRY = true;'
need packages/cli/src/index.ts 'process.env.DO_NOT_TRACK = "1";'
need packages/cli/src/index.ts 'if (CAVEDIN_NO_TELEMETRY) return { state: "off"'
[ "$(grep -c 'if (CAVEDIN_NO_TELEMETRY) return Promise.resolve(); // \[cavedin\]' packages/cli/src/index.ts)" -eq 2 ] \
  || { echo "MISSING no-op senders (emitTelemetryEvents/postTelemetry)"; fail=1; }
need proxy/internal/cloudlink/link.go 'return true // \[cavedin\]'
# Any telemetry endpoint in shipped source (server-side supabase/ functions are not shipped).
if git grep -n -E 'supabase\.co/functions/v1/[a-z-]*telemetry|posthog|sentry\.io|mixpanel|amplitude\.com' -- \
     packages installer src hooks proxy engine mcp plugins integrations ':!**/*test*' ':!**/*.md' ; then
  echo "Telemetry endpoint found above"; fail=1
fi
# New emitters that bypass the gate.
if git grep -n -E 'fetch\(\s*(TELEMETRY_URL|process\.env\.CAVEMAN_TELEMETRY_URL)' -- packages; then fail=1; fi
[ $fail -eq 0 ] && echo "cavedin: no telemetry ✓"
exit $fail
