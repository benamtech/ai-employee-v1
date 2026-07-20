# 2026-07-19 — UI, Hermes, roles, assignments, and production-readiness handoff

## Branch and evidence

- Branch: `employee-production-tuesday`
- Draft integration PR: `#23` targeting `research`
- `main` was not edited.
- Production-boundary proof anchor remains `a80908e1157e728eb666130c04b0ec285da55102`.
- UI/runtime source anchor before final docs: `fd20a0066c78f82befc2b5ee4c51580cffe40b91`.
- Final exact-head UI run must be recorded after this handoff and control-doc synchronization.
- No real staging, provider, fixture-free browser/channel, commercial, deployment, or launch claim was made.

## Goal of this pass

Ground the recent next-generation UI work in the actual AMTECH production architecture:

```text
browser/public/signed/operator surface
-> Next boundary
-> Manager identity, assignment, role/grant/policy, C3, projection, and proof
-> provisioner/reconciler/runtime route
-> Docker/container/network/sandbox
-> Hermes runtime/session/tool substrate
-> Manager MCP / Model Gateway / connectors
-> provider and runtime receipts
-> durable role-safe state, repair, metering, and release evidence
```

Hermes was treated as one replaceable runtime subsystem, not as the AMTECH product architecture.

## Research grounding

Official Nous Research Hermes docs and repository were treated as authoritative for:

- programmatic integration protocols;
- agent-loop behavior;
- prompt assembly and session-frozen memory/profile snapshots;
- tool and toolset availability;
- MCP configuration;
- provider runtime resolution and fallback;
- API server, TUI gateway, ACP, Desktop, and TUI behavior.

The supplied Medium deep dive was treated only as a checklist/hypothesis source. Unsupported claims about continuous learning, semantic-vector FTS5 behavior, automatic compliance, per-session isolation, HSM custody, live editable prompt layers, and similar details were not adopted without official source and AMTECH proof.

Relevant HCI/agent-UI conclusions:

- use explicit mixed initiative rather than hidden psychographic inference;
- use state snapshots and ordered deltas;
- surface initiative transfer, questions, approvals, return conditions, and evidence;
- keep action guards and authority outside generated presentation;
- adapt density deterministically from observable work state and explicit preferences;
- do not optimize engagement or attention capture;
- do not expose hidden reasoning.

## Hermes integration conclusion

Hermes exposes:

- HTTP API + SSE for language-neutral/web consumers;
- TUI-gateway JSON-RPC for rich custom hosts;
- ACP for IDEs;
- in-process AIAgent for controlled Python embedding.

AMTECH should continue using the HTTP/SSE API behind Manager for ordinary employee runtime work. The owner/public browser must not become a direct TUI-gateway client.

A future AMTECH operator surface may use a narrow Manager-mediated TUI adapter for read-only runtime/session/delegation/usage/capability/recovery materializations, followed later by exact-run interrupt/compress actions through platform authority and C3.

Do not expose arbitrary CLI execution, unrestricted command dispatch, model/config changes, environment mutation, raw secret/sudo requests, unrestricted process control, direct prompt submission outside C3, or direct browser-to-Hermes credentials.

## Capability discovery conclusion

The existing `hermes-client.ts` capability path is correct enough for this pass:

- cached by runtime endpoint;
- force-invalidated after protocol mismatch;
- used to select runs/session fallback;
- intended at provisioning/restart/new-session lifecycle boundaries, not polled continuously.

Capability discovery is not authorization. Effective AMTECH capability remains the intersection of Hermes support, installed toolsets, profile, Manager schema, exact assignment grant, connector custody/health, approval policy, entitlement/budget, and runtime health.

No capability rewrite was performed.

## Confirmed code defects corrected

### 1. Quiet `observe` events became false active work

Problem:

- the new work-event grammar included `observe`;
- task derivation/materialization treated every non-`notify` event as active work;
- ambient inventory/system facts could become false work loops and resurfacing obligations.

Correction:

- `apps/manager/src/lib/materialization.ts` filters `work:<event_id>` tasks for `observe` events before loops/resurfacing derive;
- the event remains a durable `SurfaceEnvelope` and evidence/system change;
- `tests/unit/observe-work-event-projection.test.ts` pins the behavior;
- the regression is part of `npm run test:ui:contracts`.

