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

# Hermes v0.18.0 is published under the immutable upstream release tag v2026.7.1.
# Production may override with the same tag plus an OCI digest.
version="${HERMES_VERSION:-v2026.7.1}"
image="${HERMES_DOCKER_IMAGE:-nousresearch/hermes-agent:${version}}"
employee_id="${EMPLOYEE_ID:?EMPLOYEE_ID missing from profile .env}"
container="amtech-hermes-${employee_id}"
network="amtech-employee-${employee_id}"
port="${API_SERVER_PORT:?API_SERVER_PORT missing from profile .env}"
workspace="${WORKSPACE_DIR:?WORKSPACE_DIR missing from profile .env}"
model_gateway_url="${MODEL_GATEWAY_URL:?MODEL_GATEWAY_URL missing from profile .env}"
model_gateway_health_url="${model_gateway_url%%/v1*}/health"
runtime_health_url="http://127.0.0.1:${port}/health"
manager_container="${MANAGER_CONTAINER_NAME:-}"
model_gateway_container="${MODEL_GATEWAY_CONTAINER_NAME:-}"
runtime_data="${HERMES_RUNTIME_DATA_DIR:-$(dirname "$workspace")/runtime-data/${employee_id}}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mvp_root="$(cd "$script_dir/../../.." && pwd)"

case "$image" in
  hermes-agent:*|nousresearch/hermes-agent:*|ghcr.io/nousresearch/hermes-agent:*) ;;
  *) echo "Hermes image is not allowlisted: $image" >&2; exit 1 ;;
esac

[[ "$employee_id" =~ ^emp_[A-Za-z0-9_-]+$ ]] || { echo "invalid employee id" >&2; exit 1; }
[[ "$port" =~ ^[0-9]{4,5}$ ]] || { echo "invalid gateway port" >&2; exit 1; }
for peer in "$manager_container" "$model_gateway_container"; do
  [[ -z "$peer" || "$peer" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]] || {
    echo "invalid control-plane container name: $peer" >&2
    exit 1
  }
done

# Production profiles use network-scoped aliases. Local/dev profiles may still use
# host.docker.internal, in which case the bridge is intentionally not --internal.
peer_isolated=0
if [[ "$model_gateway_url" == "http://amtech-model-gateway:"*"/v1" ]]; then
  [[ -n "$manager_container" && -n "$model_gateway_container" ]] || {
    echo "production employee network peers are not configured" >&2
    exit 1
  }
  peer_isolated=1
elif [[ "$model_gateway_url" != "http://host.docker.internal:"*"/v1" ]]; then
  echo "employee model gateway must use a scoped container alias or local host-gateway route" >&2
  exit 1
fi

# Tear down the prior topology in dependency order. A Docker network cannot be
# removed while Manager or Model Gateway remain attached to it.
docker rm -f "$container" >/dev/null 2>&1 || true
if [[ -n "$manager_container" ]]; then
  docker network disconnect -f "$network" "$manager_container" >/dev/null 2>&1 || true
fi
if [[ -n "$model_gateway_container" ]]; then
  docker network disconnect -f "$network" "$model_gateway_container" >/dev/null 2>&1 || true
fi
docker network rm "$network" >/dev/null 2>&1 || true

network_args=(--driver bridge)
if [[ "$peer_isolated" == "1" ]]; then
  network_args+=(--internal)
fi
docker network create "${network_args[@]}" \
  --label="com.amtech.kind=employee-network" \
  --label="com.amtech.employee_id=${employee_id}" \
  "$network" >/dev/null

# Each employee receives a distinct bridge. Only the shared Manager and Model
# Gateway containers are attached to that employee's bridge, with stable aliases.
# Employees therefore do not share a network with one another.
if [[ "$peer_isolated" == "1" ]]; then
  docker network connect --alias amtech-manager --gw-priority -1 "$network" "$manager_container"
  docker network connect --alias amtech-model-gateway --gw-priority -1 "$network" "$model_gateway_container"
fi

# The rendered profile is immutable authority/configuration. Hermes' own sessions,
# memory, checkpoints, caches, lazy dependencies, and plugins live in a distinct
# employee-scoped writable data directory mounted at the upstream HERMES_HOME.
mkdir -p "$workspace" "$runtime_data"
if [[ ! -f "$runtime_data/.amtech-runtime-initialized" ]]; then
  cp -a "$profile_dir/." "$runtime_data/"
  touch "$runtime_data/.amtech-runtime-initialized"
fi
# Refresh only profile-owned inputs. Never overwrite runtime-owned memory/session
# state during restart or credential rotation.
for path in config.yaml .env hooks prompts skills profile-build-params.json; do
  if [[ -e "$profile_dir/$path" ]]; then
    rm -rf "$runtime_data/$path"
    cp -a "$profile_dir/$path" "$runtime_data/$path"
  fi
done

