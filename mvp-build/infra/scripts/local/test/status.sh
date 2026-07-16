#!/usr/bin/env bash
# Token-efficient health of the whole live-test stack in one compact block.
# Prints service codes, provider/model wiring, employee containers, and per-employee
# tool-wiring. Loads the same selective local + provider env as live:up.
# Run:  bash infra/scripts/local/test/status.sh   (or: npm run live:status)
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$HERE/_lib.sh"
load_env

m="$(http_code http://localhost:8080/health)"; w="$(http_code http://localhost:3000/)"
if [ "${LOCAL_MODEL_BRIDGE:-}" = "1" ]; then
  b="$(http_code http://localhost:8091/)"
  model="bridge:8091=$b worker=$(worker_count)xHaiku"
else
  model="provider=${HERMES_MODEL_PROVIDER:-default} model=${HERMES_MODEL_DEFAULT:-claude-opus-4-8}"
fi
echo "STACK  $model  manager:8080=$m  web:3000=$w   (200=healthy, 000=down)"

echo "EMPLOYEE CONTAINERS:"
found=0
while IFS=$'\t' read -r name stat ports; do
  [ -z "$name" ] && continue
  found=1
  emp="${name#amtech-hermes-}"
  pdir="$(emp_profile_dir "$emp")"
  if grep -q "mcp_servers" "$pdir/config.yaml" 2>/dev/null && grep -q "amtech_manager" "$pdir/config.yaml" 2>/dev/null; then
    tools="tools:MCP-wired"
  else
    tools="tools:NONE(reprovision needed)"
  fi
  echo "  $emp  [$stat]  $ports  $tools"
done < <(docker ps -a --filter "name=amtech-hermes-" --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null)
[ "$found" = 0 ] && echo "  (none)"

echo "HINT  log in + open a webchat:  http://localhost:3000/api/dev/login?employeeId=<employeeId>"
