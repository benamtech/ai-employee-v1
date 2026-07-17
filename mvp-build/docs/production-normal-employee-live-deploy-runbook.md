# Production Normal Employee Live Deploy Runbook

Status: canonical launch-level runbook
Updated: 2026-07-17
Current boundary status: source-wired; fresh live acceptance pending

## Launch path

This is the only canonical normal-employee launch path:

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> real Twilio Verify
-> real account creation
-> Start Employee
-> host-private provisioning
-> isolated Hermes runtime
-> owner web client
-> provider-backed employee reply
-> useful connected-tool proof
```

The public estimator is outdated and non-canonical. `prod-like:public-estimator:*`, fixture onboarding, `/api/dev/login`, host `live:*`, Quick Tunnels, and manually injected provider events may support diagnostics but must not be reported as launch proof.

## Production topology

Fixed core:

- `manager`: public/control-plane API behind Caddy; no public arbitrary Docker authority.
- `model-gateway`: host-private OpenAI-compatible gateway, loopback-bound on host port `8092`; owns provider master credentials.
- `host-provisioner`: signed Unix-socket lifecycle authority with the Docker socket.
- `web`: public onboarding and owner surfaces.
- `caddy`: public origin router.

Dynamic fleet:

- each employee runs as `amtech-hermes-<employee_id>`;
- each employee receives a private bridge `amtech-employee-<employee_id>`;
- Hermes gateway ports publish to host loopback only;
- employee profiles are rendered read-only and checksummed;
- profiles receive only scoped Manager MCP and Model Gateway credentials;
- employee containers reach host-private routes through the explicit host-gateway mapping.

Employees are not static Compose services. The reconciler is responsible for desired fleet state; the current source still requires a true DB-backed worker before unattended production claims.

## Required configuration

Production env must include, by reference and without printing values:

- Supabase service/control-plane configuration;
- Cloudflare/DNS/tunnel configuration;
- Twilio Verify and messaging configuration;
- Manager/owner session secrets;
- provisioner signing/proxy configuration;
- `MODEL_GATEWAY_SIGNING_SECRET`;
- `MODEL_GATEWAY_PROVIDER_API_KEY`;
- `MODEL_GATEWAY_UPSTREAM_BASE_URL`;
- model alias/provider/upstream-model policy;
- employee-facing gateway URL, normally `http://host.docker.internal:8092/v1`;
- profile/runtime roots and Hermes image/runtime command;
- Caddy and public API origins.

Provider master keys must exist only in host-private services. They must not be rendered into employee files/env.

## Preflight — source and database

Before a fresh live run:

1. confirm `research` contains migrations `0031`, `0032`, and `0033` in order;
2. apply them to the target DB and retain migration evidence;
3. verify RLS is enabled and anon/authenticated grants are revoked on the new control-plane tables;
4. inspect `provisioning_jobs` compatibility, active operation-key uniqueness, retry semantics, and existing rows;
5. run typecheck/build/targeted tests if the environment permits and record exact results;
6. verify the production image includes `apps/manager/dist/model-gateway-server.js`;
7. verify shared exports and `ProvisionerResult`/Supabase row shapes compile.

Do not mark this preflight passed from static inspection alone.

## Start the production-shaped stack

Repository scripts may evolve; inspect `package.json` and `infra/scripts/` before running. The established local production-like entrypoints are:

```bash
npm run prod-like:normal:down -- --employees
npm run prod-like:normal:up -- --down-first --require-tunnel
```

Use `--no-build` only when source/images are known current:

```bash
npm run prod-like:normal:up -- --no-build --require-tunnel
```

The production Compose target is `infra/deploy/docker-compose.production.yml`. Confirm healthy Manager, Model Gateway, host provisioner socket, Web, and Caddy. Do not expose Model Gateway or host provisioner through Caddy/Cloudflare.

## Core readiness checks

Host/core:

```bash
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -sS http://127.0.0.1:8080/health
curl -sS http://127.0.0.1:8092/health
curl -I http://127.0.0.1:3000/create-ai-employee
```

Caddy/public ingress:

