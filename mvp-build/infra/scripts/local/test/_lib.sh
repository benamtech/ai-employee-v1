#!/usr/bin/env bash
# Shared helpers for the live-test toolkit (infra/scripts/local/test/*).
# Source this from the other scripts; not meant to run standalone.
#
# The local live stack now defaults to real provider env. `load_env` keeps host
# invariants from `.env`, then selectively overlays xAI/Grok-compatible provider
# values from `infra/deploy/.env.production`. The legacy LOCAL_MODEL_BRIDGE=1
# path is still available as a dev shim, but it is not acceptance proof.

# mvp-build root (this file lives at infra/scripts/local/test/_lib.sh -> 4 up).
MVP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
RUN="$MVP_ROOT/infra/.local/test/run"
LOGS="$MVP_ROOT/infra/.local/test/logs"
mkdir -p "$RUN" "$LOGS"

log() { echo "[live] $*"; }
err() { echo "[live][ERROR] $*" >&2; }

# Read one KEY=VALUE from an env file without shell-sourcing command-valued lines.
env_file_value() {
  local path="$1" key="$2" line value
  [ -f "$path" ] || return 1
  line="$(grep -E "^${key}=" "$path" 2>/dev/null | tail -1)" || return 1
  [ -n "$line" ] || return 1
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

# Load local live-test env, then selectively overlay production provider vars.
# Do not import production NODE_ENV or Docker-only origins into the host dev stack:
# /api/dev/login requires non-production, and Web must reach Manager on localhost.
load_env() {
  set -a
  # shellcheck disable=SC1090
  source "$MVP_ROOT/.env"
  set +a

  local deploy_env="$MVP_ROOT/infra/deploy/.env.production" xai_token xai_model
  xai_token="$(env_file_value "$deploy_env" "xai_api_key" || env_file_value "$deploy_env" "XAI_API_TOKEN" || true)"
  xai_model="$(env_file_value "$deploy_env" "xai_model" || env_file_value "$deploy_env" "XAI_MODEL" || true)"
  if [ -n "${xai_token:-}" ]; then
    export XAI_API_TOKEN="$xai_token"
    export XAI_API_KEY="$xai_token"
    export xai_api_key="$xai_token"
    export ORCHESTRATOR_API_KEY="$xai_token"
    export ORCHESTRATOR_PROVIDER="openai_compatible"
    export ORCHESTRATOR_API_BASE_URL="https://api.x.ai/v1"
  fi
  if [ -n "${xai_model:-}" ]; then
    export XAI_MODEL="$xai_model"
    export xai_model="$xai_model"
    export ORCHESTRATOR_MODEL="$xai_model"
    export HERMES_MODEL_DEFAULT="$xai_model"
  fi
  if [ -n "${xai_token:-}" ] || [ -n "${xai_model:-}" ]; then
    export HERMES_MODEL_PROVIDER="openai_compatible"
  fi

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
