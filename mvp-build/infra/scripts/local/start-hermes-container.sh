#!/usr/bin/env bash
set -euo pipefail

# Invoked by Manager's provisioner with cwd = generated Hermes profile dir.
profile_dir="${1:-$PWD}"
if [[ ! -f "$profile_dir/.env" ]]; then
  echo "profile .env not found: $profile_dir" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$profile_dir/.env"
set +a

version="${HERMES_VERSION:-0.18.0}"
image="${HERMES_DOCKER_IMAGE:-hermes-agent:${version}}"
container="amtech-hermes-${EMPLOYEE_ID:-$(basename "$profile_dir")}"
port="${API_SERVER_PORT:?API_SERVER_PORT missing from profile .env}"
workspace="${WORKSPACE_DIR:-}"
network="${HERMES_DOCKER_NETWORK:-bridge}"

docker image inspect "$image" >/dev/null
docker rm -f "$container" >/dev/null 2>&1 || true
if [[ "$network" != "bridge" ]]; then
  docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
fi

network_args=(--network "$network")
if [[ "$network" != "bridge" ]]; then
  network_args+=(--network-alias "$container")
fi

mount_args=(-v "$profile_dir:/opt/data")
if [[ -n "$workspace" ]]; then
  mkdir -p "$workspace"
  mount_args+=(-v "$workspace:$workspace")
fi

security_args=(
  --cap-drop=ALL
  --security-opt=no-new-privileges
  --pids-limit="${HERMES_CONTAINER_PIDS_LIMIT:-256}"
  --restart="${HERMES_CONTAINER_RESTART:-unless-stopped}"
  --label="com.amtech.kind=employee-runtime"
  --label="com.amtech.account_id=${ACCOUNT_ID:-unknown}"
  --label="com.amtech.employee_id=${EMPLOYEE_ID:-unknown}"
  --label="com.amtech.profile_id=client_${EMPLOYEE_ID:-unknown}"
  --log-driver="${HERMES_LOG_DRIVER:-local}"
  --log-opt="max-size=${HERMES_LOG_MAX_SIZE:-10m}"
  --log-opt="max-file=${HERMES_LOG_MAX_FILE:-5}"
)
IFS=',' read -r -a cap_adds <<< "${HERMES_CONTAINER_CAP_ADD:-CHOWN,SETUID,SETGID,FOWNER,DAC_OVERRIDE}"
for cap in "${cap_adds[@]}"; do
  if [[ -n "$cap" ]]; then
    security_args+=(--cap-add="$cap")
  fi
done
if [[ -n "${HERMES_CONTAINER_MEMORY:-1g}" ]]; then
  security_args+=(--memory="${HERMES_CONTAINER_MEMORY:-1g}")
fi
if [[ -n "${HERMES_CONTAINER_CPUS:-1}" ]]; then
  security_args+=(--cpus="${HERMES_CONTAINER_CPUS:-1}")
fi

docker run -d \
  --name "$container" \
  "${security_args[@]}" \
  "${network_args[@]}" \
  --add-host=host.docker.internal:host-gateway \
  --env-file "$profile_dir/.env" \
  -e "HERMES_UID=$(id -u)" \
  -e "HERMES_GID=$(id -g)" \
  -e "API_SERVER_HOST=0.0.0.0" \
  -e "MANAGER_API_ORIGIN=${DOCKER_MANAGER_API_ORIGIN:-http://host.docker.internal:8080}" \
  -e "MANAGER_BASE_URL=${DOCKER_MANAGER_BASE_URL:-http://host.docker.internal:8080}" \
  -p "127.0.0.1:${port}:${port}" \
  "${mount_args[@]}" \
  "$image" gateway run --no-supervise --replace -q

echo "container:$container port:$port"
