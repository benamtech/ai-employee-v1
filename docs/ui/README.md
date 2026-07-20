# AMTECH UI Documentation Index

## Read first

1. [`../AMTECH_WEB_DESIGN_SYSTEM.md`](../AMTECH_WEB_DESIGN_SYSTEM.md) — visual source of truth.
2. [`../AMTECH_AGENT_INTERFACE_STANDARD.md`](../AMTECH_AGENT_INTERFACE_STANDARD.md) — operating primitives, adaptive layout, context compilation, delegation, AG-UI, MCP Apps, authority, and evidence.
3. [`../AMTECH_UI_VALIDATION_STANDARD.md`](../AMTECH_UI_VALIDATION_STANDARD.md) — pass/fail release gates and required evidence artifacts.
4. [`AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md`](AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md) — current product/runtime review, protocol selection, role and assignment gaps, operator-TUI boundary, public surfaces, and next-20-hours plan.
5. [`../../mvp-build/STANDARD_UI_RUNTIME_AMENDMENT_2026-07-19.md`](../../mvp-build/STANDARD_UI_RUNTIME_AMENDMENT_2026-07-19.md) — proposed normative amendment; not effective until approved.
6. [`../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md`](../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md) — current branch implementation ledger only.
7. [`HERMES_RUNTIME_UI_DERIVATIONS.md`](HERMES_RUNTIME_UI_DERIVATIONS.md) and [`HERMES_HEARTBEAT_UI_ARCHITECTURE.md`](HERMES_HEARTBEAT_UI_ARCHITECTURE.md) — runtime-derived constraints and fixture-first heartbeat architecture.

## Authority rules

- The first three documents are canonical UI doctrine.
- `mvp-build/STANDARD.md` remains the product standard. The dated amendment is proposed and cannot silently become effective.
- The implementation ledger records current source and evidence state but cannot redefine doctrine.
- Hermes derivations, dated handoffs, research notes, screenshots, fixture descriptions, and historical design experiments are informative unless promoted through the Standard process.
- Official Nous Research Hermes documentation and the `NousResearch/hermes-agent` repository are authoritative for Hermes runtime behavior. Third-party summaries are hypothesis sources only.
- Historical fixed-tab, Home/Talk/Proof/Connected, “369 method,” square-corner, 3px-grid, black-panel, or ink/white/red-only UI guidance is superseded.
- Raw AGENTS.md, CODEGRAPH.md, soul files, private memory, provider payloads, secrets, and chain-of-thought are never browser UI inputs. They compile into bounded doctrine/version/capability signals.
- Manager remains the authority, assignment, C3, connector-custody, billing, projection, and proof boundary. Hermes is a replaceable runtime substrate.

## Active source and proof artifacts

| Artifact | Purpose |
|---|---|
| `mvp-build/apps/web/app/globals.css` | runtime tokens and base components |
| `mvp-build/apps/web/app/login/page.tsx` | real owner login and explicit multi-account selection |
| `mvp-build/apps/web/app/dashboard/page.tsx` | canonical owner workforce navigation |
| `mvp-build/packages/shared/src/operating-system.ts` | typed work loops, active saves, decisions, changes, delegation, and evidence |
| `mvp-build/packages/shared/src/operating-layout.ts` | deterministic adaptive-layout planner and scoring |
| `mvp-build/apps/manager/src/lib/operating-surface.ts` | owner-safe context compiler and operating-state materialization |
| `mvp-build/apps/manager/src/lib/materialization.ts` | role-safe envelopes and quiet-observation normalization |
| `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` | adaptive owner operating surface |
| `mvp-build/apps/web/app/api/employee/[employeeId]/events/route.ts` | bounded-lifetime owner SSE proxy |
| `mvp-build/validation/amtech-agent-ui-vectors.json` | canonical source/fixture UI conformance vectors |
| `mvp-build/validation/amtech-live-ui-role-runtime-vectors.json` | live identity, role, assignment, runtime, UX, and public/operator vectors |
| `mvp-build/scripts/validate-ui-system.mjs` | source validator across login, dashboard, operating surface, Review, MCP Apps, and onboarding |
| `mvp-build/tests/unit/amtech-agent-ui-contract.test.ts` | source, semantic, and planner contracts |
| `mvp-build/tests/unit/observe-work-event-projection.test.ts` | ambient `observe` and stream-lifetime regression contracts |
| `mvp-build/infra/scripts/ui/fixture-browser.mjs` | compiled adaptive/fixture browser matrix |
| `mvp-build/infra/scripts/ui/product-shell-browser.mjs` | compiled login/dashboard product-shell matrix |
| `.github/workflows/ui-agent-operating-surface.yml` | exact-SHA source, type, build, compiled browser, and evidence gate |

