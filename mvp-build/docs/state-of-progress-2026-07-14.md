# State Of Progress - 2026-07-14

Status: active declarative update  
Scope: whole-product MVP state, second-half plan progress, recent context-engineering changes  
Authority: factual orientation only; `CODEGRAPH.md`, memory handoffs, and source remain the implementation record

## Executive State

AMTECH now has a broad `source-wired` AI Employee product shell, not only an estimate app prototype.
The repo contains the owner web surface, signed mobile review, SMS/event paths, artifact and approval
contracts, Manager tools, connector seams, materialization/capability contracts, an operator admin
console, a metering foundation, context-engineering primitives, and a production-shaped runtime
substrate.

The product is still not trial-ready for real owners. The remaining launch blockers are live
provider/runtime proof, the real-VPS run, durability/observability, egress apply, real capacity
measurement, old employee reprovisioning onto scoped credentials, and funded provider-backed Hermes
tool-loop acceptance. Local tests and fixture screenshots prove source/UI behavior only.

## Whole-Product Progress

The intended whole-product loop remains:

```text
signup/claim -> live employee -> owner asks for estimate -> artifact appears
  -> owner approves customer send -> Gmail send proof
  -> customer reply event -> owner approves deposit invoice
  -> payment/reminder/proof return to the owner surface
```

Current source state against that bar:

- Onboarding, claim, account, and employee provisioning are source-wired.
- The Manager control plane owns tools, claims, owner turns, artifacts, approvals, webhooks, scheduler,
  repair paths, materialization routes, admin routes, metering helpers, and scoped MCP identity.
- The owner-facing UI has been rebuilt again into the active Avery-first MVP direction: Home, Talk,
  Proof, and Connected, centered on Tell Avery, Needs your say, quiet Watching, exact approvals, and
  proof. This supersedes the rejected dashboard/agent-desktop/chat-native directions.
- Signed mobile Review renders the same `WorkResource`/`WorkAction` approval model as the owner route.
- Gmail, Stripe, and QuickBooks Online connectors are source-wired at the Manager/control-plane level,
  with approval gates for customer-facing, money, and durable external writes.
- `SurfaceEnvelope`, `ConnectionSurface`, `CapabilityGraphNode`, `ResurfaceItem`, and MCP-UI resource
  seams exist so the same work can be rendered across owner web, SMS links, admin, and future surfaces.
- Internal admin/ops is source-wired enough for founder-operated repair/readiness, but billing is still
  scaffolded and intentionally parked behind live proof.
- The Docker/Caddy employee runtime substrate has been proven on a real Docker host for core services,
  employee lifecycle, DNS/routing, and local capacity tier 5; it is not yet proven on the real VPS.

What is not claimed:

- No live Twilio/Gmail/Stripe/Intuit/Hermes provider proof ids for the current end-to-end loop.
- No funded-model Hermes LLM tool-loop acceptance for the current source state.
- No real-VPS reboot recovery, egress apply, production backup/restore, observability, or final capacity
  number.
- No real-owner pilot readiness.

## Second-Half Build Plan Progress

The second-half plan should now be read with the following status:

| Phase | Status | Declarative update |
|---|---|---|
| 0 - Current-state handoff | done | The repo has durable memory, codegraphs, and source maps sufficient for a fresh agent to orient. |
| 1 - Preserve and close live gate | source-wired/static-green; live gate blocked | Manager-as-MCP, scoped identity, live employee spine, and runtime handoff are preserved. Closing the live gate still depends on funded provider-backed Hermes tool execution. |
| 2 - Owner Work Surface redesign | source-wired with local UI proof | The current implementation is Avery-first Home/Talk/Proof/Connected, not the older multi-region desk. Headless and headed fixture UI smokes passed locally; live runtime/browser proof is still pending. |
| 3 - SMS ambient inbox and signed previews | source-wired; live SMS proof pending | Signed, scoped Review links reuse the same work/action model and wake path. Provider-backed SMS/tool-loop proof remains pending. |
| 4 - Tool-agnostic capability/rendering | source-wired; live proof pending | Materialization, capability graph, Connector Center, resurfacing projection, and MCP-UI seams are in source. Live provider/runtime proof remains pending. |
| 5 - Trial ops/admin/billing | source-wired/admin sufficient; billing scaffold only | The operator console, support-action audit, readiness, provider views, and billing model scaffold exist. Billing polish and automated collection remain parked. |
| 6 - Free trial / paid pilot readiness | planned; deploy foundation partially proven | Docker/Caddy substrate proof exists on a local real Docker host. Real-VPS recovery, durability, observability, egress, capacity, and live provider proof still gate trials. |

The most important product correction is Phase 2: the owner surface should no longer be described as
a multi-region employee desk, generic SaaS dashboard, or chat transcript with side panels. It is now
Avery as the primary interface, with exact permission and proof moments.

## Recent Context-Engineering Changes

Context engineering has moved from planning into source-wired substrate:

- CE-1 made the business brain an integrated reference/index layer rather than a facts blob. Profile
  generation now seeds Hermes-native memory files and Manager-owned business-brain references; the
  primer is once-per-session and reference-shaped, not a per-turn digest.
- CE-2 added production-shaped compression/delegation/hook configuration, model-context metadata as
  a single shared input, and the `amtech-hygiene` Hermes plugin for secret redaction and pathological
  bulk trimming.
- CE-3 added Manager-owned session rotation before compaction pressure, preserving the memory session
  while rotating transcript sessions and carrying forward the next action.
- CE-4 generalized connector custody/readiness through a shared connector registry and policy seams,
  including direct read-only MCP connector projection while keeping write/money/customer-facing actions
  Manager-mediated.
- The estimator materialization research and profile-generator probe show the direction for public
  website estimator surfaces, but visitor-session isolation and deterministic HTML-to-PDF remain the
  clearest missing primitives before that becomes product-ready.

Context-engineering live acceptance remains pending: the repo has source-wired hooks, session rotation,
and connector policy seams, but it still needs reprovisioned employees and live Hermes/provider proof.

## Current Verification Snapshot

The latest UI implementation pass recorded:

- `npm run test:unit -- --run tests/unit/work-surface-model.test.ts`
- `npm run typecheck --workspace @amtech/web`
- `npm run ui:test`
- `UI_FIXTURE_BASE_URL=http://127.0.0.1:3200 npm run ui:test:headed`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit` - 90 files / 570 tests
- `npm run build`

The headed UI smoke required an explicit fixture Next server and escalated execution because the
sandbox blocked the normal raw-socket readiness probe. This is a local tool limitation, not a product
acceptance upgrade.
