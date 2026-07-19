# 14 — Infrastructure, Deployment, UI-Test, and Validation Coverage Audit

Status: **[VERIFIED] source and exact-head CI audit; [INCOMPLETE] live production acceptance**  
Evidence anchor: `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`  
Date: 2026-07-19

This document records what the infrastructure, deployment, browser, acceptance, and test systems actually prove on the evidence anchor. It does not convert source contracts, fixtures, screenshots, or historical live evidence into launch acceptance.

## Audit scope

[VERIFIED] Exact-head repository archaeology read every tracked Git object at the evidence anchor:

- 1,112 tracked entries;
- 1,108 text blobs fully read;
- 4 binary/Gitlink entries classified;
- 145 build/deploy/tooling files;
- 154 test files;
- 258 source files;
- 74 schema/migration files;
- 40 configuration manifests;
- 377 environment-variable reads detected;
- 1,630 mechanically classified effects.

[VERIFIED] The archaeology artifact is exhaustive as an inventory. Its stale-reference, implicit-dependency, undocumented-effect, orphan, and unresolved-import totals are candidate sets, not confirmed defects. Dynamic imports, generated `.js` specifiers, API paths, historical documents, shell commands, and external repository references create false positives and require source-level confirmation.

## Canonical production topology

[VERIFIED] The current source-backed topology is defined by:

- `infra/deploy/docker-compose.production.yml`;
- `infra/caddy/production.Caddyfile`;
- `infra/scripts/local/start-hermes-container.sh`;
- `apps/manager/src/provisioner-host.ts`;
- `apps/manager/src/lib/provisioning-reconciler.ts`.

[VERIFIED] Its runtime shape is:

```text
Linux host
  Caddy: host network
  Web: 127.0.0.1:3000
  Manager: 127.0.0.1:8080
  Model Gateway: 127.0.0.1:8092

amtech_control bridge
  Manager
  Model Gateway
  Host Provisioner
  Web

per employee: amtech-employee-<employee_id> internal bridge
  Hermes employee runtime
  Manager attached as amtech-manager
  Model Gateway attached as amtech-model-gateway

Manager -> signed Unix socket -> Host Provisioner -> Docker socket
Caddy -> host-loopback employee gateway port
```

[VERIFIED] Only Host Provisioner mounts `/var/run/docker.sock` in the canonical production compose. Manager receives the provisioner Unix socket, not Docker authority.

## Confirmed deployment-control divergence

### INFRA-001 — normal production entrypoint selects the legacy compose

Severity: **P0 before deployment**

[VERIFIED] `infra/scripts/production-normal-up.mjs` invokes `infra/deploy/docker-compose.yml`, not `docker-compose.production.yml`.

[VERIFIED] The legacy compose:

- mounts Docker socket directly into Manager;
- has no separate Model Gateway service;
- has no separate Host Provisioner service;
- places Caddy on `amtech_runtime` bridge networking;
- defaults Caddy upstreams to Compose service DNS;
- cannot represent the canonical host-network Caddy plus per-employee internal-network topology.

[INFERRED] Running `npm run prod:normal:up` or `npm run prod:vps:normal:up` can therefore start a materially different control plane than the architecture, source contracts, and new network fixes describe.

Control intervention:

1. make `docker-compose.production.yml` the sole normal-production compose;
2. remove or explicitly label `docker-compose.yml` as historical/local-only;
3. add a source contract proving every production entrypoint selects the canonical compose;
4. run `docker compose config` and image build on the exact candidate SHA;
5. prove target-host topology before any provider or customer traffic.

Acceptance predicate:

```text
all production entry scripts resolve to docker-compose.production.yml
AND Manager has no Docker socket
AND Host Provisioner owns the Docker socket
AND Model Gateway is a distinct healthy service
AND Caddy uses host networking
```

### INFRA-002 — production-like environment compiler emits legacy topology values

Severity: **P0 before using production-like evidence as production rehearsal**

[VERIFIED] `infra/scripts/prod-like-normal-employee-up.mjs` selects `infra/deploy/docker-compose.yml` and creates/uses `amtech_runtime`.

[VERIFIED] It writes values aligned to the earlier topology, including:

