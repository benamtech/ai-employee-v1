# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map; live deployment acceptance incomplete**  
Standard: ratified `../../STANDARD.md` v0.2  
Active program: `../../second-half-plan/2026-07-19-ratified-standard-production-program/`

This directory is the current human-readable architecture index for the AMTECH AI Employee product. It describes behavior present in source on `employee-production-tuesday`, separates implementation from acceptance, and records research/protocol disposition without claiming external certification.

The architecture is a governed distributed labor system:

- **Web** presents owner, review, onboarding, and operator experiences.
- **Manager** owns identity, assignments, authority, context resources, capability/tool contracts, connector manifests/custody, approvals, event routing, work materialization, durable commands/effects, receipts, metering, and repair.
- **Hermes** supplies per-employee reasoning, session continuity, runs, tool use, memory, and runtime-local execution.
- **Model Gateway** is the employee-scoped model and commercial boundary.
- **Host Provisioner** is the only service with Docker-host authority.
- **PostgreSQL/Supabase** is durable authority, event, commercial, evidence, and reconciliation state.
- **Caddy** is public ingress and per-employee reverse-proxy surface.
- **Provider and protocol adapters** connect external systems without replacing AMTECH assignment, work-object, approval, effect, and proof authority.

## Reading order

1. [`01-product-business-and-system-context.md`](01-product-business-and-system-context.md)
2. [`02-network-container-and-runtime-topology.md`](02-network-container-and-runtime-topology.md)
3. [`03-ingress-events-ambient-inbox-and-egress.md`](03-ingress-events-ambient-inbox-and-egress.md)
4. [`04-hermes-context-capabilities-and-power-user-operation.md`](04-hermes-context-capabilities-and-power-user-operation.md)
5. [`05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`](05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md)
6. [`06-effect-graphs-failure-semantics-and-observability.md`](06-effect-graphs-failure-semantics-and-observability.md)
7. [`07-emergent-product-capability-and-use-case-manifold.md`](07-emergent-product-capability-and-use-case-manifold.md)
8. [`08-repository-archaeology-audit-and-cleanup.md`](08-repository-archaeology-audit-and-cleanup.md)
9. [`09-current-bug-risk-and-production-gap-register.md`](09-current-bug-risk-and-production-gap-register.md)
10. [`trajectories/README.md`](trajectories/README.md)
11. [`11-agent-orientation-and-role-map.md`](11-agent-orientation-and-role-map.md)
12. [`12-document-control-memory-and-handoff-map.md`](12-document-control-memory-and-handoff-map.md)
13. [`13a-complete-memory-handoff-catalog.md`](13a-complete-memory-handoff-catalog.md)
14. [`14-infrastructure-deployment-and-test-coverage-audit.md`](14-infrastructure-deployment-and-test-coverage-audit.md) — historical point-in-time audit; read its supersession banner first.
15. [`15-artifact-workbench-runtime-capability-and-golden-employees.md`](15-artifact-workbench-runtime-capability-and-golden-employees.md)
16. [`16-standard-research-basis-and-protocol-disposition.md`](16-standard-research-basis-and-protocol-disposition.md) — research basis for Standard v0.2, managed connector authorization, MCP Apps, AG-UI, database proof, supply chain, and risk frameworks.

## Protocol disposition

- **AMTECH labor protocol** remains durable authority: identity, assignment, work object, approval, effect, receipt, recovery, and commercial state.
- **MCP core** is the tool/resource/prompt and remote-authorization interoperability layer.
- **MCP Apps** is the official negotiated interactive MCP extension target. Existing `ui://`, iframe, and bounded-intent machinery is compatibility groundwork, not a complete conformance claim.
- **AG-UI** is an optional role-safe event/state adapter. It is not AMTECH authority or a generated-UI schema.
- **Generated views** are typed AMTECH work projections and can be adapted to native Web, MCP Apps, AG-UI, SMS, Review, and future clients.

## Source authority order

1. deployed release-bound behavior and retained proof;
2. applied migrations and durable state;
3. executable source and generated production configuration;
4. exact-SHA tests, workflows, and acceptance artifacts;
5. ratified `STANDARD.md` and the active production program;
6. current root/scoped CODEGRAPHs and this architecture directory;
7. newest indexed memory handoff;
8. historical records, wiki, plans, fixtures, and screenshots.

No architecture document upgrades acceptance beyond the strongest executable evidence.

## Verification vocabulary