```bash
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
curl -sS http://127.0.0.1/health -H 'Host: api.amtechai.com'
curl -I -L https://agent.amtechai.com/create-ai-employee
curl -sS https://api.amtechai.com/health
```

Expected public proof includes successful status plus evidence traffic reached Caddy. A request to any public Model Gateway or provisioner path must fail because no such route exists.

## Gateway and profile readiness checks

Before onboarding a customer employee:

- prove the Model Gateway health endpoint is reachable from a disposable employee-network container through `host.docker.internal:8092`;
- prove it is not publicly reachable;
- prove a missing, malformed, expired, revoked, or cross-employee token fails closed;
- verify the configured alias routes to the intended upstream model without exposing the upstream key;
- verify audit rows contain identity/usage/error metadata but no request body or token;
- render a disposable profile and scan it for provider master-key names, configured secret values, unresolved `{{TOKENS}}`, world-readable auth files, and writable canonical files;
- record the profile checksum and credential version.

## Canonical browser onboarding proof

Open:

```text
https://agent.amtechai.com/create-ai-employee
```

Complete the real UI:

1. business intake;
2. real phone number;
3. real Twilio Verify code;
4. real owner email/password account creation;
5. Start Employee;
6. continue to the real owner web client;
7. send a real owner message;
8. receive a provider-backed employee reply;
9. connect or exercise at least one useful business capability and capture proof.

No fixture/session injection is permitted.

## Provisioning acceptance sequence

Capture evidence for:

1. account and employee records;
2. scoped Manager MCP credential;
3. scoped Model Gateway credential and version;
4. rendered profile checksum and integrity pass;
5. private employee network;
6. running employee container and loopback gateway port;
7. runtime health;
8. Caddy/runtime route activation;
9. Twilio/provider binding after runtime + route acceptance;
10. employee ready state;
11. welcome/customer-facing effect through the idempotent business-effect path.

The current inline provisioning code is not proof of a production reconciler. Separately prove the worker/command path once implemented.

## Required negative and recovery proofs

- cross-employee Model Gateway token substitution fails;
- revoked/expired credential fails;
- credential rotation changes token/checksum, live traffic uses the new token, and the old token fails;
- runtime/profile mutation is detected or replaced from canonical desired state;
- duplicate provisioning converges;
- a failed provision can retry without permanent filesystem/DB idempotency blockage;
- compensated jobs can start a fresh retry safely;
- orphan container/network, stale Caddy, missing profile/checksum, expired credential, and stuck job are detected and repaired;
- employee cannot reach peers, Docker, database, Web/Caddy internals, metadata endpoints, or unrelated host services;
- host restart reconstructs desired `ready` employees;
- Twilio/Gmail/Stripe duplicate ingress produces one durable event once WS3 migration is complete.

## Proof artifacts and IDs

Capture at minimum:

- rebase/deploy commit SHA;
- production stack proof JSON path;
- Cloudflare tunnel/ingress evidence;
- onboarding `session_id`;
- Twilio Verify SID/status;
- `account_id`, `employee_id`, provisioning job/command IDs;
- Model Gateway credential ID/version and gateway request audit ID;
- profile ID/checksum;
- container/network IDs and runtime health evidence;
- provider response/request ID;
- useful connector/tool proof IDs;
- approval/artifact/work-resource IDs where applicable.

Redact secrets and owner/customer content.

## Now-to-live gate

### P0

- [ ] migrations `0031`–`0033` applied and reviewed;
- [ ] type/API drift clean;
- [ ] host-private gateway reachable only from intended runtime path;
- [ ] rotation/profile integrity proofs pass;
- [ ] DB-backed reconciler worker operational;
- [ ] drift scan/repair operational;
- [ ] no Twilio/provider/welcome effect before runtime + route acceptance.

### P1

- [ ] provider ingress migrated to `ambient_event_inbox` workers;
- [ ] admin lifecycle actions unified through commands/reconciler;
- [ ] fresh canonical browser onboarding produces real provider/runtime/tool proof IDs.

## Validation state of this document update

No build, typecheck, migration apply, production stack run, browser onboarding, provider call, runtime probe, or proof artifact was generated in the 2026-07-17 reconciliation session.