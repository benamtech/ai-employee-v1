#!/usr/bin/env bash
# Recover a crashed/stale employee Hermes container. Symptom: the gateway won't come
# up after a crash and logs show a foreground-vs-supervised gateway conflict — caused
# by a stale gateway_state.json="running" that makes the container's reconcile start
# a SECOND supervised gateway. This removes the container, marks gateway_state
# stopped (backup at gateway_state.json.stale-bak), and re-runs it cleanly via
# start-hermes-container.sh (fresh `gateway run --no-supervise --replace`).
#
# Bridge + worker MUST be up first — the container makes a model call on boot, and
# with no warm Haiku worker it will time out and crash again (the original failure).
#
# Run:  bash infra/scripts/local/test/employee-recover.sh <employeeId>   (or: npm run live:recover -- <employeeId>)
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$HERE/_lib.sh"
cd "$MVP_ROOT"

emp="${1:-}"
[ -z "$emp" ] && { err "usage: employee-recover.sh <employeeId>"; exit 1; }
load_env
worker_running || err "WARNING: no warm Haiku worker running — run 'npm run live:up' first or the container will crash on its first model call."

container="$(emp_container "$emp")"
profile="$(emp_profile_dir "$emp")"
[ -f "$profile/.env" ] || { err "no profile at $profile (is the employee provisioned?)"; exit 1; }

log "removing container $container"
docker rm -f "$container" >/dev/null 2>&1 || true

if [ -f "$profile/gateway_state.json" ]; then
  log "neutralizing stale gateway_state.json (marking stopped; backup .stale-bak)"
  node -e '
    const fs=require("fs"); const p=process.argv[1];
    try { const s=JSON.parse(fs.readFileSync(p,"utf8"));
      fs.writeFileSync(p+".stale-bak", JSON.stringify(s));
      s.gateway_state="stopped"; s.pid=null; s.exit_reason="recovered_by_operator"; s.restart_requested=false; s.active_agents=0;
      fs.writeFileSync(p, JSON.stringify(s));
    } catch(e){ console.error("(gateway_state edit skipped:", e.message+")"); }
  ' "$profile/gateway_state.json"
fi

log "re-running via start-hermes-container.sh"
bash "$MVP_ROOT/infra/scripts/local/start-hermes-container.sh" "$profile" || { err "start script failed"; exit 1; }

port="$(emp_port "$emp")"
log "waiting for gateway on :$port"
for i in $(seq 1 40); do
  [ "$(http_code "http://localhost:$port/")" != "000" ] && { log "gateway up on :$port (recovered)"; exit 0; }
  [ "$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null)" = "exited" ] && { err "container exited during boot — check: docker logs $container"; exit 1; }
  sleep 2
done
err "gateway did not answer on :$port within timeout — check: docker logs $container"
exit 1
