# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Issue source: [`08-production-issue-vector.json`](08-production-issue-vector.json)  
Roadmap source: [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md)

The 38 credible P0/P1/P2 issues are deduplicated into nine coherent workstreams. Order is dependency order, not team preference. A downstream workstream stops when a prerequisite gate is red, stale, skipped without an allowed reason, or bound to a different candidate SHA.

## WS-01 — Repository authority and test-contract truth

**Issues**

- P0: `ISS-001`, `ISS-002`, `ISS-003`, `ISS-004`.
- P1: `ISS-005`, `ISS-006`.
- P2: none; all test debt discovered here is either normalized, explicitly blocked, or routed before moving on.

**Dependencies:** merged `main@5e5b8d7`; ratified Standard v0.2; final cutover evidence head `d131dd09`.

**Acceptance evidence**

- root/scoped contributor, CODEGRAPH, plan, architecture, and memory routes all state that PR `#23` is merged and new work branches from current `main`;
- one active program remains; no new competing plan family exists;
- `npm run test:unit` is green on the workstream candidate, or every remaining failure has a ratified explicit exception and non-overlapping replacement contract approved by a human;
- curated gates and broad aggregate are reported separately;
- exact workflow IDs and candidate SHA are recorded after branch movement stops.

**Tests to preserve or repair**

- preserve `test:standard`, `test:s10-onboarding`, `test:lane1-scope`, `test:lane10-evidence`, `test:production-boundary`, `test:ui:contracts`, build, archaeology, and compiled browser gates;
- repair stale assignment/principal/fake-RPC/environment fixtures in the broad aggregate;
- do not delete assertions merely because current source differs;
- classify intentional suite overlap without summing duplicate pass counts.

**External prerequisites:** none beyond GitHub Actions and normal Node dependencies.

**Stop conditions**

- any authority document points to an unmerged/current branch other than the reviewed task branch;
- broad-suite normalization exposes a real source defect;
- current curated suite turns red;
- an expectation cannot be shown stale from Standard/source/migration evidence.

**Complete when:** repository routing is post-merge current, the test disposition is machine/human readable, the broad regression aggregate is trustworthy and green, and all applicable CI passes on the final candidate.

## WS-02 — Connector, remote MCP, MCP Apps, AG-UI, and capability truth

**Issues**

- P0: `ISS-007`, `ISS-008`, `ISS-010`, `ISS-011`.
- P1: `ISS-009`.
- P2: future connector types may be added only through the same manifest/custody contracts.

**Dependencies:** WS-01; current assignment/authority contracts; database schema additions route through WS-03.

**Acceptance evidence**

- protected-resource and authorization-server metadata discovery with exact resource audience, PKCE/state/redirect validation, and trusted issuer selection;
- consequential tokens remain in Manager custody; direct MCP remains explicit read-only/non-money/non-customer-facing;
- MCP Apps negotiation, `ui://` resource retrieval, opaque-origin sandbox, CSP/permission enforcement, bounded JSON-RPC, and `WorkAction` intersection;
- persisted/hash-bound effective capability intersection used by UI, Hermes context, diagnostics, and release proof;
- live connector authorization, health, staleness, revocation, scope-change, outage, repair, and deletion evidence;
- AG-UI adapter only after durable state mapping is stable.

**Tests to preserve or repair**

- preserve connector registry/setup/capability binding and CapabilityDrawer contracts;
- add OAuth/MCP metadata attack tests, audience/issuer confusion, open redirect, stale evidence, revocation races, and token-custody tests;
- add MCP Apps sandbox/CSP/bridge/action-intersection browser tests;
- add AG-UI replay, duplicate, stale delta, reconnect, and revocation tests.

**External prerequisites:** disposable remote MCP authorization server; connector sandbox accounts; browser CSP test host; provider revocation endpoints.

**Stop conditions**

- browser or model can select provider tool, scope, host, credential mode, issuer, audience, or continuation;
- unknown/stale evidence is treated as effective;
- MCP Apps or AG-UI state becomes authority or executes an effect directly;
- a live provider cannot prove revocation/repair semantics.

**Complete when:** one generic manifest-driven connector protocol passes deterministic, browser, disposable-provider, and exact-candidate evidence while preserving Manager custody and fail-closed authority.