## Current implementation state

### Source-wired

- adaptive operating primitives and deterministic bounded layout;
- owner-safe compiled context and evidence;
- stable owner intent IDs and no-replay reconnect behavior;
- sandboxed MCP Apps;
- six fixture employee archetypes, including clothing operations;
- quiet `observe` events remain evidence but no longer manufacture active work;
- owner stream lifetime is bounded so reconnect performs fresh Manager authorization;
- login and dashboard use the canonical Inter/light/soft system with minimum controls and focus states;
- UI source validation includes adjacent product-shell routes;
- compiled product-shell browser coverage is wired into the UI workflow.

### CI evidence before the final documentation synchronization

- shared/database/Manager/web typecheck: green;
- UI source validation and UI contract tests: green;
- production web build: green;
- compiled adaptive fixture matrix: green;
- first widened product-shell run: failed because the workflow did not wait for the standalone server; the server-readiness race is corrected and requires exact-head rerun.

### Blocking production gaps

| Blocker | Required disposition |
|---|---|
| approved real staging target and migrations | identify target, migrate, run advisors, retain exact-SHA evidence |
| fixture-free owner activation and employee packet | run real onboarding/login/dashboard/employee path |
| multi-account live isolation | use distinct employees/runtimes and prove cross-account denial before runtime access |
| general manager/viewer/finance browser roles | blocked until role-aware session minting and projection pass positive/negative tests |
| shared/fractional employee runtime | fail closed until context, memory, session, connector, runtime, capability, proof, recovery, and billing are assignment-partitioned |
| SSE snapshot installation | browser currently schedules a second read instead of atomically installing the initial stream snapshot |
| immediate stream revocation | bounded reconnect is mitigation; Manager-side in-stream authority-version revalidation remains required |
| session token on private Manager URL | replace with internal header or short-lived scoped stream ticket |
| process-local progress | declare best-effort or move to a shared bounded bus; never use as correctness evidence |
| privileged Hermes TUI adapter | documentation only; implement read-only Manager-mediated adapter before any state-changing methods |
| public AI-employee-as-website | fixture/research only until public assignment, context isolation, abuse/cost policy, handoff, and proof are real |
| clothing operations employee | fixture only until Shopify/BOM/inventory/supplier/purchase/fulfillment custody and receipts exist |

## Live test topology

Allowed near-term topology:

```text
Account A -> Employee A1 -> distinct runtime
Account A -> Employee A2 -> distinct runtime
Account B -> Employee B1 -> distinct runtime
```

Required negative vector:

```text
Owner A -> Employee B1 snapshot/stream/command/output/review
-> Manager denial before Hermes, connector, Model Gateway, or provider access
```

Do not run one shared employee runtime across accounts as a success case yet.

## Historical material

Dated memory and handoff files remain useful as an audit trail. When they conflict with canonical documents or executable evidence, preserve them as history and add a superseded notice rather than treating them as current instructions.

Deleted or archived GTM/UI research must be distilled into canonical standards before removal. Do not retain multiple active design doctrines.

## Surface inventory

The implementation ledger and browser/live matrices must cover:

- public front door and future public employee assignment;
- create employee and identity verification;
- login/authentication and multi-account selection;
- owner dashboard;
- owner operating surface;
- signed Review;
- estimator as non-canonical acquisition/regression aid;
- admin/operator console;
- generated work objects;
- AG-UI-style snapshot/delta adapters;
- MCP Apps resources and fallbacks;
- fixture operating lab;
- delegated work and active-save states;
- runtime interruption/recovery;
- cross-account denial;
- role-safe materialization;
- future privileged TUI-gateway adapter.
