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

image="${HERMES_DOCKER_IMAGE:-hermes-agent}"
container="amtech-hermes-${EMPLOYEE_ID:-$(basename "$profile_dir")}"
port="${API_SERVER_PORT:?API_SERVER_PORT missing from profile .env}"
workspace="${WORKSPACE_DIR:-}"

docker image inspect "$image" >/dev/null
docker rm -f "$container" >/dev/null 2>&1 || true

mount_args=(-v "$profile_dir:/opt/data")
if [[ -n "$workspace" ]]; then
  mkdir -p "$workspace"
  mount_args+=(-v "$workspace:$workspace")
fi

docker run -d \
  --name "$container" \
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