## WS-03 — Database authority, migrations, RLS, concurrency, and platform proof

**Issues**

- P0: `ISS-012`, `ISS-013`, `ISS-014`.
- P1: performance/advisor remediation discovered during release proof.
- P2: partitioning/archival work only after the current ledger is accepted.

**Dependencies:** WS-01; schema needs from WS-02 and WS-07 are implemented here in forward-only migrations.

**Acceptance evidence**

- blank migration ledger through `0072` plus new forward migrations;
- existing-row/backfill compatibility and deterministic schema/migration hashes;
- RLS, grants, security-definer, relationship, assignment, artifact, approval, capability, receipt, and commercial negative-isolation matrices;
- atomic claims, compare-and-swap, duplicate/replay, lease expiry, ambiguity, and rollback tests under concurrency;
- disposable managed Supabase proof for security-sensitive changes and the final release candidate;
- approved target database ledger and advisor evidence retained without testing against production.

**Tests to preserve or repair**

- preserve worker-migration and production-boundary migration contracts;
- expand integration matrices rather than replacing them with mocks;
- add existing-row and concurrent transaction fixtures;
- retain failures/skips as evidence.

**External prerequisites:** PostgreSQL 17 CI service; disposable managed Supabase project for triggered gates; approved staging snapshot/backup process.

**Stop conditions**

- an applied migration is edited;
- local PostgreSQL behavior is promoted to platform acceptance without the triggered managed proof;
- schema application or advisor output is incomplete;
- a negative-isolation or concurrency test fails.

**Complete when:** every durable authority/commercial/recovery invariant used by later workstreams is enforced and accepted on both the reproducible PostgreSQL matrix and required managed-platform candidate.

## WS-04 — Secret custody, target-host topology, runtime isolation, and lifecycle

**Issues**

- P0: `ISS-015`, `ISS-016`, `ISS-017`.
- P1: `ISS-018`.
- P2: host-pool automation only after the single-host boundary is stable.

**Dependencies:** WS-01 and WS-03; WS-02 capability/network requirements frozen enough to provision.

**Acceptance evidence**

- managed secret inventory with service, owner, purpose, audience, rotation, revocation, and rollback;
- no master secret in image, employee profile/runtime, browser, artifact, or logs;
- canonical Caddy/Web/Manager/Model Gateway/Host Provisioner health;
- Manager has no Docker socket; signed Unix-socket Host Provisioner is sole host authority;
- two employees prove network, data, workspace, queue, credential, memory, and action isolation;
- employee-to-employee and arbitrary-Internet denial; scoped Manager/Model Gateway reachability;
- replace, suspend, restore, rotate, teardown, and restart without neighbor disruption;
- resolved immutable Hermes digest retained in candidate evidence.

**Tests to preserve or repair**

- preserve production-topology, provisioner idempotency, model/profile isolation, and exact-image filesystem contracts;
- add target-host mutation tests, secret rotation old-token denial, filesystem ownership, Caddy reload/rollback, and neighbor-safety tests.

**External prerequisites:** Linux target host matching production kernel/Docker/Caddy assumptions; managed secret store; DNS/TLS test domain; immutable image registry.

**Stop conditions**

- Manager or Web gains host/Docker authority;
- an employee reaches another employee or arbitrary external network;
- rotation breaks receipt continuity or leaves old credentials valid;
- partial lifecycle state is presented healthy;
- image digest is unresolved or floating.

**Complete when:** the exact candidate runs the five-service topology with two isolated employees and passes custody, lifecycle, rotation, restart, teardown, and evidence retention.

## WS-05 — Fixture-free identity, owner, connector, and channel journey

**Issues**

- P0: `ISS-019`, `ISS-020`.
- P1: `ISS-021`.
- P2: future voice/channel adapters follow the same durable authority state.

**Dependencies:** WS-02, WS-03, WS-04.

**Acceptance evidence**

- real owner authentication, verification, account/assignment selection, activation, runtime readiness, and strict operating snapshot;
- 200/401/403/409/410/429/500/503 owner-state matrix with distinct empty/loading/unauthorized/unavailable/degraded/ambiguous/failed/completed states;
- SSE reconnect, session rotation, authority-version revocation, and snapshot recovery;
- live connector setup, health, revocation, repair, and capability effectiveness;
- Web, SMS, and signed Review resolve the same durable work/approval/proof state;
- browser initiates approved setup but never handles raw provider credentials or executes provider effects.

