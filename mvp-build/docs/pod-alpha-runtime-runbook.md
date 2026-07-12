# Pod Alpha Runtime Runbook

Status: source-wired operator runbook; local/VPS proof still required

This runbook is for the first commercial Pod Alpha host: one bare-metal VPS running the fixed
Compose core (`manager`, `web`, `caddy`) plus resident per-employee Hermes containers. It does not
upgrade runtime or provider acceptance by itself.

## Prerequisites (host-owned runtime network + pinned image)

```bash
docker network create amtech_runtime            # host-owned; compose treats it as external
docker tag hermes-agent:latest hermes-agent:0.18.0   # or `npm run local:build-hermes`; image must self-report v0.18.0
# .env: HERMES_DOCKER_NETWORK=amtech_runtime  (so employees join the shared network with the amtech-hermes-<id> alias)
```

The employee LLM tool loop is **out of scope** for this runbook — it closes on a real provider-backed
Hermes model when funded creds land, not via the (dead) local model bridge. This runbook proves the
**orchestration substrate**: core services, employee lifecycle, and Docker DNS + Caddy routing.

## Proof Order

0. **Cloudflare DNS desired state (safe dry-run first)**
   ```bash
   AMTECH_PUBLIC_IPV4=203.0.113.10 npm run dns:cloudflare:plan -- --mock
   AMTECH_PUBLIC_IPV4=<vps-ip> CLOUDFLARE_API_TOKEN=<scoped-token> npm run dns:cloudflare:plan
   CLOUDFLARE_DNS_APPLY_CONFIRM=amtechai.com npm run dns:cloudflare:apply
   ```
   The script writes `infra/proofs/cloudflare-dns-*.json`. Dry-run prints the desired apex, `www`,
   `api`, `agent`, and static `*.agents` records and never mutates Cloudflare. Apply requires both
   `--apply` and `CLOUDFLARE_DNS_APPLY_CONFIRM=amtechai.com`; token values are redacted from proof JSON.
   AAAA records are omitted unless `CLOUDFLARE_ENABLE_AAAA=1` and `AMTECH_PUBLIC_IPV6` are set after
   Docker/host dual-stack is proven.

1. **Compose smoke**
   ```bash
   docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build
   npm run deploy:smoke
   ```
   `deploy:smoke` writes `infra/proofs/deploy-smoke-*.json` with Manager/Web/Caddy health, Caddy
   validation, and optional employee DNS alias proof via `EMPLOYEE_DNS_ALIAS=amtech-hermes-emp_...`.
   Caddy answers :80 with a 308→HTTPS (auto-HTTPS); the smoke treats that redirect as reachable
   (it can't provision real certs on a host without public DNS pointed at it).

2. **Caddy rollback proof**
   ```bash
   npm run ops:caddy-proof
   npm run ops:caddy-wildcard-proof
   ```
   This uses a temporary real Caddy container. It proves a good snippet validates, a bad snippet is
   rejected, rollback config validates, and an old route remains alive.
   `ops:caddy-wildcard-proof` validates the production DNS-01 config and confirms the plugin-built Caddy
   image includes `dns.providers.cloudflare`; it does not order a public certificate.

3. **Scoped-MCP reprovision**
   ```bash
   npm run ops:reprovision-scoped-mcp -- emp_...
   ```
   The script mints a scoped MCP credential, sends the raw token only to the provisioner render call,
   restarts the employee runtime, proves MCP `tools/list`, verifies rendered files do not contain
   `MANAGER_INTERNAL_TOKEN`, then clears `needs_reprovision`.

4. **Pod Alpha capacity**
   ```bash
   npm run capacity:pod-alpha
   CAPACITY_ALLOW_START=1 npm run capacity:pod-alpha
   ```
   Dry mode measures available existing containers. Start mode restarts/starts real employee
   containers at configured tiers (`POD_ALPHA_TIERS=5,10,20,30`). Only set `POD_ALPHA_TIERS=5,10,20,30,50`
   after the lower tiers are clean. The cap is derived from the largest clean tier with p95/p99 metrics.
   Per-proc PSS needs privilege (container PIDs are root in another uid namespace); run as root for real
   memory numbers — otherwise `pss_kb` reads null and the cap is scored on running-count + DNS only.

5. **Crash / reboot recovery** (real host only)
   ```bash
   docker kill amtech-hermes-emp_...     # unless-stopped should auto-restart it
   sudo reboot                            # core + employees should return via restart: unless-stopped
   ```
   Every employee is launched with `--restart=unless-stopped` and core services use
   `restart: unless-stopped`. Verify a killed employee auto-restarts and that both core and employees
   return after a host reboot. (A sandboxed dev daemon may not honor restart-on-kill — prove this on the
   real VPS.)

## Launch-Blocker Checks

- **Backups**
  ```bash
  AMTECH_BACKUP_DIR=/mnt/offhost/amtech npm run ops:backup
  npm run ops:restore -- /mnt/offhost/amtech/amtech-vps-state-....tar.gz
  AMTECH_RESTORE_APPLY=1 npm run ops:restore -- /mnt/offhost/amtech/amtech-vps-state-....tar.gz
  ```
  Restore is dry-run unless `AMTECH_RESTORE_APPLY=1`.

- **Red health**
  ```bash
  npm run ops:red-health
  ```
  Fails when the latest runtime health rows in the configured window contain more red employees than
  `RED_HEALTH_MAX_RED`.

- **Egress**
  ```bash
  npm run ops:egress-policy
  AMTECH_EGRESS_APPLY=1 npm run ops:egress-policy
  ```
  Dry-run is default. Apply mode writes first-pass `DOCKER-USER` rules for labeled employee runtime
  containers, allowing Manager MCP and blocking arbitrary egress. Provider-domain allowlisting still
  needs a maintained proxy/CIDR policy before paid tenants.

- **Environment proof aggregation**
  ```bash
  npm run prod-env:proof
  ```
  Aggregates latest proof JSONs into `infra/proofs/prod-env-proof-*.json` so admin can distinguish
  `static`, `local_mirror`, `limited_live_infra`, and `provider_runtime_live` status without implying
  public DNS, ACME issuance, provider webhook, or model/runtime acceptance.

## Realness Rule

Local proof is local proof. Host proof requires the same proof JSON on the VPS. Runtime/provider
acceptance still requires real IDs from the runtime and providers; no script output alone upgrades that
status.
