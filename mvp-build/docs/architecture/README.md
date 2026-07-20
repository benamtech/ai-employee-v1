# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map on merged main; live deployment acceptance incomplete**  
Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Standard: ratified [`../../STANDARD.md`](../../STANDARD.md) v0.2  
Active program: [`../../second-half-plan/2026-07-19-ratified-standard-production-program/`](../../second-half-plan/2026-07-19-ratified-standard-production-program/)

This directory describes current source on merged `main`, separates implementation from acceptance, and records research/protocol disposition without claiming external certification. The cutover branch and `research` are historical context.

## System boundary

- **Web** presents owner, review, onboarding, public, billing, and operator experiences.
- **Manager** owns identity, assignments, authority, context, capability/tool contracts, connector custody, approvals, events, work materialization, durable effects, receipts, metering, repair, and proof.
- **Hermes** supplies per-employee reasoning, sessions/runs, tool use, memory, and runtime-local execution.
- **Model Gateway** is the employee-scoped model/commercial boundary.
- **Host Provisioner** alone owns Docker-host authority.
- **PostgreSQL/Supabase** is durable authority, event, commercial, evidence, and reconciliation state.
- **Caddy** is public ingress and employee reverse-proxy surface.
- **Provider/protocol adapters** connect systems without replacing AMTECH assignment, work, approval, effect, and proof authority.

## Reading order

1. `01-product-business-and-system-context.md`
2. `02-network-container-and-runtime-topology.md`
3. `03-ingress-events-ambient-inbox-and-egress.md`
4. `04-hermes-context-capabilities-and-power-user-operation.md`
5. `05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`
6. `06-effect-graphs-failure-semantics-and-observability.md`
7. `07-emergent-product-capability-and-use-case-manifold.md`
8. `08-repository-archaeology-audit-and-cleanup.md`
9. `09-current-bug-risk-and-production-gap-register.md`
10. `11-agent-orientation-and-role-map.md`
11. `12-document-control-memory-and-handoff-map.md`
12. `15-artifact-workbench-runtime-capability-and-golden-employees.md`
13. `16-standard-research-basis-and-protocol-disposition.md`
14. `17-hermes-upstream-review-protocol.md`

Current prioritization and execution detail live in the active program:

- `04-dependency-ordered-production-plan.md` — Phases 1.1–1.9 and later release/pilot phases;
- `08-production-issue-vector.json` — scored 38-issue source;
- `09-workstream-execution-map.md` — nine dependency workstreams;
- `10-test-suite-disposition.md` — current test authority.

## Protocol disposition

- AMTECH labor protocol remains durable authority: identity, assignment, work, approval, effect, receipt, recovery, and commercial state.
- MCP core is tool/resource/prompt and remote-authorization interoperability.
- MCP Apps is the official negotiated interactive MCP target; current `ui://`/iframe machinery is compatibility groundwork, not complete conformance.
- AG-UI is an optional role-safe event/state adapter, not authority or generated-UI schema.
- Generated views are typed AMTECH work projections adaptable to Web, MCP Apps, AG-UI, SMS, Review, and future clients.

## Source authority

Deployed proof → applied migrations/durable state → executable source/config → exact-SHA tests/workflows → Standard/active program → CODEGRAPH/architecture → newest indexed memory → history.

## Current evidence state

Final cutover head `d131dd09` passed Ratified Standard workflow `29717830698`, Hermes Upstream Review `29717830703`, and Main Integration Gates `29717830737`. Merge SHA `5e5b8d7` is the current `main` coordinate.

The broad historical `npm run test:unit` aggregate remains red on that cutover head; PR `#23` reports 30 files and 112 failed tests from pre-ratification assignment/principal/fake-RPC/environment fixtures. Named curated suites are current source-contract evidence only and cannot be promoted into a broad or live pass.

## Subsystem map

| Plane | Primary authority | Current state |
|---|---|---|
| repository/test truth | contributor/governance contracts, active program, CI/test disposition | Phase 1.1; post-merge docs being reconciled; broad aggregate red |
| identity/assignment | principals, assignments, grants, policies | source/CI accepted; fixture-free live policy incomplete |
| command/effect | durable command, reservation, receipt, repair | source/CI accepted; provider ambiguity/recovery incomplete |
| runtime provisioning | desired resources, signed provisioner, isolated networks | source-wired; target-host proof incomplete |
| model/commercial | scoped gateway and accounting receipts | core source accepted; cumulative budget/shared rate/ambiguity/reconciliation incomplete |
| provider ingress | verified event → ambient inbox | source/CI accepted; live reconciliation incomplete |
| connector setup/custody | declarative registry/setup manifest | source/CI accepted; remote MCP/live health/revocation incomplete |
| effective capabilities | runtime/dependency/credential/network/policy/connector/probe intersection | decision source-wired; persistent release graph incomplete |
| artifact workbench | immutable revisions, exact approval, publication receipts | source/CI accepted; golden live/parity/refinding proof incomplete |
| generated UI | typed work view → sandboxed host intent | source/CI accepted; provider-backed proof incomplete |
| MCP Apps | negotiated interactive resources and bounded host bridge | research-specified; implementation/conformance incomplete |
| AG-UI | role-safe lifecycle/message/tool/state adapter | partial analogous source; versioned conformance incomplete |
| Hermes upstream intelligence | pinned baseline + scheduled/path-triggered review | cutover review accepted; never automatic upgrade |
| database evidence | local/CI PostgreSQL + selective managed Supabase | routine TDD source-wired; full matrices/release platform proof open |
| release evidence | audit, receipts, hashes, provenance | source/CI contracts accepted; signed deployed manifest incomplete |
| human surface/pilot | supported channels, browser/a11y/capacity/operations | source/fixture foundations; release and controlled-pilot acceptance open |

## Non-negotiable invariants

1. Manager owns authority; Hermes reasons and executes only within bound capabilities.
2. Reads are not effects; authoritative failure fails closed.
3. Consequential work uses assignment-aware approval and effect boundaries.
4. Provider master credentials stay outside employee profiles/runtimes.
5. Capability discovery is broad; execution custody is conservative and evidence-backed.
6. Unknown direct-MCP risk is denied.
7. Generated UI and protocol adapters are presentation, not authority.
8. Internal effects are idempotent and receipt-backed.
9. Documentation and acceptance claims bind exact SHA and environment.
10. A live database is not the routine TDD loop; local PostgreSQL does not waive platform proof.
11. Artifacts persist work product, not a parallel authority engine.
12. Hermes upstream drift triggers review; it never silently moves the production pin.
13. Curated green suites do not conceal a broader red aggregate.
14. Production-ready requires one exact signed deployed candidate to pass every non-waivable gate.
