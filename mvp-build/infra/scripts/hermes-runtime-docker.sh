#!/usr/bin/env bash
#
# Per-employee Hermes runtime starter (Docker backend) — the VPS-faithful path.
#
# Invoked by the Manager provisioner via HERMES_RUNTIME_COMMAND. runRuntimeStart()
# runs this with cwd = the rendered profile dir (generated_path), which contains
# profile-build-params.json (written by renderProfilePackage). We read the port,
# api-server key, and ids from there, seed an isolated Hermes home, and start one
# container per employee on its own port with the OpenAI-compatible API server on.
#
# One container == one employee == one gateway port, exactly like production. The
# only thing skipped locally is Twilio SMS (Manager owns SMS ingress anyway).
#
# Requirements: docker (image `hermes-agent` built from ~/.hermes/hermes-agent),
# a seed Hermes home with a working model/provider config + keys (default ~/.hermes),
# node (for JSON parsing), curl.
#
set -euo pipefail

log() { echo "[hermes-runtime-docker] $*" >&2; }

PARAMS="$PWD/profile-build-params.json"
[ -f "$PARAMS" ] || { log "missing $PARAMS (run from a rendered profile dir)"; exit 1; }

read_param() { node -e "process.stdout.write(String(require('$PARAMS').$1 ?? ''))"; }

PORT="$(read_param gateway_port)"
APIKEY="$(read_param api_server_key)"
EMP="$(read_param employee_id)"
CLIENT="$(read_param client_id)"
PROFILE_ID="client_${EMP}"

[ -n "$PORT" ] && [ -n "$APIKEY" ] && [ -n "$EMP" ] || { log "port/api_server_key/employee_id missing in params"; exit 1; }

IMAGE="${HERMES_DOCKER_IMAGE:-hermes-agent}"
SEED_HOME="${HERMES_SEED_HOME:-$HOME/.hermes}"
CLIENTS_DIR="${AMTECH_CLIENTS_DIR:-$HOME/amtech/clients}"
DATA_DIR="${CLIENTS_DIR}/${EMP}/hermes-home"
CONTAINER="hermes-${EMP}"

log "employee=$EMP port=$PORT container=$CONTAINER data=$DATA_DIR"

# --- Seed an isolated per-employee Hermes home (first run only) ---------------
# Copy the operator's working machine config (model + provider setup) so the
# employee's API server can actually reach an LLM, but keep sessions/state fresh
# and isolated per employee. Provider keys come from the seed home's .env.
mkdir -p "$DATA_DIR"
if [ ! -f "$DATA_DIR/config.yaml" ]; then
  [ -f "$SEED_HOME/config.yaml" ] && cp "$SEED_HOME/config.yaml" "$DATA_DIR/config.yaml" || log "WARN: no seed config.yaml at $SEED_HOME"
fi

# Per-employee .env: provider keys carried over from the seed home + the API
# server config keyed to THIS employee's port and generated key.
{
  if [ -f "$SEED_HOME/.env" ]; then
    grep -E '^(OPENAI_API_KEY|OPENROUTER_API_KEY|ANTHROPIC_API_KEY|XAI_API_KEY|OPENAI_BASE_URL|OPENROUTER_BASE_URL)=' "$SEED_HOME/.env" || true
  fi
  echo "API_SERVER_ENABLED=true"
  echo "API_SERVER_KEY=${APIKEY}"
  echo "API_SERVER_PORT=${PORT}"
  echo "API_SERVER_HOST=127.0.0.1"
} > "$DATA_DIR/.env"

# Overlay the rendered profile (SOUL, skills, workspace, profile config) as an
# installed Hermes profile inside the isolated home.
PROFILE_DIR="${DATA_DIR}/profiles/${PROFILE_ID}"
mkdir -p "$PROFILE_DIR"
for item in SOUL.md config.yaml skills workspace distribution.yaml; do
  [ -e "$PWD/$item" ] && cp -r "$PWD/$item" "$PROFILE_DIR/" || true
done

# --- Start (or restart) the container ---------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "docker not found — install docker and build the hermes-agent image first"; exit 1
fi

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
# API_SERVER_* are passed as -e (in addition to the home .env) so they survive
# the container's s6 env handling and reliably enable the OpenAI-compatible API
# server on this employee's port.
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --network host \
  -e HERMES_UID="$(id -u)" \
  -e HERMES_GID="$(id -g)" \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_KEY="${APIKEY}" \
  -e API_SERVER_PORT="${PORT}" \
  -e API_SERVER_HOST=127.0.0.1 \
  -v "${DATA_DIR}:/opt/data" \
  "$IMAGE" gateway run >/dev/null

# --- Wait for the API server health endpoint --------------------------------
for i in $(seq 1 45); do
  if curl -fsS -H "Authorization: Bearer ${APIKEY}" "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    log "container up; /health ok on :${PORT}"
    echo "container:${CONTAINER} port:${PORT} health:ok"
    exit 0
  fi
  sleep 2
done

log "container started but /health did not come up on :${PORT} within ~90s"
log "inspect with: docker logs ${CONTAINER}"
echo "container:${CONTAINER} port:${PORT} health:timeout"
exit 1
