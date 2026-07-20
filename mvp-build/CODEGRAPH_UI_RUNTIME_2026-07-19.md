# CODEGRAPH overlay — UI, Hermes, roles, assignments, and live production testing

Status: active scoped overlay  
Date: 2026-07-19  
Branch: `employee-production-tuesday`  
Production-boundary proof anchor: `a80908e1157e728eb666130c04b0ec285da55102`  
UI/runtime source anchor: `fd20a0066c78f82befc2b5ee4c51580cffe40b91`; final exact-head UI rerun pending after documentation synchronization

This overlay supplements `CODEGRAPH.md`; it does not delete the detailed Lane 1–10 history. Source, migrations, executable proof, and newest memory remain authoritative.

## Product boundary

```text
public visitor / owner / admin / exact reviewer / AMTECH operator
-> web, SMS, signed Review, public, or operator surface
-> Manager identity and relationship resolution
-> exact account + employee assignment
-> current role + grant + policy + authority version
-> stable durable intent + C3 command/effect
-> assignment-owned runtime route
-> Hermes agent/session/tool substrate
-> Manager MCP / Model Gateway / connector custody / sandbox
-> provider and runtime receipts
-> role-safe state projection, audit, metering, repair, and proof
```

Manager is the labor control plane. Hermes is a replaceable runtime substrate.

## Current source graph

### Owner/public web