- **source-wired** — source/schema/config exists and named checks ran.
- **locally-proven** — deterministic local/fixture proof passed.
- **ci-accepted** — exact SHA passed named reproducible CI.
- **database-accepted** — disposable/staging database passed the required platform/release behavior proof.
- **runtime-accepted** — exact target-host runtime/network proof exists.
- **provider-accepted** — real provider receipts/IDs exist.
- **browser/channel-accepted** — fixture-free supported-channel proof exists.
- **commercial-accepted** — usage, cost, payer/beneficiary, and invoice reconciliation passed.
- **production-ready** — every non-waivable Standard gate passes on the exact deployed SHA.
- **historical** — retained point-in-time evidence that may be superseded.
- **incomplete** — source-wired boundary lacking required implementation or acceptance.

## Canonical subsystem map

| Plane | Durable or executable authority | Primary source hubs | Current state |
|---|---|---|---|
| Identity and assignment | principals, memberships, assignments, grants, policies | migrations `0039`, `0053`, `0064`–`0072`; assignment authority | source/CI accepted; live shared-policy proof incomplete |
| Owner session | Supabase Auth → Manager-minted authority-versioned HttpOnly session | Web login; owner session; onboarding routes | source/CI accepted; fixture-free matrix incomplete |
| Command/effect | durable registration, claim, effect reservation, terminal/ambiguous receipt | migration `0041`; durable command; repair | source/CI accepted; provider ambiguity/recovery incomplete |
| Runtime provisioning | desired resources, reconciler, signed Unix-socket provisioner | reconciler; provisioner; profile renderer | source-wired; target-host proof incomplete |
| Employee runtime | immutable profile plus scoped Hermes data/workspace | profile renderer; launcher; exact-image proof | exact-image filesystem proof accepted; deployed fleet proof incomplete |
| Network ingress | host-network Caddy and loopback services | production Compose; Caddyfile; activation | source-wired; target-host proof incomplete |
| Model/commercial | scoped model credential, payer/beneficiary/price, receipts | Model Gateway and commercial attribution | core source accepted; shared budget/rate incomplete |
| Provider ingress | verified webhook/event → ambient inbox | webhooks; event ingress; ambient inbox | source/CI accepted; live reconciliation incomplete |
| Connector setup/custody | risk-derived custody and native setup manifest | connector registry/setup; Manager routes | source/CI in progress; final Gate 0 matrix pending |
| Effective capabilities | advertisement ∩ runtime ∩ dependency ∩ credential ∩ network ∩ policy ∩ connector ∩ probe | capability registry/catalog/evidence; migration `0070` | decision contract source-wired; release report incomplete |
| Artifact workbench | canonical head, immutable revisions/validation, exact approval, publication receipts | migrations `0070`–`0072`; artifact services | source/CI accepted; golden live proof incomplete |
| Work materialization | strict snapshots → envelopes/resources/actions/layout | strict stream; materialization; operating surface | source/CI accepted |
| Generated UI | typed WorkView → sandboxed host-routed intent | UI resources; renderer; generated-view contracts | source/CI accepted; provider-backed browser proof incomplete |
| MCP Apps adapter | negotiated interactive MCP resources and host JSON-RPC | planned adapter over existing UI-resource seam | research-specified, not conformance accepted |
| AG-UI adapter | role-safe lifecycle/message/tool/state projection | current work stream plus planned versioned adapter | partial analogous source; conformance incomplete |
| Database evidence | local/CI PostgreSQL plus selective disposable Supabase gates | migration runner; integration tests; live proof harness | routine TDD source-wired; release proof environment-specific |
| Release evidence | audit, provider/accounting/effect receipts, hashes, provenance | release evidence; workflows; acceptance scripts | source/CI accepted; signed deployed manifest incomplete |

## Non-negotiable invariants

1. Manager owns authority; Hermes reasons and executes only within bound capabilities.
2. Reads are not effects; authoritative read failure fails closed rather than becoming empty state.
3. Consequential work uses assignment-aware approval and command/effect boundaries.
4. Provider master credentials stay outside employee profiles and runtimes.
5. Capability discovery is broad; execution custody is conservative, explicit, and evidence-backed.
6. Unknown or underspecified direct-MCP risk is denied.
7. Generated UI and protocol adapters are presentation, not authority.
8. External delivery may be at least once; internal effects are idempotent and receipt-backed.
9. Documentation and acceptance claims bind exact SHA and declared environment.
10. Historical records remain historical and are routed through current indexes.
11. A live database is not the routine TDD loop, and local PostgreSQL does not waive platform-specific release proof.
12. Artifacts persist work product; they do not create a parallel workflow/authority engine.
