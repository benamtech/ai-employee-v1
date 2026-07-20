# 09 — Current Bug, Risk, and Production-Gap Register

Status: **[VERIFIED] current source findings; [INFERRED] interaction risks; [HYPOTHESIS] explicitly testable failure modes**

This register is ordered by the shortest production trajectory, not by file location. A row leaves the register only when source, tests, exact-head CI, and the required live evidence agree.

## Closed during this archaeology pass

### CLOSED-001 — production Caddy could not reach loopback employee gateways

- [VERIFIED] Prior state: employee snippets reverse-proxied to `localhost:<port>` while production Caddy ran in a separate bridge namespace.
- [VERIFIED] Interaction: Caddy namespace × host-loopback publishing.
- [VERIFIED] Control: production Caddy now uses Linux host networking; Web and Manager upstream defaults are `127.0.0.1`; employee snippets keep `localhost:<port>`.
- [VERIFIED] Tests: production-boundary source contracts assert host networking and loopback upstreams.
- [INCOMPLETE] Live target-host DNS/TLS/upstream/reload/rollback evidence remains required.

### CLOSED-002 — Manager and Model Gateway were not attached to employee networks

- [VERIFIED] Prior state: Manager resolved Docker runtimes through `amtech-hermes-<id>` and rendered production Model Gateway URLs through `amtech-model-gateway`, but the launcher attached only the employee container to the employee bridge.
- [VERIFIED] Interaction: runtime URL compilation × Docker DNS/network membership.
- [VERIFIED] Control: one internal bridge per employee; Manager and Model Gateway attach with stable aliases; runtime probes both its own health and Model Gateway reachability.
- [VERIFIED] Teardown detaches shared peers before removing the network.
- [INCOMPLETE] Live multi-employee isolation and capacity proof remains required.

### CLOSED-003 — silent Manager MCP and business-brain reads

- [VERIFIED] Prior state: MCP used the non-strict snapshot builder; business-brain queries ignored database errors; operating-surface auxiliary reads used the normal client.
- [VERIFIED] Interaction: database fault × agent context × owner UI.
- [VERIFIED] Control: strict snapshot path for MCP, fail-closed business-brain queries/counts/facts, strict operating-surface auxiliary reads, mandatory source/unit tests.

### CLOSED-004 — Web could synthesize plausible production state after protocol drift

- [VERIFIED] Prior state: `AgentSurface` has a compatibility fallback when `operating_state` is missing.
- [VERIFIED] Interaction: Manager protocol drift × client fallback.
- [VERIFIED] Control: the production resources proxy now returns `503 operating_state_unavailable` when a successful Manager response omits `operating_state`; fixture mode retains its deterministic local state.
- [VERIFIED] Test: `web-operating-snapshot-contract.test.ts` is included in UI and production-boundary gates.

### CLOSED-005 — generated and repository artifacts

- [VERIFIED] Removed tracked Python bytecode, orphaned worktree Gitlink, and superseded filesystem scanner.
- [VERIFIED] Added ignore rules for Python caches and generated archaeology artifacts.

## P0 production blockers

### P0-001 — production database is not migrated to current head

- [VERIFIED] Current repository migration head is `0069`.
- [VERIFIED] Existing documentation records the approved production Supabase environment as stopping at `0031`.
- [INFERRED] No exact-head application can safely exercise relationship, command/effect, ambient inbox, Model Gateway commercial scope, identity activation, or owner surface grants until `0032–0069` apply in order.
- Control trajectory: identify approved staging branch/project → snapshot/backup → run exact-SHA migration proof → run security/performance advisors → run all PostgreSQL matrices → capture ledger and schema hash → only then promote deployment coordinates.
- Bifurcation warning: applying application images before schema activation creates a hard protocol split between source and durable authority.

### P0-002 — managed secret deployment and rotation proof absent

- [VERIFIED] Source defines required Manager, Model Gateway, provider, Caddy, Supabase, identity, Twilio, Stripe, Gmail, QuickBooks, and signing secrets.
- [INFERRED] Local/example env structure does not prove production custody, access policy, rotation, audit, or rollback.
- Control trajectory: produce secret inventory with owner/service/purpose → load through managed deployment mechanism → prove no secret in image/profile/browser/logs → rotate Manager/MCP/Model Gateway/provider credentials → verify old credential failure and new receipt continuity.

### P0-003 — target-host network and container acceptance absent

- [VERIFIED] Source topology is Linux host-network Caddy + control bridge + one internal employee bridge per employee.
- [INFERRED] CI source tests cannot prove host firewall, Docker forwarding, host-network support, filesystem ownership, Caddy permissions, or loopback reachability.
- Control trajectory: deploy exact image digests on target host → create two employees → inspect network membership → prove employee-to-employee denial → prove employee-to-Manager/Model Gateway success → prove Internet denial → prove Caddy routes both employee gateways → remove/replace one runtime without affecting the other.