### 2. Long-lived owner SSE authorization was connection-time only

Problem:

- Manager authorizes the stream once at open;
- a revoked session/assignment could continue receiving deltas until disconnect.

Tuesday mitigation:

- `apps/web/app/api/employee/[employeeId]/events/route.ts` bounds the proxy stream lifetime with `OWNER_STREAM_REAUTH_MS`, default 60 seconds and minimum 15 seconds;
- reconnect forces a fresh Manager authorization decision;
- fetch uses `no-store` and the proxy disables buffering;
- source regression test pins the presence of the mitigation.

Remaining P1:

- Manager-side in-stream authority-version revalidation or immediate close on authority change;
- move owner token off the private Manager URL query into an internal header or scoped stream ticket.

### 3. Owner dashboard drifted from the canonical UI system

Problem:

- dashboard retained superseded IBM Plex Mono/black-shell styling;
- critical actions were 42px;
- the UI validator only scanned the new AgentSurface family, so adjacent production drift passed.

Correction:

- dashboard now uses the canonical Inter/light/soft system;
- actions are at least 48px with focus-visible behavior;
- copy emphasizes exact employee/runtime/assignment separation;
- `scripts/validate-ui-system.mjs` now scans login and dashboard and pins stream-lifetime source behavior.

### 4. Compiled browser gate did not cover the product shell

Correction:

- added `infra/scripts/ui/product-shell-browser.mjs` for compiled login and unauthenticated dashboard checks;
- checks persistent labels, minimum targets, horizontal overflow, canonical typography, and light surfaces;
- added `ui:test:shell`;
- wired it into `.github/workflows/ui-agent-operating-surface.yml` after the compiled adaptive matrix.

First widened run result:

- source/type/build/UI contract gates passed;
- compiled adaptive fixture matrix passed;
- product-shell matrix failed with connection refused because the workflow did not wait for the standalone server;
- fixture-browser temporarily spawned and then killed a fallback `next start` path.

Correction:

- workflow now starts the standalone server, polls `/login` until healthy, fails with retained standalone logs if it exits, and only then runs both matrices.

This harness correction requires a final exact-head rerun.

## UI architecture conclusions

### Keep

- work loops;
- active saves and explicit return conditions;
- decisions/approvals;
- meaningful changes;
- outcome-bound delegation;
- evidence/receipts;
- contextual command;
- deterministic finite layout planner;
- explicit owner-safe context manifest;
- sandboxed MCP Apps;
- compiled fixture lab for ambitious archetypes.

### Reject or defer

- WebGPU reaction-diffusion as a release dependency;
- CSG/SDF runtime layout composition;
- sentiment/fatigue/personality/approval-propensity inference;
- Fokker-Planck or HJB optimization as product code;
- private chain-of-thought/scheming trajectory display;
- browser-owned self-healing or process restarts;
- raw tool/log/PID/CPU/RSS displays for ordinary owners;
- direct editing of Hermes memory/profile files;
- direct owner/public TUI gateway access;
- unrestricted generative layouts.

The useful abstraction is not a continuous physics field. It is a finite typed policy planner over observable durable state, explicit user preferences, risk, authority, freshness, and evidence.

## Role and account findings

The database relationship model supports owners, admins, managers, operators, viewers, supervisors, approvers, finance roles, multi-account users, and shared/fractional labor.

The ordinary owner session minting path currently requires account membership role `owner` or `admin`.

Production browser claims are therefore limited to:

- account owner;
- account admin where exact assignment grants permit;
- exact signed-review resolver;
- separate platform-admin/operator path.

Do not claim general manager/viewer/finance browser perspectives yet.

Future work should compile a Manager-owned ViewerContext containing principal, account, assignment, relationship roles, resource grants/actions, authority/session versions, projection policy, and detail level. The browser must not infer role from route or local UI state.

## Shared/fractional employee finding

The relationship ontology supports shared employees, but context/runtime partitioning does not yet conform end to end.

Observed gaps:

- employee manifest lookup is employee-global;
- business facts and context-primer sessions are generally account + employee rather than exact assignment;
- runtime-local profile/memory/session and connector/capability/deletion boundaries are not proven for multiple active business assignments;
- effective capability and runtime route remain employee-oriented.

Production rule:

- one live runtime has one active business assignment until the full partition matrix passes;
- multiple employees per account are supported and should be tested;
- one employee runtime shared across accounts must fail closed.