- `apps/web/app/login/page.tsx` — real owner credential form and explicit account selection.
- `apps/web/app/dashboard/page.tsx` — authorized employee navigation; canonical UI system.
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx` — adaptive employee operating surface.
- `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx` — signed exact-resource review.
- `apps/web/app/api/employee/[employeeId]/resources/route.ts` — owner-authorized snapshot proxy.
- `apps/web/app/api/employee/[employeeId]/events/route.ts` — bounded-lifetime SSE proxy.
- `apps/web/app/ui-lab/**` — fixture-only employee operating lab.

### Manager projection and authority

- `apps/manager/src/lib/owner-session.ts` — human principal/session/authority version enforcement.
- `apps/manager/src/lib/owner-assignment-authority.ts` — exact assignment/grant/policy resolution.
- `apps/manager/src/lib/owner-turn-command.ts` — stable C3 owner command before Hermes.
- `apps/manager/src/lib/employee-stream.ts` — assignment-bound snapshot and work-event stream.
- `apps/manager/src/lib/materialization.ts` — safe envelopes; `observe` stays evidence and not active work.
- `apps/manager/src/lib/operating-surface.ts` — context, loops, saves, decisions, changes, delegation, evidence, layout.
- `apps/manager/src/lib/capability-registry.ts` — Manager-effective capability graph.
- `apps/manager/src/lib/hermes-client.ts` — Hermes HTTP/SSE integration and cached lifecycle capability discovery.
- `apps/manager/src/lib/runtime.ts` — assignment-owned runtime turn path.
- `apps/manager/src/lib/provisioning-reconciler.ts` — desired/observed runtime lifecycle.
- `apps/manager/src/provisioner-host.ts` — Docker/runtime host effects.

### Shared contracts

- `packages/shared/src/operating-system.ts` — work loops, saves, decisions, changes, delegation, evidence, context.
- `packages/shared/src/operating-layout.ts` — deterministic bounded layout.
- `packages/shared/src/work-events.ts` — `observe | notify | question | review` grammar.
- `packages/shared/src/command-effect.ts` — C3.
- `packages/shared/src/relationship-contract.ts` and authorization helpers — labor/role/assignment ontology.

### Tests and release gates

- `validation/amtech-agent-ui-vectors.json` — source/fixture conformance.
- `validation/amtech-live-ui-role-runtime-vectors.json` — live identity, role, assignment, runtime, UX, operator, and public vectors.
- `tests/unit/observe-work-event-projection.test.ts` — quiet event and stream-lifetime contracts.
- `scripts/validate-ui-system.mjs` — login/dashboard/operating/Review/onboarding source gate.
- `infra/scripts/ui/fixture-browser.mjs` — compiled adaptive and fixture matrix.
- `infra/scripts/ui/product-shell-browser.mjs` — compiled login/dashboard matrix.
- `.github/workflows/ui-agent-operating-surface.yml` — source, type, build, standalone server, browser, and evidence gate.

## Hermes protocol selection

Official Nous Research docs and source define:

- API server: HTTP + SSE for web/language-neutral consumers;
- TUI gateway: rich JSON-RPC over stdio/WebSocket for custom hosts;
- ACP: IDE consumers;
- in-process AIAgent: controlled Python embedding.

AMTECH choice:

- Manager uses the API server for ordinary runtime work, run events, health, capabilities, approval, and stop where policy permits.
- The browser never talks to Hermes directly.
- A future AMTECH operator adapter may use selected TUI-gateway methods through Manager.
- ACP is not an owner/public protocol.

## Capability resolution

Hermes capability discovery is already cached by endpoint and invalidated on protocol mismatch. It is a lifecycle reconciliation probe after provisioning, restart/recovery/replacement, new session, or approved upgrade.

Effective AMTECH capability is the intersection of:

```text
Hermes endpoint support
∩ installed/available toolsets
∩ profile package
∩ Manager schema
∩ exact assignment grant
∩ connector custody and health
∩ approval policy
∩ entitlement/budget
∩ runtime health
```

Hermes availability can narrow capability; it cannot grant authority.

## Role boundary

The relationship schema supports owner, admin, manager, operator, viewer, supervisor, approver, finance, and shared/fractional relationships.

The ordinary browser session path currently mints sessions only for account `owner`/`admin`. Therefore:

- owner/admin live browser testing is valid when exact assignment grants pass;
- exact signed-review resolver is valid;
- AMTECH platform operator uses a separate platform-admin session;
- general manager/viewer/finance browser claims are blocked until real session and role-safe projection exist.

Future materialization should compile a Manager-owned `ViewerContext` from principal, assignment, roles, grants, authority version, and projection policy. The browser must not infer role from routes or component state.

## Shared/fractional employee boundary

The authorization ontology supports shared labor, but context/runtime partitioning does not yet.

Current gaps include employee-global manifest lookup and account+employee rather than exact-assignment context/session/fact paths. Runtime-local memory, profile, connector, capability, and deletion boundaries are not proven for multiple active business assignments.

Production rule: one live runtime has one active business assignment until the entire partition matrix passes.

Near-term topology:

```text
Account A -> Employee A1 -> distinct runtime
Account A -> Employee A2 -> distinct runtime
Account B -> Employee B1 -> distinct runtime
```

Required denial: Owner A cannot read or act on Employee B1 before runtime/provider access.

The safer future shared-identity model is one platform employee identity with separate assignment-specific runtime instances and explicit sanitized cross-assignment sharing.

## Owner-safe projection

The owner sees accountable labor state:

- highest-priority work and decisions;
- active saves and return conditions;
- meaningful changes;
- delegated purpose and result;
- proof and receipts;
- bounded context provenance and freshness;
- runtime working/stalled/recovering state only when it prevents duplicate action.

The owner does not see raw prompts, private memory files, reasoning, tool arguments, terminal output, provider payloads, credentials, process IDs, or unrestricted runtime controls.

## Privileged TUI adapter

Reasonable first-phase read methods, behind Manager platform authority:

- session status/history lineage/usage;
- delegation status;
- active-session compatibility inspection;
- selected reduced gateway and tool lifecycle events;
- capability diff and recovery state.

Possible Manager-mediated actions:

- interrupt exact run/session;
- compress exact session;
- interrupt exact delegated unit;
- respond only to an existing AMTECH question/approval with an authorized resolver.

Do not expose arbitrary CLI execution, unrestricted command dispatch, model/config switching, environment mutation, direct secret/sudo handling, raw terminal access, or direct browser-to-Hermes credentials.

## Public employee-as-website

A public employee surface is a separate public assignment with:

- visitor identity/session and abuse controls;
- allowlisted intents and data classes;
- public-only context/memory;
- cost/rate limits;
- explicit effect and approval boundaries;
- owner/human handoff;
- durable work and proof;
- retention/deletion policy.

It must never inherit the owner session or private business brain.

## Current corrections

- `observe` no longer creates false active work or resurfacing.
- owner SSE connections have a bounded lifetime and fresh reauthorization on reconnect.
- login/dashboard now follow the canonical Inter/light/soft system with minimum controls and focus states.
- source validation covers adjacent product-shell routes.
- compiled product-shell browser testing is wired.
- the first widened browser run exposed a standalone readiness race; the workflow now waits for the real standalone server before testing.

## P0

1. Approved real Supabase target and migrations through `0068`.
2. Fixture-free onboarding, login/account selection, dashboard, employee, and Review packet.
3. Three distinct runtimes A1/A2/B1 plus cross-account denial.
4. One real work loop per employee with refresh/reconnect no replay.
5. One accepted-start interruption and same-intent recovery without duplicate effect.
6. One real gated effect with C3/provider/audit/metering/browser evidence.
7. Unsupported roles and shared runtime fail closed.

## P1

- install initial SSE snapshot directly with cursor/version handling;
- compile role-aware ViewerContext and projection tests;
- replace private-hop URL session token with header or scoped stream ticket;
- add immediate Manager-side stream authority revalidation;
- persist lifecycle capability-probe evidence;
- define progress as best-effort or use a shared bus;
- add fixture-free product-shell and denial browser tests;
- set performance/accessibility budgets;
- design-spike the read-only Manager-mediated TUI adapter.

## P2

- assignment-isolated fractional runtimes;
- public employee-as-website pilot;
- real clothing-operations Shopify/BOM/inventory/purchase/fulfillment path;
- richer operator materializations;
- bounded generated components after authored baselines pass.

## Evidence state

The production-boundary anchor is branch-CI accepted through S10.1 and migrations `0068`, but no real staging/live/provider/commercial/deployment claim exists.

The current UI/runtime source requires one final exact-head workflow run after the canonical handoff/docs commits. A fixture or source gate never counts as fixture-free production acceptance.