**Tests to preserve or repair**

- preserve onboarding identity, strict stream, operating snapshot, UI contracts, and fixture guards;
- add fixture-free browser and channel matrices with real session/cookie semantics;
- add role/assignment denial and stale-authority tests;
- keep fixture mode for development but mark it non-acceptance.

**External prerequisites:** disposable Auth environment; Twilio or equivalent test channel; connector sandboxes; target host from WS-04.

**Stop conditions**

- infrastructure failure renders as empty workforce or success;
- account membership alone grants assignment access;
- browser-readable bearer tokens or token-bearing SSE URLs appear;
- channel projections diverge from durable state.

**Complete when:** a real owner can activate, connect, supervise, recover, and inspect one employee across supported channels on the exact candidate with no fixture or manual state injection.

## WS-06 — Golden work objects, output parity, and proof refinding

**Issues**

- P0: `ISS-022`.
- P1: `ISS-023`, `ISS-024`.
- P2: additional employee roles only after the first three canonical journeys are stable.

**Dependencies:** WS-05; commercial reservations from WS-07 must be integrated before paid provider acceptance is final.

**Acceptance evidence**

- Website Employee A manual journey, then automated/replay journey;
- Contractor Office Employee B and Bookkeeping Employee C;
- artifact → immutable revision → validation → exact approval snapshot → durable command/effect → provider/publication receipt → post-effect verification → owner refinding → idempotent replay;
- canonical content/render hashes prove preview-to-HTML/PDF/email/signed-link/customer-output parity;
- strict proof query by assignment, job/customer, action, provider, time, state, and failure class with isolation and export.

**Tests to preserve or repair**

- preserve artifact-workbench, materialization, UI resource, approval, command/effect, and release-evidence contracts;
- add golden fixture-independent provider journeys, accepted-response-loss, duplicate action, stale approval, mutated revision, output parity, and proof query isolation tests.

**External prerequisites:** funded model/provider sandbox; Gmail/QuickBooks/Stripe or equivalent test adapters; business-context fixtures sourced without production customer data.

**Stop conditions**

- preview differs materially from delivered output;
- approval is stale, self-created, or not assignment/authority-version bound;
- success lacks matching provider/effect/accounting receipt;
- replay duplicates an irreversible effect;
- proof cannot be refound.

**Complete when:** all three canonical employees complete bounded real work with exact approval, one external effect, durable receipts, parity, replay safety, and owner-refindable proof.

## WS-07 — Commercial controls, shared rate authority, and provider ambiguity

**Issues**

- P0: `ISS-025`, `ISS-026`, `ISS-027`, `ISS-028`.
- P1: operator-visible budget/rate/ambiguity state and reconciliation tooling.
- P2: pricing experiments only after the canonical offer controls are reliable.

**Dependencies:** WS-01 and WS-03; integrates into WS-05/WS-06 before their final live acceptance.

**Acceptance evidence**

- durable worst-case budget reservation before dispatch, actual settlement from provider receipt, unused release, and atomic deny across replicas;
- shared per-credential/provider/account rate authority with bounded outage behavior;
- one logical request/effect reservation and provider idempotency key where supported;
- timeout/accepted-response-loss becomes durable ambiguous, never blind failed/retry;
- reconciliation before retry and exactly one provider plus accounting settlement;
- payer, beneficiary, price snapshot, entitlement, usage, cost, invoice, credit/refund, and suspension outcomes reconcile;
- Start Free and Managed from $400 controls are explicit; public estimator remains non-canonical.

**Tests to preserve or repair**

- preserve model-gateway credential/isolation and connector-commercial integration tests;
- add multi-replica concurrency, reservation race, restart, provider timeout, accepted-response-loss, duplicate request, pricing-version, entitlement, and invoice reconciliation tests.

**External prerequisites:** provider sandbox with request IDs/idempotency behavior; billing sandbox; shared database or Redis authority selected through an explicit failure analysis.

**Stop conditions**