### P0-004 — fixture-free canonical activation is absent

- [VERIFIED] Activation source and PostgreSQL matrices are green.
- [INCOMPLETE] A real owner has not completed identity verification, activation, runtime readiness, owner surface entry, channel binding, and first proof on the current exact SHA.
- Control trajectory: real Supabase Auth → live identity provider request/webhook → canonical activation → reconciler/provisioner → live owner login → strict snapshot → first owner turn → durable terminal proof.

### P0-005 — provider-backed generated work object is absent

- [VERIFIED] Typed generation, Manager compilation, sandbox, action intersection, approval binding, and browser contracts exist.
- [INCOMPLETE] No funded Hermes/provider run has emitted and completed the exact chain on this SHA.
- Control trajectory: seed real or production-like business context → ask Hermes for a bounded multi-row proposal → Manager tool emits typed view → owner reviews in fixture-free Web → action resolves exact approval → provider effect executes → provider/accounting/command receipts render in Proof.

### P0-006 — cumulative Model Gateway spend is not enforced

- [VERIFIED] `spend_limit_cents` is stored in credentials and only checked for `<= 0` at request time.
- [VERIFIED] Request audits store estimated cost after provider execution.
- [INFERRED] A positive credential can exceed its intended cumulative budget indefinitely.
- Control trajectory: add durable budget ledger/reservations keyed by assignment/credential/price period → atomically reserve worst-case request cost before dispatch → settle actual cost from receipt → release unused reservation → deny when settled + reserved exceeds limit → reconcile ambiguous provider calls.
- Bifurcation warning: implementing only post-call aggregation preserves overspend under concurrency.

### P0-007 — Model Gateway rate limiting is process-local

- [VERIFIED] rate buckets are stored in an in-memory `Map` keyed by credential.
- [INFERRED] restart resets limits and replicas enforce independent limits.
- Control trajectory: database or Redis token bucket with atomic claim, per-credential and per-provider scopes, explicit refill/window state, bounded outage behavior, and audit metrics.
- Bifurcation warning: horizontal scaling before shared rate state causes an N-replica multiplication of allowed traffic.

### P0-008 — provider timeout retry can duplicate cost/effect

- [VERIFIED] Model Gateway retries provider requests after timeout/error without an upstream idempotency key in the generic OpenAI-compatible path.
- [INFERRED] The first request may be accepted while its response is lost; a retry may create a second billable completion.
- Control trajectory: use provider idempotency key where supported; otherwise create one logical request reservation, mark timeout as ambiguous, query provider receipt/status when possible, and avoid blind replay for non-idempotent provider semantics.

### P0-009 — compensation and deterministic repair are incomplete

- [VERIFIED] desired resource graphs, drift inspection, retry classes, repair commands, effect receipts, and dead letters exist.
- [INCOMPLETE] every partial provisioning/provider crash point does not yet have an accepted deterministic compensation or forward-repair proof.
- Control trajectory: enumerate crash points → inject each failure → assert durable state → restart worker/process → run repair → verify exactly one final resource/effect → retain before/after evidence.

### P0-010 — release/deployment attestation is absent

- [VERIFIED] CI records source/build/test artifacts.
- [INCOMPLETE] no release record binds final Git SHA, image digests, migration ledger, environment/secret manifest, runtime version, Caddy config hash, provider configuration, proof IDs, and rollback result.
- Control trajectory: generate signed deployment manifest → deploy only referenced digests → run live acceptance bundle → attach evidence hashes → exercise rollback → mark release candidate only when all gates pass.

## P1 product and UX blockers

### P1-001 — full cross-surface UX alignment is incomplete

- [VERIFIED] owner surface, signed Review, and generated resources use the active Avery/light AMTECH system.
- [VERIFIED] public/create/claim/login/account/billing/customer portal/admin/artifact surfaces are not fully aligned.
- [INFERRED] divergent interaction grammar can reduce trust at handoff points even when authority is correct.
- Control trajectory: inventory each critical journey → map every screen to shared typography, spacing, control, status, error, approval, proof, and navigation tokens → test complete production journeys rather than isolated screenshots.

### P1-002 — context explanation is thin

- [VERIFIED] context signals and layout rationale exist; the owner can inspect a context panel.
- [INFERRED] a generated or reordered surface may feel arbitrary without a concise source/rationale explanation.
- Control trajectory: attach bounded rationale codes and source labels to each region → render “why this is here” and “what happens next” without exposing prompts/private memory/implementation jargon → test comprehension.

### P1-003 — proof refinding is immature

