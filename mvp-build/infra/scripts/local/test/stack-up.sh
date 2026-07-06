#!/usr/bin/env bash
# Bring up the full local live-test stack, detached and idempotent.
#
#   bridge  :8091  agent-in-the-loop model bridge (parks model calls)
#   worker         ONE warm Claude Code Haiku instance = the LLM (you-are-the-LLM)
#   manager :8080  control plane (plain `tsx` — NOT `tsx watch`, which breaks on Node 26)
#   web     :3000  front door + owner Work Surface (/agent/<id>)
#
# Already-running services are left alone. Logs: infra/.local/test/logs/<svc>.log.
# Run:  bash infra/scripts/local/test/stack-up.sh   (or: npm run live:up)
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$HERE/_lib.sh"
cd "$MVP_ROOT"

load_env
ensure_shared_built

# 1. Model bridge (parks /v1/chat/completions on disk).
if [ "$(http_code http://localhost:8091/)" = "200" ]; then
  log "bridge already up :8091"
else
  daemon bridge "npm run local:model-bridge"
  wait_code http://localhost:8091/ 200 20 && log "bridge up :8091" || err "bridge did not answer :8091 (see logs)"
fi

# 2. Warm Haiku worker = the LLM. Must be up before any onboarding/employee model call.
if worker_running; then
  log "worker already up ($(worker_count) warm Haiku instance)"
else
  daemon worker "npm run local:model-bridge-worker"
  for i in $(seq 1 15); do worker_running && break; sleep 1; done
  worker_running && log "worker up (1 warm Haiku, claude-haiku-4-5)" || err "worker did not start a Haiku instance (see logs)"
fi

# 3. Manager control plane — plain tsx (tsx watch v4.22.4 crashes on Node 26).
if [ "$(http_code http://localhost:8080/health)" = "200" ]; then
  log "manager already up :8080"
else
  daemon manager "npx tsx apps/manager/src/server.ts"
  wait_code http://localhost:8080/health 200 30 && log "manager up :8080" || err "manager health never 200 (see logs)"
fi

# 4. Web (Next.js dev).
if [ "$(http_code http://localhost:3000/)" = "200" ]; then
  log "web already up :3000"
else
  daemon web "npm run web:dev"
  wait_code http://localhost:3000/ 200 45 && log "web up :3000" || err "web never 200 (see logs)"
fi

echo
"$HERE/status.sh"