- `DOCKER_MANAGER_API_ORIGIN=http://manager:8080`;
- `CADDY_VALIDATE_COMMAND` and `CADDY_RELOAD_COMMAND` targeting `amtech-ai-employee-caddy-1`;
- `CADDY_EMPLOYEE_UPSTREAM_HOST=amtech-hermes-{{EMPLOYEE_ID}}`;
- `HERMES_DOCKER_NETWORK=amtech_runtime`.

[VERIFIED] The canonical compose names Caddy `amtech-caddy`, uses host-network Caddy, uses `localhost` for employee upstreams, and creates per-employee networks dynamically.

[INFERRED] A production-like run can pass its own checks while rehearsing legacy DNS, privilege, and network behavior rather than the current production design.

Control intervention: migrate the script to the canonical compose and values, then add an exact source test and a two-employee live topology proof.

### INFRA-003 — smoke and rollback defaults remain attached to the legacy stack

Severity: **P0/P1 release-control gap**

[VERIFIED] `infra/scripts/deploy-smoke.mjs` defaults `COMPOSE_FILE` to `infra/deploy/docker-compose.yml`.

[VERIFIED] Its service health matrix checks Manager, Web, and Caddy, but does not require Model Gateway or Host Provisioner health.

[VERIFIED] Its optional employee DNS check runs `getent` inside Caddy. That model fits bridge-network Caddy but not the canonical host-network Caddy, which intentionally does not join employee bridges.

[VERIFIED] `infra/scripts/deploy-rollback.mjs` prints commands against `docker-compose.yml` and rolls only Manager and Web image tags. It does not bind rollback to Model Gateway, Host Provisioner, Caddy image/config, migration compatibility, employee runtime/profile revision, or proof recomputation.

[INFERRED] Current smoke and rollback commands can validate or restore only a subset of the canonical deployment.

Control intervention:

- point smoke and rollback at `docker-compose.production.yml`;
- require health for Manager, Model Gateway, Host Provisioner, Web, and Caddy;
- inspect employee-network membership from the Docker host/provisioner boundary, not Caddy;
- record previous image digests and config hashes for every service;
- define database backward/forward compatibility and irreversible-migration policy;
- rerun exact live acceptance after rollback.

## Infrastructure script classification

### Production-shaped, but not live-accepted

[VERIFIED] The following scripts encode current production intentions or live-proof predicates but have not been executed against an approved target on the evidence anchor:

- `acceptance/migration-staging-live-proof.mjs`;
- `acceptance/model-gateway-live-proof.mjs`;
- `acceptance/rotation-live-proof.mjs`;
- `acceptance/reconciler-recovery-live-proof.mjs`;
- `acceptance/ambient-ingress-live-proof.mjs`;
- `acceptance/canonical-browser-live-proof.mjs`;
- `acceptance/generated-work-object-live-proof.mjs`;
- `acceptance/production-boundary-live.mjs`;
- `prod-onboarding-proof.mjs`;
- `prod-normal-employee-validate.mjs`.

[VERIFIED] `canonical-browser-live-proof.mjs` validates an externally produced onboarding proof. It does not itself drive the browser.

[VERIFIED] `generated-work-object-live-proof.mjs` drives a real Manager owner turn and waits for provider-backed materialization, but it stops at resource/proof inspection. It does not click the generated UI in a real browser, complete an approval, execute a real external side effect, or prove delivered-output parity.

### Diagnostic or historical harnesses

[VERIFIED] Local `live:*`, fixture browser, `/api/dev/login`, public estimator, manually injected provider results, and prior proof files remain diagnostics or point-in-time evidence. They do not establish current candidate acceptance.

## UI and browser evidence boundary

### What the current UI workflow proves

[VERIFIED] `Agent Operating Surface Standard` builds the current Web application as a compiled production Next standalone server.

[VERIFIED] Source gates include shared/DB/Manager/Web typechecks, UI source validation, focused UI contracts, and Web build.

[VERIFIED] The fixture browser matrix exercises the new adaptive operating surface rather than the retired Home/Talk/Connected/Proof tabs. It covers:

- active owner state;
- first-run empty state;
- desktop and mobile layouts;
- context-panel keyboard toggle;
- 44-pixel target checks;
- reduced-motion checks;
- horizontal overflow checks;
- signed Review fixture;
- multiple typed UI-lab business scenarios;
- simulated heartbeat gap and recovery without replay.

[VERIFIED] Its evidence is explicitly labeled `fixture_demonstration`.

[VERIFIED] The product-shell matrix uses the compiled application but covers only:

- mobile login rendering;
- unauthenticated dashboard boundary;
- minimum targets;
- overflow;
- canonical typography;
- light-surface styling.

### What the current UI workflow does not prove

#### UI-001 — no fixture-free authenticated owner browser journey

Severity: **P0 launch evidence gap**

[VERIFIED] Current product-shell browser acceptance does not authenticate a real owner or open a real assigned employee.

Missing acceptance:

```text
real Supabase Auth
-> HttpOnly owner session
-> account selection
-> authenticated dashboard
-> assigned employee
-> strict operating snapshot
-> SSE connection/reconnect
-> owner command
-> terminal durable result
```

#### UI-002 — generated UI is not browser-proven end to end

Severity: **P0 launch evidence gap**

[VERIFIED] Unit/source contracts prove typed descriptor → Manager materialization → `ui_resource` → sandbox renderer → bounded host intent mapping.

[INCOMPLETE] No fixture-free browser proof demonstrates:

- a provider-backed generated table/form/diff/schedule;
- iframe rendering under opaque origin;
- action intersection against current resource actions;
- exact approval resolution;
- external effect execution;
- provider/effect/accounting receipts;
- final owner-visible proof.

#### UI-003 — screenshots are evidence capture, not visual regression

Severity: **P1**

[VERIFIED] Browser scripts save screenshots but do not compare them with approved baselines or structural visual thresholds.

[INFERRED] Layout/color/spacing regressions can pass when selectors and minimum dimensions remain valid.

Control: add stable screenshot baselines for critical states, mask nondeterministic timestamps/IDs, and gate intentional updates through review.

#### UI-004 — accessibility coverage is partial

Severity: **P1**

[VERIFIED] Existing automation checks target size, reduced motion, overflow, some keyboard interaction, labels, and typography.

[INCOMPLETE] Missing or incomplete evidence includes:

- automated axe scans;
- full keyboard order and focus return;
- focus-not-obscured behavior;
- screen-reader announcements for errors/progress/approval results;
- zoom and 320 CSS-pixel reflow;
- contrast of all semantic states;
- NVDA/VoiceOver critical-journey evidence;
- generated iframe title/focus/escape behavior.

#### UI-005 — browser and transport matrix is narrow

Severity: **P1**

[VERIFIED] CI installs Chromium only.

[INCOMPLETE] There is no WebKit/Firefox acceptance, mobile Safari behavior proof, long-lived SSE proxy/load-balancer proof, cookie-policy matrix, multi-tab authority behavior, session rotation, or network interruption matrix.

## Test-suite coverage interaction map

### Strong source/CI coverage

[VERIFIED] Exact-head CI currently exercises:

- blank PostgreSQL migrations through `0069`;
- assignment/relationship/RLS matrices;
- approval authority matrices;
- connector/commercial matrices;
- onboarding identity and activation authority;
- strict snapshot and context reads;
- generated production Manager source;
- Manager/Web/shared/DB builds and typechecks;
- Model Gateway credential/profile isolation source contracts;
- provisioning state ordering and idempotency contracts;
- generated UI materialization/action contracts;
- compiled fixture and product-shell UI matrices;
- exhaustive tracked-object archaeology.

### Missing high-value tests for recently added behavior

#### TEST-001 — canonical deploy-script selection

Add unit/source tests asserting that every normal production, smoke, rollback, and production-like entrypoint selects `docker-compose.production.yml` and canonical service/container/network names.

#### TEST-002 — live two-employee network isolation

Add target-host tests proving:

- employee A cannot resolve/connect to employee B;
- both can reach only scoped Manager and Model Gateway aliases;
- direct Internet egress fails;
- host Caddy reaches both loopback ports;
- replacing/removing A does not disrupt B;
- Manager and Model Gateway detach before network deletion.