- [VERIFIED] evidence and Proof surfaces exist.
- [INFERRED] owners/operators cannot efficiently retrieve proof by job, customer, action, time, provider, or failure class at scale.
- Control trajectory: define proof index fields → add strict query API → render filter/search with exact result counts and receipt lineage → test multi-tenant isolation and export.

### P1-004 — connector setup and repair UX is inconsistent

- [VERIFIED] connector cards/status and provider-specific flows exist.
- [INFERRED] connection, consent, degraded, revoked, scope-changed, and repair states need one cross-provider grammar.
- Control trajectory: normalize ConnectionSurface states/actions → ensure every provider maps to the finite lifecycle → test setup, token expiry, revocation, provider outage, repair, and deletion.

### P1-005 — WYSIWYG/output parity is not proven

- [VERIFIED] typed resources, HTML, PDF, signed links, email drafts, and customer-facing artifacts exist.
- [INFERRED] owner approval can be misleading if the approved preview differs from the delivered output.
- Control trajectory: canonical content model + render hashes → compare owner preview, PDF, email, signed link, and customer portal output → fail before approval when parity exceeds allowed transformations.

### P1-006 — full accessibility evidence is incomplete

- [VERIFIED] 44px controls, focus styling, no-overflow checks, reduced-motion foundations, and browser matrices exist.
- [INCOMPLETE] screen-reader, focus-obscuration, complete keyboard order, zoom/reflow, contrast, error announcement, and manual WCAG 2.2 AA evidence are incomplete.
- Control trajectory: automated axe + Playwright keyboard/focus/zoom tests → manual NVDA/VoiceOver critical journeys → retain exact-head reports and remediation records.

### P1-007 — durable progress and interruption UX is incomplete

- [VERIFIED] SSE progress verbs, accepted/ambiguous status, and snapshot recovery exist.
- [INFERRED] long-running work needs exact run ownership, interruption semantics, recovery state, and no false completion.
- Control trajectory: persist run progress checkpoints → expose owner-safe phase/next update → add exact-run interrupt behind command/effect authority → prove disconnect/reconnect/restart behavior.

### P1-008 — effective capability graph is not persisted

- [VERIFIED] runtime capabilities/toolsets, Manager tools, connectors, grants, policy, commercial scope, and runtime revision exist separately.
- [INFERRED] UI/runtime can drift when one component changes between observations.
- Control trajectory: compile and persist one timestamped/hash-bound intersection → use it for UI capability state, Hermes context, operator diagnostics, and release proof.

## P2 scale and product-expansion trajectories

### P2-001 — direct tool-agnostic egress/MCP proxy

- [VERIFIED] current internal employee network denies arbitrary external egress.
- [HYPOTHESIS] a controlled Manager-owned egress proxy can add connector-agnostic MCP while preserving isolation.
- Required controls: SSRF/private-address denial, DNS policy, credential custody, assignment binding, schema/allowlist intersection, rate/spend limits, audit, receipts, revocation, and health.

### P2-002 — shared/fractional employee policy

- [VERIFIED] payer/beneficiary and assignment primitives exist.
- [HYPOTHESIS] explicit context partitions, allocation, and policy can support managed/fractional employees.
- Required controls: beneficiary isolation, per-assignment capability graph, commercial allocation, cross-organization approval, revocation, and proof.

### P2-003 — fleet capacity and fairness

- [VERIFIED] per-container CPU/memory/PID limits exist.
- [INFERRED] those limits do not provide fleet admission control, queue fairness, provider concurrency allocation, or noisy-neighbor policy.
- Control trajectory: capacity model → admission/reservation → per-account/employee queues → priority/fairness → saturation tests → graceful degradation and operator visibility.

### P2-004 — richer operator adapter

- [VERIFIED] Hermes TUI/HTTP/MCP research identifies useful operator control primitives.
- [HYPOTHESIS] a Manager-mediated read-mostly adapter can improve exact-run diagnosis and recovery.
- Required controls: platform authority, support lease/reason, tenant/runtime binding, read-only projection by default, C3 for control, redaction, cancellation semantics, immutable audit, runtime revision proof.

## Non-bugs retained by design

- [VERIFIED] fixture mode is retained for UI development but cannot satisfy live acceptance.
- [VERIFIED] the public estimator is retained only as a separated regression/acquisition harness and is non-canonical.
- [VERIFIED] Manager, not Hermes or generated UI, owns assignment and effect authority.
- [VERIFIED] owner reads do not create command/effect rows solely for observation.
- [VERIFIED] internal employee bridges intentionally deny direct arbitrary Internet access.
- [VERIFIED] process-local SSE events are liveness hints; strict snapshots and durable receipts remain truth.
