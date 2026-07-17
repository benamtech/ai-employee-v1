#!/usr/bin/env bash
set -euo pipefail

# Host-provisioner-only runtime launcher. All image, command, network, mount,
# capability, and environment choices are fixed here; callers supply no Docker args.
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
employee_id="${EMPLOYEE_ID:?EMPLOYEE_ID missing from profile .env}"
container="amtech-hermes-${employee_id}"
network="amtech-employee-${employee_id}"
port="${API_SERVER_PORT:?API_SERVER_PORT missing from profile .env}"
workspace="${WORKSPACE_DIR:?WORKSPACE_DIR missing from profile .env}"

case "$image" in
  hermes-agent:*|ghcr.io/nousresearch/hermes-agent:*) ;;
  *) echo "Hermes image is not allowlisted: $image" >&2; exit 1 ;;
esac

[[ "$employee_id" =~ ^emp_[A-Za-z0-9_-]+$ ]] || { echo "invalid employee id" >&2; exit 1; }
[[ "$port" =~ ^[0-9]{4,5}$ ]] || { echo "invalid gateway port" >&2; exit 1; }

docker image inspect "$image" >/dev/null
docker rm -f "$container" >/dev/null 2>&1 || true
docker network rm "$network" >/dev/null 2>&1 || true
# Internal bridge prevents peer/control-plane reachability. Explicit host-gateway
# routing below is the narrow escape hatch for host-private Manager/model gateway
# endpoints that require employee-scoped credentials.
docker network create --driver bridge --internal \
  --label="com.amtech.kind=employee-network" \
  --label="com.amtech.employee_id=${employee_id}" \
  "$network" >/dev/null

mkdir -p "$workspace"

security_args=(
  --cap-drop=ALL
  --cap-add=CHOWN
  --cap-add=SETUID
  --cap-add=SETGID
  --cap-add=FOWNER
  --cap-add=DAC_OVERRIDE
  --security-opt=no-new-privileges
  --pids-limit=256
  --memory="${HERMES_CONTAINER_MEMORY:-1g}"
  --cpus="${HERMES_CONTAINER_CPUS:-1}"
  --restart=unless-stopped
  --read-only
  --label="com.amtech.kind=employee-runtime"
  --label="com.amtech.account_id=${ACCOUNT_ID:-unknown}"
  --label="com.amtech.employee_id=${employee_id}"
  --label="com.amtech.profile_id=client_${employee_id}"
  --label="com.amtech.model_gateway_credential_version=${MODEL_GATEWAY_CREDENTIAL_VERSION:-unknown}"
  --log-driver=local
  --log-opt=max-size=10m
  --log-opt=max-file=5
)

docker run -d \
  --name "$container" \
  "${security_args[@]}" \
  --network "$network" \
  --add-host=host.docker.internal:host-gateway \
  --env-file "$profile_dir/.env" \
  -e "HERMES_UID=$(id -u)" \
  -e "HERMES_GID=$(id -g)" \
  -e "API_SERVER_HOST=0.0.0.0" \
  -e "WORKSPACE_DIR=/workspace" \
  -v "$profile_dir:/opt/data:ro" \
  -v "$profile_dir:/opt/amtech/profile:ro" \
  -v "$workspace:/workspace" \
  --tmpfs /opt/amtech/secrets:rw,nosuid,nodev,noexec,size=16m,mode=0700 \
  --tmpfs /run/amtech:rw,nosuid,nodev,noexec,size=32m,mode=0750 \
  --tmpfs /tmp:rw,nosuid,nodev,size=256m,mode=1777 \
  -p "127.0.0.1:${port}:${port}" \
  "$image" gateway run --no-supervise --replace -q

echo "container:$container network:$network loopback_port:$port"