- spend is checked only after dispatch;
- rate state is process-local;
- ambiguous provider outcome is recorded failed or retried blindly;
- payer/beneficiary or provider/accounting receipts disagree;
- commercial state can be selected by caller headers or browser state.

**Complete when:** concurrent replicas cannot overspend, overrun shared rate, duplicate provider cost, or misattribute one request, and one exact candidate reconciles usage through invoice/entitlement outcome.

## WS-08 — Crash repair, rollback, observability, and signed release evidence

**Issues**

- P0: `ISS-029`, `ISS-030`, `ISS-031`.
- P1: `ISS-032`.
- P2: automated multi-host disaster recovery after single-candidate recovery is proven.

**Dependencies:** WS-02 through WS-07.

**Acceptance evidence**

- crash injection at each durable claim, external dispatch, receipt, publication, provision, rotation, migration, and deployment boundary;
- deterministic forward repair or explicit manual-repair terminal state;
- database/runtime/profile/Caddy/config/image rollback compatibility;
- backup and restore with integrity and recovery-time evidence;
- SBOM, standard in-toto/SLSA provenance, builder identity, source SHA, image digests, migration hashes, deployment/config hashes, proof IDs, and rollback bound in a signed manifest;
- telemetry answers principal, assignment, release/policy, capability/provider, approval, effect/receipt, retry/repair, payer, beneficiary, and final state;
- incident runbooks and alert thresholds are exercised.

**Tests to preserve or repair**

- preserve release-evidence, production-live-harness, reconciler recovery, backup/restore, deploy smoke, and rollback scripts;
- add deterministic fault injection and verifier tests;
- do not accept HMAC transport tokens as supply-chain provenance.

**External prerequisites:** artifact registry; SBOM/provenance/signing service; target host; backup store; monitoring backend; incident operator.

**Stop conditions**

- any crash can create false success or duplicate effect;
- rollback loses durable accepted work or crosses schema compatibility;
- manifest cannot be independently verified;
- alerting cannot distinguish blocked, failed, ambiguous, and recovered.

**Complete when:** one frozen candidate survives the fault matrix, rolls back safely, restores from backup, emits complete diagnostics, and has independently verifiable signed release/deployment evidence.

## WS-09 — Human-surface acceptance, capacity, and controlled pilot

**Issues**

- P1: `ISS-033`, `ISS-034`, `ISS-035`, `ISS-037`.
- P2: `ISS-036`, `ISS-038`.
- P0: any authority, false-state, or unsafe-action defect discovered by human-surface testing is immediately promoted and blocks the workstream.

**Dependencies:** WS-01 through WS-08.

**Acceptance evidence**

- coherent interaction grammar across owner, public/create/claim/login, account, billing, admin, artifact, connector, approval, proof, and recovery surfaces;
- Chromium, Firefox, WebKit/mobile-Safari representative runs;
- automated axe plus keyboard/focus/zoom/reflow/reduced-motion/contrast/error-announcement tests and manual NVDA/VoiceOver critical journeys;
- durable progress, exact-run interruption, reconnect, restart, ambiguity, and recovery language;
- capacity sequence: 1 canary → 10 operating pod → 100 → 250 → 500 → 700, each with declared envelope and rollback;
- queue fairness, admission, database pools, SSE fan-out, provider concurrency, worker leases, reconciler convergence, recovery time, cost, and noisy-neighbor evidence;
- pilot packet defines eligibility, entitlements, known limits, support/incident owner, data handling, rollback, customer exit, success/failure thresholds, and stop authority.

**Tests to preserve or repair**

- preserve compiled fixture browser suites as regression only;
- add fixture-free cross-browser/a11y/visual/live-state matrices;
- add capacity/fairness/load tests and pilot telemetry validation.

**External prerequisites:** supported browser/device matrix; accessibility reviewers; controlled pilot businesses; support rota; capacity environment and cost budget.

**Stop conditions**

- any non-waivable Standard gate is open;
- accessibility blocks a critical journey;
- capacity exceeds declared latency/error/cost/fairness envelope;
- operator cannot stop, recover, or exit a pilot safely;
- marketing or sales claims exceed measured evidence.

**Complete when:** the exact signed release candidate passes human-surface and declared capacity acceptance, then a bounded canary and ten-employee operating pod complete their pilot criteria without an unresolved P0/P1.