#### TEST-003 — Model Gateway cumulative budget and replica-safe rate limits

Add concurrent integration/load tests for atomic reservation, settlement, release, ambiguity, restart, and multi-replica enforcement.

#### TEST-004 — provider timeout ambiguity

Inject response loss after upstream acceptance. Prove no blind duplicate request, durable ambiguous state, reconciliation, and exactly one settled commercial outcome.

#### TEST-005 — provisioning crash/compensation matrix

Inject failure after each durable/host boundary: credential mint, profile render, checksum freeze, network create, peer attach, container start, health acceptance, Caddy write/validate/reload, provider binding, welcome enqueue/effect, rotation, teardown, and restore.

#### TEST-006 — deployed strict-read failure injection

Cause schema/RLS/database faults in snapshot, delta, business-brain, MCP, and operating-surface reads. Prove explicit unavailable/degraded responses, no empty-state substitution, operator-visible telemetry, and recovery.

#### TEST-007 — authenticated dashboard error-state matrix

Browser-test 200, 401, 403, 409, 410, 429, 500, and 503 behavior. Ensure no infrastructure or authority failure is rendered as an empty workforce or activation CTA.

#### TEST-008 — live generated-work-object action chain

Drive one provider-backed typed work object through real Web iframe action, approval authority, C3/effect, provider delivery, accounting receipt, and proof refinding.

#### TEST-009 — effective-capability graph

Persist and test the hash-bound intersection of runtime observations, Manager registry, connector health, assignment grants/policy, commercial entitlement, and runtime/profile revision.

#### TEST-010 — capacity, fairness, and saturation

Test 100, 250, 500, and 700 employees with admission control, queue fairness, database connection budgets, provider concurrency, SSE connections, Model Gateway state, worker leases, recovery time, and operator visibility.

## Exact-head workflow evidence

[VERIFIED] On `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`:

- Phase 2 Remediation Plan Integrity — `29690964418` — success;
- Repository Documentation Archaeology — `29690964459` — success;
- S2 S7 S9 Production Boundary — `29690964423` — success;
- Lane 1 Relationships and Authorization — `29690964448` — success;
- S10.1 Onboarding Identity Authority — `29690964447` — success;
- Lane 10 Integrated CI and Release Evidence — `29690964445` — success;
- Employee Work Production Boundary — `29690964453` — success;
- Agent Operating Surface Standard — `29690964421` — success.

[VERIFIED] These results establish `ci-accepted` only for their declared scopes. They do not establish real-Supabase, runtime, provider, browser/channel, commercial, deployed, rollback, or production-ready status.

## Dependency-ordered TDD trajectory

1. Write red source tests for canonical compose selection across every production/deploy/smoke/rollback script.
2. Migrate those scripts to `docker-compose.production.yml`; remove or quarantine legacy topology.
3. Add `docker compose config` and canonical five-service image/health checks.
4. Write and run target-host two-employee network isolation tests.
5. Apply `0032–0069` to approved staging and run advisors plus behavior matrices.
6. Add cumulative budget, shared rate-limit, and provider-ambiguity tests before implementations.
7. Implement those controls and rerun concurrent/failure tests.
8. Add fixture-free authenticated dashboard/SSE/error-state browser tests.
9. Add provider-backed generated UI → approval → effect → receipt browser acceptance.
10. Add crash/compensation, capacity/fairness, accessibility, cross-browser, and rollback matrices.
11. Generate a signed deployment manifest binding SHA, image digests, migration ledger, secret/config hashes, runtime/profile versions, proof IDs, and rollback result.

## Release conclusion

[VERIFIED] The branch has materially stronger source, authority, network, context, UI, and documentation foundations than its starting point.

[VERIFIED] The old Avery UI tabs are no longer the active owner-surface contract, and current fixture tests exercise the adaptive system.

[VERIFIED] The normal production launcher, production-like launcher, smoke helper, and rollback helper still reference the legacy compose family.

[INFERRED] Until those entrypoints converge on the canonical topology and the named live matrices pass, green CI is evidence of source coherence—not evidence that the production system has been deployed, exercised, recovered, or proven safe for 500+ managed employees.