# Package plugins were historically copied to a host-global Hermes directory that
# is not mounted into an employee container. Materialize only the current profile
# package's plugin directories into this employee's data root. A marker removes
# stale AMTECH-managed package plugins without touching runtime-installed plugins.
package_key=""
if [[ -f "$profile_dir/profile-build-params.json" ]]; then
  package_key="$(node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(typeof p.profile_package_key==="string"?p.profile_package_key:"")' "$profile_dir/profile-build-params.json")"
fi
plugin_source=""
if [[ "$package_key" == "contractor_estimator" ]]; then
  plugin_source="$mvp_root/packages/agent-template/plugins"
elif [[ "$package_key" =~ ^[A-Za-z0-9_-]+$ ]]; then
  plugin_source="$mvp_root/packages/profile-packages/$package_key/plugins"
fi
plugin_marker="$runtime_data/.amtech-package-plugins"
if [[ -f "$plugin_marker" ]]; then
  while IFS= read -r prior_plugin; do
    [[ "$prior_plugin" =~ ^[A-Za-z0-9_.-]+$ ]] || continue
    rm -rf "$runtime_data/plugins/$prior_plugin"
  done < "$plugin_marker"
fi
: > "$plugin_marker"
if [[ -n "$plugin_source" && -d "$plugin_source" ]]; then
  mkdir -p "$runtime_data/plugins"
  for plugin_dir in "$plugin_source"/*; do
    [[ -d "$plugin_dir" ]] || continue
    plugin_name="$(basename "$plugin_dir")"
    [[ "$plugin_name" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "invalid plugin directory name: $plugin_name" >&2; exit 1; }
    rm -rf "$runtime_data/plugins/$plugin_name"
    cp -a "$plugin_dir" "$runtime_data/plugins/$plugin_name"
    printf '%s\n' "$plugin_name" >> "$plugin_marker"
  done
fi
chmod 700 "$runtime_data"

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

host_route_args=()
if [[ "$peer_isolated" != "1" ]]; then
  host_route_args+=(--add-host=host.docker.internal:host-gateway)
fi

docker run -d \
  --name "$container" \
  "${security_args[@]}" \
  --network "$network" \
  "${host_route_args[@]}" \
  --env-file "$profile_dir/.env" \
  -e "HERMES_UID=$(id -u)" \
  -e "HERMES_GID=$(id -g)" \
  -e "API_SERVER_HOST=0.0.0.0" \
  -e "WORKSPACE_DIR=/workspace" \
  -v "$runtime_data:/opt/data" \
  -v "$profile_dir:/opt/amtech/profile:ro" \
  -v "$workspace:/workspace" \
  --tmpfs /opt/amtech/secrets:rw,nosuid,nodev,noexec,size=16m,mode=0700 \
  --tmpfs /run/amtech:rw,nosuid,nodev,noexec,size=32m,mode=0750 \
  --tmpfs /tmp:rw,nosuid,nodev,size=256m,mode=1777 \
  -p "127.0.0.1:${port}:${port}" \
  "$image" gateway run --no-supervise --replace -q

# Runtime acceptance is fail-closed: the actual employee container must reach its
# scoped model gateway peer and its own Hermes API must report healthy before the
# reconciler may activate public routing or provider bindings.
model_gateway_reachable=0
runtime_healthy=0
for _ in $(seq 1 "${RUNTIME_ACCEPTANCE_ATTEMPTS:-30}"); do
  if [[ "$model_gateway_reachable" != "1" ]] && docker exec "$container" python3 -c \
    'import os, urllib.request; u=os.environ["MODEL_GATEWAY_URL"].split("/v1",1)[0]+"/health"; r=urllib.request.urlopen(u, timeout=3); print(r.status); raise SystemExit(0 if r.status < 500 else 1)' \
    >/dev/null 2>&1; then
    model_gateway_reachable=1
  fi
  if [[ "$runtime_healthy" != "1" ]] && docker exec "$container" python3 -c \
    'import os, urllib.request; u="http://127.0.0.1:"+os.environ["API_SERVER_PORT"]+"/health"; r=urllib.request.urlopen(u, timeout=3); print(r.status); raise SystemExit(0 if r.status < 500 else 1)' \
    >/dev/null 2>&1; then
    runtime_healthy=1
  fi
  if [[ "$model_gateway_reachable" == "1" && "$runtime_healthy" == "1" ]]; then
    break
  fi
  sleep 1
done

if [[ "$model_gateway_reachable" != "1" ]]; then
  echo "employee runtime cannot reach scoped model gateway: $model_gateway_health_url" >&2
  docker logs --tail 100 "$container" >&2 || true
  exit 1
fi

if [[ "$runtime_healthy" != "1" ]]; then
  echo "employee runtime health did not pass: $runtime_health_url" >&2
  docker logs --tail 100 "$container" >&2 || true
  exit 1
fi

echo "container:$container network:$network loopback_port:$port runtime_data:$runtime_data runtime_healthy:$runtime_health_url model_gateway_reachable:$model_gateway_health_url isolated:$peer_isolated"