Safe near-term live topology:

```text
Account A -> Employee A1 -> distinct runtime
Account A -> Employee A2 -> distinct runtime
Account B -> Employee B1 -> distinct runtime
```

Required negative vector:

```text
Owner A -> Employee B1 snapshot/stream/command/output/Review
-> Manager denies before Hermes, connector, Model Gateway, or provider access
```

Safer future shared-identity design: one platform employee identity with separate assignment-specific runtime instances, profiles, memories, credentials, networks, work state, capability evidence, and billing; sanitized cross-assignment learning only by explicit shared-resource grant.

## Public AI-employee-as-website conclusion

A public employee is not an unauthenticated owner surface. It requires a separate public assignment/policy scope with:

- visitor identity/session and abuse controls;
- allowlisted intents/data classes;
- public-only context and memory;
- effect/approval boundaries;
- owner/human handoff;
- cost/rate limits;
- durable work/proof;
- retention/deletion policy.

Do not expose owner-private business brain, customer data, internal prices, work queue, credentials, or raw runtime state.

## Clothing operations conclusion

The fixture is a high-value strategic employee concept, but production readiness requires real custody and receipts for:

- Shopify orders/events;
- SKU/BOM/material requirements;
- supplier prices and timestamps;
- inventory/work-in-process;
- production capacity and due dates;
- purchase authority/budget;
- fulfillment/shipping;
- margin provenance;
- cancellations, returns, and reconciliation.

The owner UI should focus on exceptions: order risk, material shortfall, smallest safe purchase, capacity conflict, margin erosion, fulfillment failure, and post-action evidence. Do not build a generic ERP dashboard before the durable state exists.

## Documentation and validation added

- `docs/ui/AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md`
- `mvp-build/STANDARD_UI_RUNTIME_AMENDMENT_2026-07-19.md` — proposed only
- `mvp-build/validation/amtech-live-ui-role-runtime-vectors.json`
- `mvp-build/CODEGRAPH_UI_RUNTIME_2026-07-19.md`
- updated `docs/ui/README.md`
- this handoff

The Standard amendment proposes:

- `observe | notify | question | review` grammar alignment;
- Manager-owned runtime protocol hierarchy;
- lifecycle capability discovery/evidence;
- snapshot/delta and stream authorization rules;
- ViewerContext/role-safe materialization;
- hard assignment-partition gate for shared employees;
- privileged Manager-mediated TUI operator surface;
- separate public employee assignment;
- new live UI/runtime pass/fail vectors.

It is not effective until human-operator approval.

## P0 next

1. Identify approved real Supabase staging and apply migrations through `0068`.
2. Run advisors and retain exact-SHA migration/behavior evidence.
3. Capture fixture-free onboarding, real login/account selection, dashboard, employee surface, and signed Review.
4. Provision A1/A2/B1 as distinct runtimes; prove container/network/profile/credential isolation and cross-account denial.
5. Run one harmless real work loop per employee; prove refresh/reconnect does not replay.
6. Interrupt one accepted-start runtime and reconcile the same intent without a duplicate runtime/provider/effect.
7. Execute one real gated effect and prove C3 terminal state, provider receipt, audit, metering, and browser evidence.
8. Keep unsupported roles and shared runtime fail closed.

## P1 next

- install the initial SSE snapshot directly and add cursor/version divergence handling;
- compile ViewerContext and role-safe projections;
- remove private-hop query token;
- implement immediate stream authority-version revalidation;
- persist capability-probe evidence/effective graph hash;
- define progress as best-effort or use a shared bounded bus;
- add fixture-free product-shell/account-denial browser tests;
- declare/measure performance and accessibility budgets;
- design-spike a read-only Manager-mediated Hermes TUI adapter.

## P2 next

- assignment-isolated fractional runtime model;
- public employee-as-website pilot;
- real clothing operations connectors/state/effects;
- richer operator runtime materializations;
- bounded schema-selected generated components after authored baselines pass.

## Final status sentence

The UI is now a substantially better projection of accountable employee labor and is source/build/fixture shaped for production testing, but AMTECH is not production-ready until real staging, distinct-runtime isolation, fixture-free owner/browser packets, recovery, receipt-backed effects, and exact deployed-SHA evidence pass.
