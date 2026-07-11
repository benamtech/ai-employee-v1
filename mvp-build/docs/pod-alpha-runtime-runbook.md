# Pod Alpha Runtime Runbook

Status: source-wired operator runbook; local/VPS proof still required

This runbook is for the first commercial Pod Alpha host: one bare-metal VPS running the fixed
Compose core (`manager`, `web`, `caddy`) plus resident per-employee Hermes containers. It does not
upgrade runtime or provider acceptance by itself.

## Proof Order

1. **Local tool-loop proof**
   ```bash
   npm run live:up
   npm run live:status
   npm run ops:reprovision-scoped-mcp -- emp_...
   npm run local:tool-loop-proof
   ```
   Pass requires proof JSON with `employee_id`, employee tool `audit_id`, `artifact_id`, and
   `approval_id`.

2. **Compose smoke**
   ```bash
   docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build
   npm run deploy:smoke
   ```
   `deploy:smoke` writes `infra/proofs/deploy-smoke-*.json` with Manager/Web/Caddy health, Caddy
   validation, and optional employee DNS alias proof via `EMPLOYEE_DNS_ALIAS=amtech-hermes-emp_...`.

3. **Caddy rollback proof**
   ```bash
   npm run ops:caddy-proof
   ```
   This uses a temporary real Caddy container. It proves a good snippet validates, a bad snippet is
   rejected, rollback config validates, and an old route remains alive.

4. **Scoped-MCP reprovision**
   ```bash
   npm run ops:reprovision-scoped-mcp -- emp_...
   ```
   The script mints a scoped MCP credential, sends the raw token only to the provisioner render call,
   restarts the employee runtime, proves MCP `tools/list`, verifies rendered files do not contain
   `MANAGER_INTERNAL_TOKEN`, then clears `needs_reprovision`.

5. **Pod Alpha capacity**
   ```bash
   npm run capacity:pod-alpha
   CAPACITY_ALLOW_START=1 npm run capacity:pod-alpha
   ```
   Dry mode measures available existing containers. Start mode restarts/starts real employee
   containers at configured tiers (`POD_ALPHA_TIERS=5,10,20,30`). Only set `POD_ALPHA_TIERS=5,10,20,30,50`
   after the lower tiers are clean. The cap is derived from the largest clean tier with p95/p99 metrics.

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

## Realness Rule

Local proof is local proof. Host proof requires the same proof JSON on the VPS. Runtime/provider
acceptance still requires real IDs from the runtime and providers; no script output alone upgrades that
status.
