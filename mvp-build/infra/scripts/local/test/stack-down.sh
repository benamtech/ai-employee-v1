#!/usr/bin/env bash
# Stop the live-test stack. By default stops the four shells (web, manager, worker,
# bridge). Pass --employees to ALSO stop every amtech-hermes-* container, or
# --employee <id> for just one. Containers stopped cleanly keep their gateway_state.
# Run:  bash infra/scripts/local/test/stack-down.sh [--employees | --employee <id>]
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$HERE/_lib.sh"

for n in web manager worker bridge; do stop_named "$n"; done
# Backstop by pattern in case pidfiles are stale.
pkill -f "npm run web:dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "tsx apps/manager/src/server.ts" 2>/dev/null || true
pkill -f "model-bridge-worker" 2>/dev/null || true
pkill -f "input-format stream-json.*claude-haiku-4-5" 2>/dev/null || true
pkill -f "local:model-bridge" 2>/dev/null || true
pkill -f "model-bridge.mjs" 2>/dev/null || true

case "${1:-}" in
  --employees)
    for c in $(docker ps -q --filter "name=amtech-hermes-" 2>/dev/null); do docker stop "$c" >/dev/null 2>&1 || true; done
    log "stopped all amtech-hermes-* containers"
    ;;
  --employee)
    [ -n "${2:-}" ] && docker stop "$(emp_container "$2")" >/dev/null 2>&1 && log "stopped container for $2" || true
    ;;
esac

sleep 1
log "shells down. bridge:$(http_code http://localhost:8091/) manager:$(http_code http://localhost:8080/health) web:$(http_code http://localhost:3000/) (000=down)"
