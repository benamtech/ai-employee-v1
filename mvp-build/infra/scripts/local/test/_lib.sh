#!/usr/bin/env bash
# Shared helpers for the live-test toolkit (infra/scripts/local/test/*).
# Source this from the other scripts; not meant to run standalone.
#
# The local stack has NO funded model key. The "model" is a persistent Claude Code
# Haiku instance behind the agent-in-the-loop bridge (the "you-are-the-LLM" design,
# infra/local/agent-model-bridge.md): the bridge parks each /v1/chat/completions
# request and the ONE warm Haiku worker answers it. Onboarding AND every live
# employee turn route through it, so the worker MUST be up for any model call.

# mvp-build root (this file lives at infra/scripts/local/test/_lib.sh -> 4 up).
MVP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
RUN="$MVP_ROOT/infra/.local/test/run"
LOGS="$MVP_ROOT/infra/.local/test/logs"
mkdir -p "$RUN" "$LOGS"

log() { echo "[live] $*"; }
err() { echo "[live][ERROR] $*" >&2; }

# Load the gitignored .env and enable dev owner-login. The old no-key model
# bridge is opt-in only via LOCAL_MODEL_BRIDGE=1; otherwise live provider env
# from .env is preserved for both onboarding and employee runtimes.
load_env() {
  set -a
  # shellcheck disable=SC1090
  source "$MVP_ROOT/.env"
  set +a
  export DEV_OWNER_LOGIN="1"
  if [ "${LOCAL_MODEL_BRIDGE:-}" = "1" ]; then
    export ORCHESTRATOR_API_BASE_URL="http://localhost:8091/v1"
    export ORCHESTRATOR_API_KEY="bridge-local"
    export ORCHESTRATOR_MODEL="bridge-agent"
    export HERMES_MODEL_PROVIDER="custom"
    export HERMES_MODEL_BASE_URL="http://host.docker.internal:8091/v1"
    export HERMES_MODEL_DEFAULT="bridge-agent"
  fi
}

http_code() { curl -s --max-time 3 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo "000"; }

# wait_code URL EXPECTED MAXSECS -> returns 0 when the endpoint returns EXPECTED.
wait_code() {
  local url="$1" want="$2" max="${3:-30}" i code
  for ((i = 0; i < max; i++)); do
    code="$(http_code "$url")"
    [ "$code" = "$want" ] && return 0
    sleep 1
  done
  return 1
}

# True when the single warm Haiku model instance is alive (the real LLM).
worker_running() { pgrep -f "input-format stream-json.*claude-haiku-4-5" >/dev/null 2>&1; }
worker_count()   { pgrep -f "input-format stream-json.*claude-haiku-4-5" 2>/dev/null | grep -vc '^$'; }

# Rebuild @amtech/shared if its dist is stale/missing. On Node 26 a stale dist is
# the usual cause of "@amtech/shared does not provide an export named getToolSchema".
ensure_shared_built() {
  if ! grep -q "getToolSchema" "$MVP_ROOT/packages/shared/dist/tool-schemas.js" 2>/dev/null; then
    log "building @amtech/shared (stale/missing dist)..."
    (cd "$MVP_ROOT" && npm run build --workspace @amtech/shared >/dev/null 2>&1) \
      || err "shared build failed"
  fi
}

# daemon NAME "command string" — start a detached, session-isolated background
# service (survives the caller/agent shell), logging to infra/.local/test/logs.
daemon() {
  local name="$1" cmd="$2"
  ( cd "$MVP_ROOT" && setsid bash -c "$cmd" </dev/null >>"$LOGS/$name.log" 2>&1 & echo $! >"$RUN/$name.pid" )
  log "$name starting (pid $(cat "$RUN/$name.pid" 2>/dev/null), log infra/.local/test/logs/$name.log)"
}

# stop_named NAME — kill a daemon by its pidfile (whole session), best-effort.
stop_named() {
  local name="$1" pid
  pid="$(cat "$RUN/$name.pid" 2>/dev/null || true)"
  [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null || true
  rm -f "$RUN/$name.pid" 2>/dev/null || true
}

# Profile dir + container name for an employee id (host paths).
emp_profile_dir() { echo "${HERMES_HOME:-$HOME/.hermes}/profiles/client_$1"; }
emp_container()   { echo "amtech-hermes-$1"; }
emp_port() { # read the rendered gateway port from the employee profile .env
  local pdir; pdir="$(emp_profile_dir "$1")"
  grep -E '^API_SERVER_PORT=' "$pdir/.env" 2>/dev/null | head -1 | cut -d= -f2
}
