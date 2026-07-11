# Pod Alpha orchestration substrate proven on a real Docker host: lifecycle + DNS/routing

Date: 2026-07-11 ~19:00 EDT (proof JSONs stamped ~18:25-18:43 UTC)
Status: orchestration substrate (compose core + per-employee fleet DNS/routing/lifecycle) **proven on a real
Docker host** (this dev box, Docker Engine 29.5.2 / containerd v2.3.1). NOT runtime-accepted for the LLM tool
loop; crash-recovery + real-VPS + capacity-at-scale + egress-apply remain `pending`.
Branch: `infra/pod-alpha-lifecycle-dns-routing` (off `main`; not committed/pushed).

## Framing (founder steer this session)

The prior handoffs framed the blocker as `local:tool-loop-proof` via the **model bridge**. Founder was
explicit: **the model bridge is dead; this pass is production infrastructure engineering and needs no LLM.**
The work is provisioning / tearing down / reinstating employee containers, running many concurrently, and
proving Docker DNS + Caddy routing between the fixed core and the dynamic fleet. The employee's intelligence
is not exercised; a funded provider key is a separate, later concern.

## Root-cause diagnosis (the reframe that unblocked everything)

- **The exit-111 crash-loop was a stale orphan, not a live launcher bug.** The crash-looping employee had
  `CapAdd=[]` (launched by the *old* launcher before the SETGID cap-add); the running one had the full cap set
  (`CAP_SETGID` etc.) and boots fine. The current `start-hermes-container.sh` cap set is correct — proven by a
  running container. Fix was to GC/relaunch orphans, not change caps.
- **DNS/routing was unwired because `amtech_runtime` didn't exist** and `HERMES_DOCKER_NETWORK` was empty in
  `.env`, so employees defaulted to the `bridge` network with no alias.
- **Image pin mismatch**: only `hermes-agent:latest` existed; config pins `:0.18.0`. The image self-reports
  `Hermes Agent v0.18.0`, so tagging `latest`->`0.18.0` is truthful.

## What was done on-host (all real, this box)

1. Created `amtech_runtime` user-defined bridge; marked it `external: true` in the compose file (host-owned so
   it outlives `compose down` and both core + provisioner-launched employees share it).
2. Pinned `hermes-agent:0.18.0` (verified image reports v0.18.0). Wired `HERMES_DOCKER_NETWORK=amtech_runtime`
   into `.env` (launcher inherits it from the Manager env).
3. GC'd the 9 stale pre-fix orphan containers (all `caps=[]`); their profile dirs persist on disk (reversible).
4. Relaunched the live employee onto `amtech_runtime`: alias `amtech-hermes-<id>` resolves (`getent` -> 172.18.0.2),
   gateway reachable from a peer container (HTTP 404 = up), and **employee->manager DNS proven**
   (`http://manager:8080/health` = 200 from a peer on the network).
5. Built the compose core images (manager 1.45GB tsc; web 405MB Next standalone) and brought up the full stack:
   manager/web/caddy all `healthy`, correct start-order (manager->web->caddy), manager 65/65 tools; all three +
   the 3 employees joined `amtech_runtime`.
6. Captured proofs in `infra/proofs/` (real container ids/host evidence):
   - `deploy-smoke-…18-29-37Z.json` — **PASS 8/8**: manager/web health, caddy 308 (reachable), 3x compose health,
     `caddy validate`, **`docker-dns:employee-alias`** (Caddy resolves the employee by Docker DNS).
   - `caddy-proof-…18-25-11Z.json` — **PASS**: snippet validate / bad-snippet reject / rollback / old-route liveness.
   - `pod-alpha-capacity-…18-38-41Z.json` — **PASS tier 5**: 5 concurrent employees, 0 DNS failures, recommended
     cap 4. Honestly small: 4-CPU/8GB dev box, ~4GB free — NOT the real 20-25 Pod Alpha number.
   - `egress-policy-…18-43-09Z.json` — **dry_run**: default-deny `DOCKER-USER` rule design + resolved manager
     (172.18.0.3:8080) and employee IPs.
   - Lifecycle via `ops:employee-lifecycle`: stop -> exited, gc -> removed exited labeled containers, restart -> running.

## Script/config fixes (tracked, on branch)

- `infra/deploy/docker-compose.yml`: `amtech_runtime` -> `external: true`.
- `infra/scripts/deploy-smoke.mjs`: `httpCheck` gains `proxy` mode using `redirect: "manual"` — a reverse proxy
  that enforces HTTPS answers :80 with a 308; following it chased into a certless HTTPS leg (ACME NXDOMAIN on a
  host without public DNS) and false-failed. A 3xx from the proxy now counts as reachable.
- `infra/scripts/capacity-pod-alpha.mjs`: (a) `pssKb` guards the `/proc/<pid>/smaps_rollup` read in try/catch —
  container PIDs are root in another uid namespace, so an unprivileged operator gets EACCES; the unguarded read
  threw and zeroed the whole benchmark. Now degrades to null. (b) DNS probe image `busybox:1.36` -> `alpine:latest`
  (busybox ships no `getent`, so every DNS check false-failed). (c) `httpLatency` redirect-tolerant like deploy-smoke.
- `.env` (local, gitignored): appended `HERMES_DOCKER_NETWORK=amtech_runtime`. `infra/deploy/.env.production`
  generated (gitignored) by overlaying real Supabase/signing/token values from root `.env`.

## Deferred / NOT proven (honest)

- **Crash/reboot auto-recovery.** Launcher sets `--restart=unless-stopped` (verified) and core services use
  `restart: unless-stopped`, but this **sandbox daemon does not fire restart-on-kill even for a plain control
  container** (`docker run --restart=unless-stopped alpine …` stays exited after `docker kill`). So the policy is
  correctly configured but auto-recovery is **`pending` real-VPS proof** — environment limitation, not a design gap.
- **Egress `--apply`** needs root (no passwordless sudo here) and would sever the proven employee->manager path on
  this shared box; only the dry-run design was captured. Provider-domain allowlist proxy still owed before paid pilots.
- **Real capacity number** needs a 64GB node (and root for PSS). Tier 5 here proves the harness + multi-container
  DNS only.
- **No LLM tool loop / provider acceptance** — out of scope this pass, per the founder steer.

## Baseline

Passed: `typecheck`; focused `test:unit` (`ops-proof-scripts` + `caddy-activation`, 9 tests); `lint`; `build`.
Full `test:unit` still blocked by the pre-existing `gmail-pubsub.test.ts` 5s timeout — ran focused suites.

## Carry-forward

- On the real VPS: `docker network create amtech_runtime`; `docker compose … up -d --build`; run `deploy:smoke`,
  `ops:caddy-proof`, `ops:reprovision-scoped-mcp`, `capacity:pod-alpha` at real tiers, `ops:egress-policy --apply`;
  prove reboot recovery by bouncing the host and confirming core + employees return. Then capture the same proof
  JSONs on-host.
- Model-bridge cleanup (dead code prune) still deferred — didn't touch it this pass.
- Manager mounts `/var/run/docker.sock` (high blast radius) — narrow provisioner/Docker-proxy still a P1 hardening.
