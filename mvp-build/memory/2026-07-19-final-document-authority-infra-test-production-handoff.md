# 2026-07-19 — Final Document Authority, Infra/Test Audit, and Production Handoff

Status: **code/test evidence anchor CI-accepted; not live-accepted; not deployed; not launch-cleared**

## Coordinates

- Repository: `benamtech/ai-employee-v1`
- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Starting head: `1affb16d819aad1e8975eb5b4a48e52c78d6b255`
- Complete code/test evidence anchor: `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`
- Migration head: `0069`
- Distance from starting head at evidence anchor: 81 commits ahead, 0 behind
- `main` was not used as an integration shortcut

Later commits synchronize documentation. Use `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec` as the full green code/test anchor unless a newer handoff names a newer complete workflow matrix.

## Purpose

Close the established P0/P1 findings, review the Manager/Hermes/Web/PostgreSQL/Docker/event/UI system, repair source-confirmed boundaries, build a durable repository/document authority map, audit every tracked file and test, and leave the shortest honest TDD path to production.

## Major implementation work

### P0/P1 closure

- Added migration `0069_owner_activation_surface_authority.sql` with canonical actions `read`, `message:create`, `stream:read`, `materialize`, `heartbeat`, and `turn:create` for explicit human assignment principals only.
- Connected Manager-compiled `ui_resource` data to canonical `WorkResource` rendering and bounded host action routing.
- Kept owner-session bearer data out of browser JSON and SSE URLs; retained HttpOnly cookie custody and private Manager-hop header forwarding.
- Added strict snapshot/delta reads and extended them through production Manager routes, owner snapshots, previews, Manager MCP, business brain, and operating-surface reads.

### Network/runtime correction

- Production Caddy now uses Linux host networking to reach loopback-only Web, Manager, and employee gateways.
- Canonical control services use `amtech_control`.
- Each employee gets one internal bridge with scoped Manager and Model Gateway aliases.
- Runtime startup fails closed unless Model Gateway and Hermes health pass from inside the employee container.
- Teardown detaches shared peers before deleting the employee network.
- In canonical production Compose, only Host Provisioner mounts Docker socket; Manager uses the signed Unix socket.

### Web protocol correction

- Production resources proxy returns `503 operating_state_unavailable` when Manager omits `operating_state`.
- Fixture mode keeps deterministic fallback state.

### CI-discovered test repairs

The production-boundary workflow exposed stale test assumptions: missing Manager MCP fixture secret, missing top-level profile package selector, obsolete integrity import, and a mutation test that ignored read-only profiles. The final test proves the current invariant: render-time checksum matches the frozen tree, sensitive config is not world-readable, and privileged out-of-band mutation changes the checksum used by reconciler drift rejection. No production safety check was relaxed.

## Repository archaeology and document authority

At the evidence anchor, repository archaeology read:

- 1,112 tracked entries;
- 1,108 text blobs;
- 4 binary/Gitlink entries;
- 145 build/deploy files;
- 154 test files;
- 258 source files;
- 74 schema files;
- 421 documentation files.

Added the tracked-object archaeology script/workflow and removed tracked Python bytecode, an orphaned worktree Gitlink, and a superseded scanner.

Created the canonical architecture packet under `mvp-build/docs/architecture/`, including product/system context, network/runtime, events/ambient inbox, Hermes/context, Web/generated UI, effect graphs, emergent capabilities, archaeology, risk register, trajectories, agent roles, document control, memory catalog, and the infrastructure/deployment/test audit.

Synchronized root/scoped README, AGENTS, CLAUDE, CODEGRAPH, memory index, UX index, plan index, and implementation-record index. Historical Markdown remains in place as point-in-time evidence; authoritative indexes route readers without breaking inbound references.

## Mandatory agent bootstrap

1. `identity.md`
2. root `AGENTS.md` or `CLAUDE.md`
3. root `CODEGRAPH.md`
4. scoped `mvp-build/AGENTS.md` or `CLAUDE.md`
5. scoped `mvp-build/CODEGRAPH.md`
6. `mvp-build/memory/MEMORY.md`
7. this handoff
8. `mvp-build/STANDARD.md`
9. active remediation plan
10. `mvp-build/docs/architecture/README.md`
11. agent role map
12. `14-infrastructure-deployment-and-test-coverage-audit.md`
13. relevant UX docs, source, migrations, scripts, workflows, tests, and current diff

Authority order: migrations/source → generated source/deploy config → exact-SHA executable proof → Standard/active plan → CODEGRAPH/architecture → newest memory → historical records.

## Exact green workflow matrix

On `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`:

- Phase 2 Remediation Plan Integrity — `29690964418` — success
- Repository Documentation Archaeology — `29690964459` — success
- S2 S7 S9 Production Boundary — `29690964423` — success
- Lane 1 Relationships and Authorization — `29690964448` — success
- S10.1 Onboarding Identity Authority — `29690964447` — success
- Lane 10 Integrated CI and Release Evidence — `29690964445` — success
- Employee Work Production Boundary — `29690964453` — success
- Agent Operating Surface Standard — `29690964421` — success

This is `ci-accepted` only within named scope.

## Glaring final-review findings

### P0 — production entrypoints still select the legacy Compose

Canonical topology is `infra/deploy/docker-compose.production.yml`, but these still use or default to `infra/deploy/docker-compose.yml`:

- `infra/scripts/production-normal-up.mjs`
- `infra/scripts/prod-like-normal-employee-up.mjs`
- `infra/scripts/deploy-smoke.mjs`
- `infra/scripts/deploy-rollback.mjs`

The legacy Compose mounts Docker socket into Manager, lacks separate Model Gateway and Host Provisioner services, and keeps Caddy on a bridge. It is not equivalent to the canonical architecture fixed in this session.

The production-like env compiler also carries legacy Caddy container/network/upstream values. Smoke omits Model Gateway and Host Provisioner health. Rollback covers only Manager/Web commands and does not bind database compatibility, Caddy config, runtime/profile versions, or full acceptance recomputation.

This deploy fork is the first next-session TDD target. Do not deploy through those commands until they converge on the canonical Compose and pass source plus target-host tests.

### UI/browser evidence boundary

Current compiled fixture tests exercise the new adaptive operating surface, not the retired Home/Talk/Connected/Proof tabs. They cover active/first-run/mobile states, context, command, adaptive regions, signed Review fixture, typed business scenarios, heartbeat gap, recovery, target size, motion, and overflow.

However, the product-shell matrix proves only login rendering and an unauthenticated dashboard. It does not prove:

- real authenticated dashboard/account selection/assigned employee;
- live operating snapshot and SSE reconnect/rotation;
- dashboard 403/409/410/429/500/503 states;
- provider-backed generated UI acted on in a browser;
- approval → C3/effect → external provider → receipts → proof refinding;
- visual regression, cross-browser/mobile Safari, or complete WCAG 2.2 AA evidence.

Screenshots are retained evidence, not baseline comparisons.

## Remaining production blockers

1. Converge deploy/smoke/rollback scripts on canonical Compose.
2. Establish managed secret custody and rotation proof.
3. Apply `0032–0069` to approved real staging and run advisors/matrices.
4. Prove target-host Caddy/Docker/Unix-socket/two-employee isolation.
5. Capture live identity-provider verification and canonical activation.
6. Add cumulative Model Gateway budget reservation/settlement.
7. Replace process-local rate limits with shared atomic state.
8. Eliminate blind retry after ambiguous provider timeout.
9. Complete compensation/repair and crash-point matrices.
10. Capture fixture-free Web/SMS/Review and generated work-object effect/receipt proof.
11. Persist the effective-capability graph.
12. Reconcile real provider usage, payer/beneficiary, price, invoice, and accounting receipts.
13. Prove capacity/fairness at 100, 250, 500, and 700 employees.
14. Complete accessibility, cross-browser, visual regression, rollback, SBOM/attestation, and signed deployment manifest.

## TDD next sequence

1. Add red tests asserting every production/deploy/smoke/rollback entrypoint selects `docker-compose.production.yml` and canonical service names.
2. Update scripts; quarantine or explicitly label legacy topology.
3. Add `docker compose config`, five-service health, Unix-socket, no-Manager-Docker-socket, and Caddy host-network tests.
4. Run target-host two-employee isolation/replacement/teardown tests.
5. Apply staging migrations and database advisors/matrices.
6. Add red concurrent budget/rate/timeout tests, then implement controls.
7. Add provisioning/effect crash injection and deterministic repair.
8. Add real authenticated dashboard/SSE/error-state browser tests.
9. Add provider-backed generated UI browser action through effect and proof.
10. Add cross-browser, accessibility, visual regression, capacity/fairness, rollback, and release-attestation gates.

## Unknown-unknown warning

The session introduced 81 commits across migrations, authority, generated source, Manager, Web, Docker networking, tests, workflows, and documentation. The new map improves discoverability, but breadth creates risk of legacy scripts, stale workflow path filters, fixture-only confidence, conflicting environment names, historical proof being mistaken for current proof, and new source lacking concurrency/failure/capacity/live-browser coverage.

The next agent should not add product features first. Build the executable production dependency graph from current entrypoints, close the canonical deploy fork, then advance through live gates in dependency order.

## Final state

The branch is materially stronger in authority, network design, strict failure behavior, generated UI plumbing, CI coverage, and repository navigation. It is not production-ready because normal deployment commands still target a legacy topology and no current exact-SHA real database, target host, live identity/provider, fixture-free owner channels, commercial reconciliation, capacity, rollback, or deployment attestation has passed.
