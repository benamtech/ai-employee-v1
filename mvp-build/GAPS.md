# AMTECH Phase 2 Standard Enforcement Audit — GAPS

**Audit date:** 2026-07-18  
**Repository:** `benamtech/ai-employee-v1`  
**Audited branch:** `employee-work`  
**Base branch:** `research`  
**Audited source head:** `d963efcaff9285cdf8ebc6c069213a2cda7d110d`  
**Standard:** `mvp-build/STANDARD.md`, AMTECH STANDARD v0.1 Draft 2, blob `21a4d3c0e155e91592b60747252ede48efe6f97a`  
**Human approval:** explicit in the operator instruction dated 2026-07-18: “i approve of the standard.”  
**Enforcement constraint:** `STANDARD.md` was not modified. `main` was not modified. No remediation code was implemented.

## 1. Audit identity, evidence boundary, and inventory accountability

Role applied: principal infrastructure, security, distributed-systems, and AI-labor auditor. The governing evidence order was deployed release-bound proof; database constraints/RLS/grants; executable source and production configuration; tests and acceptance scripts; canonical runbooks; newest memory; plans/fixtures/archives.

The audited source head is the pre-audit implementation head. Audit-document commits created after that SHA are not implementation evidence.

### Validation performed

- Resolved PR `#19` as `employee-work` targeting `research`; verified head `d963efcaff9285cdf8ebc6c069213a2cda7d110d` and base `7e61c8d37c611ca24137869f104aa43f246796fc`.
- Read the required identity, scoped instructions, scoped and root codegraphs, full standard, six newest memory summaries, and the two newest relevant full handoffs.
- Accounted for active files by tracked surface and applicability class using the branch/base comparison, the 55-file PR delta, workspace manifests, import/registration graphs, migration ledger, workflow, proof manifest, and scoped codegraph.
- Deep-read every consequential production boundary named in the findings: identity/account creation, memberships/RLS, owner sessions, Manager HTTP/MCP transports, approval tools, signed preview links, turn queue, provider ingress, ambient inbox/effect receipts, model gateway, provisioning reconciler, admin/support, entitlements/metering, web surface, deployment workflow, live-proof manifest, and newest implementation records.
- Inspected happy path, denial path, duplicate/replay path, concurrency points, restart/recovery claims, revocation behavior, provider receipt handling, and deployment-evidence state where source exposed those paths.
- Verified the current GitHub Actions run `29632149822` completed successfully for its declared narrow job and produced migration, Manager typecheck, and focused-test artifacts.

### Validation not performed

- No destructive production or provider tests.
- No live Supabase migration application.
- No deployed browser, SMS, Gmail, Stripe, QuickBooks, model-provider, Caddy, Docker-host, DNS, backup/restore, or VPS execution.
- No customer data or secrets were read.
- No local build or test rerun was possible because the execution environment had no GitHub network resolution and no `gh` binary. The release-bound CI artifacts and source were inspected instead.
- No claim is made that CI PostgreSQL equals Supabase acceptance.

### Active-file inventory ledger

Every active tracked file under the included scope was assigned to one of these applicability buckets. Files excluded by policy remain inventoried as excluded, not silently omitted.

| Inventory bucket | Included paths | Treatment |
|---|---|---|
| Web product and API surface | `apps/web/**` | Applicable to HIP, AEP work materialization, identity/session projection, admin, onboarding, signed links, public claims, and commercial surfaces. |
| Manager control plane | `apps/manager/**` | Applicable to every runtime, authority, tool, provider, repair, materialization, admin, and observability clause. |
| Shared contracts | `packages/shared/**` | Applicable where runtime schema/version/protocol declarations are consumed; types alone were never credited as enforcement. |
| Database | `packages/db/**`, all migrations through `0038` | Primary evidence for identity, isolation, state machines, leases, grants, RLS, audit, metering, and recovery. |
| Runtime template | `packages/agent-template/**` | Applicable to profile/capability/runtime continuity and labor behavior; documentation-only claims were not treated as runtime proof. |
| Infrastructure | `infra/**` | Applicable to deployment, host boundaries, routing, secrets, proof scripts, recovery, production topology, and operator burden. |
| Tests and workflows | `tests/**`, `.github/workflows/employee-work-production-boundary.yml`, workspace configs | Applicable to validation and release gates. |
| Active docs | `README.md`, `CLAUDE.md`, `AGENTS.md`, `CODEGRAPH.md`, `docs/**` except archive, active review documents | Applicable only as runbook/status evidence; never upgraded source state. |
| UI redesign/current UX | active `apps/web/**`, active `docs/ux/**`; no separate active `ui-redesign` implementation was found in the tracked branch comparison | Applicable to role-safe projection, lean-operator use, generic materialization, and claim discipline. |
| Memory | `memory/MEMORY.md`, six newest indexed summaries, two newest relevant full handoffs | Grounding only; source and proof outrank memory. |
| Explicit exclusions | `../wiki/**`, `docs/archive/**`, `estimator-funnel-employee/**` plans, generated artifacts, dependencies, build outputs | Inventoried as non-implementation evidence. Public estimator code was inspected only as an alternate path and claim risk, not as canonical employee proof. |

## 2. Executive verdict on architectural coherence

**Verdict: non-conforming. Launch blocked.**

The codebase does not implement the standard’s governed, repairable, multi-tenant AI-labor ontology. It implements an account-scoped SaaS ownership model with persistent employee runtimes, queues, provider adapters, approvals, and a reconciler layered on top. The governing execution scope is still `account_id + employee_id`. There is no durable organization/account/user/employee/assignment/access/authority/custody/payer/beneficiary relationship graph.

That missing graph is not a future abstraction problem. It already determines authorization, memory partitioning, connector scope, SMS authority, owner-session reach, approvals, metering, and billing attribution. Current account membership grants unrelated-employee access. Current approval resolution is bearer/account based and replay-raceable. Current provider and runtime credentials cannot express shared or fractional employee assignments without collapsing data boundaries. The architecture therefore fails the core workforce, authority, isolation, and accounting invariants before live deployment evidence is considered.

The production-boundary reconciler and ambient inbox provide durable worker primitives, but they reconcile singleton-owned resources. They do not repair the missing labor relationship model. The release state remains source-wired and narrowly CI-accepted, not production-, provider-, runtime-, commercial-, or live-accepted.

## 3. Severity totals and launch blockers

| Severity | Count | Launch effect |
|---|---:|---|
| P0 | 4 | Immediate launch block: assignment ontology, isolation, approval authority, replay-safe governance. |
| P1 | 13 | Launch block: bypass transports, session revocation, identity transactions, gateway enforcement, intake/recovery, provider scoping, deployment schema, proof, CI, versioning, admin identity, billing attribution. |
| P2 | 6 | Fix before scale: entitlement policy, operator UX, claim discipline, topology/observability, stale active docs, estimator alternate path. |
| P3 | 4 | Required next-phase capabilities absent or incomplete. |
| P4 | 2 | Research/market hypotheses without validation vectors. |
| **Total** | **29** | **No production or paid launch under the approved standard.** |

Hard launch blockers are `GAP-P0-001` through `GAP-P1-017`. A green focused workflow cannot average away any of them.

## 4. Complete clause coverage matrix

Status uses only: conforming, partial, non-conforming, not-implemented, not-applicable.

| Standard clauses | Status | Primary applicable evidence | Accounting result |
|---|---|---|---|
| 0.1–0.6 | partial | `STANDARD.md`; source/proof separation in memory and workflow | Normative language/evidence order usable; conformance boundary fails downstream. |
| AEP-1.1.1–1.1.6 | non-conforming | `0001_init.sql:25-99`; runtime credentials; manifests | Employee identity is hard-owned by account; assignment, employer, payer, beneficiary, supervisor, custody absent. |
| AEP-1.2.1–1.2.7 | partial | shared surface types; `employee-stream.ts`; web renderers | Typed surfaces exist, but no assignment/role projection, complete lifecycle, or universal generic materialization. |
| AEP-1.3.1–1.3.7 | partial | `turn-queue.ts:7-173`; turn migrations; runtime | Per-employee lane exists; caller idempotency, recovery, assignment scope, and proof continuity are incomplete. |
| AEP-1.4.1–1.4.5 | non-conforming | web/SMS routes; no active voice path | SMS/web continuity is account-owned, not assignment-owned; voice and relationship-safe channel continuity are absent. |
| OTIAP-2.1.1–2.1.5 | non-conforming | `0001_init.sql:25-74`; no organizations/assignments | Required relationship graph does not exist. |
| OTIAP-2.2.1–2.2.5 | non-conforming | `0002_rls.sql:12-89`; owner routes | Access collapses into account membership; shared access and unrelated-assignment denial cannot be expressed. |
| OTIAP-2.3.1–2.3.4 | non-conforming | approvals, sessions, preview links | Authority has no durable principal/role/assignment/policy binding. |
| OTIAP-2.4.1–2.4.3 | partial | `admin.ts`; support sessions | Role table exists, but platform actor authentication is an unsigned header behind a shared bearer. |
| TGP-3.1.1–3.1.6 | non-conforming | `estimate.stub.ts:348-506`; preview action route | Approval creation/resolution lacks exact actor/assignment/policy binding and atomic terminal transition. |
| TGP-3.2.1–3.2.5 | partial | scoped MCP; global HTTP route; tool handlers | MCP identity injection exists; alternate global-token transport and handler-level account checks remain bypass surfaces. |
| TGP-3.3.1–3.3.6 | partial | signed links, MCP/model credentials, secret refs | Signature/revocation primitives exist; assignment/purpose/principal binding and atomic consumption are incomplete. |
| RIP-4.1.1–4.1.8 | partial | reconciler, model gateway, runtime template | Per-employee runtime isolation exists in source; relationship isolation, durable budgets, live proof, and shared-assignment safety fail. |
| RIP-4.2.1–4.2.5 | partial | provisioning jobs/commands/resource states | Durable reconciliation exists in source; production schema and live reboot/drift/compensation proof are absent. |
| RIP-4.3.1–4.3.4 | partial | provider adapters, ambient inbox/effect receipts | Inbox-first adapters exist; assignment binding and end-to-end provider/runtime receipts remain unproven. |
| ECP-5.1.1–5.1.6 | partial | profile renderer/package/template | Profiles are rendered and credentialed; protocol version/assignment/capability proof is incomplete. |
| ECP-5.2.1–5.2.5 | partial | capability registry, tool registry | Registry coverage exists; readiness is not consistently release-bound and long-tail execution is incomplete. |
| ECP-5.3.1–5.3.6 | partial | MCP transport, tool envelopes, materialization | Some tools produce durable outputs; not every consequence has complete receipt/recovery/version semantics. |
| HIP-6.1.1–6.1.6 | partial | owner web surface and stream | Surface exists; role/assignment-safe projections, workforce selection, cost and repair clarity fail. |
| HIP-6.2.1–6.2.4 | non-conforming | Twilio sender lookup and employee inbound | Any verified phone in the account can reach any live employee; explicit relationship and authority are absent. |
| HIP-6.3.1–6.3.4 | partial | admin dashboard and support audit | Operational visibility exists; authentication separation and complete proof tiering are insufficient. |
| CBMP-7.1.1–7.1.2 | non-conforming | no payer/beneficiary/employer/assignment tables | Labor relationships and commercial attribution cannot be represented. |
| CBMP-7.2.1–7.2.5 | non-conforming | default-allow entitlements; usage/account billing | Billing, entitlement, runtime budget, and labor value remain conflated or missing. |
| CBMP-7.3.1–7.3.2 | not-implemented | no labor outcome ledger | No release-bound labor displacement or value attribution ledger. |
| REVP-8.1.1–8.1.4 | partial | proof manifest and research docs | Vector concepts exist; no product-wide registry/execution record for current P0/P1 boundaries. |
| REVP-8.2.1–8.2.3 | partial | focused tests and live scripts | Some hard gates are encoded; current release does not execute the full gate set. |
| REVP-8.3.1–8.3.6 | non-conforming | no approved experiment registry tied to implementation | Research claims lack release-bound baselines and decisions. |
| REVP-8.4.1–8.4.4 | non-conforming | public claims and docs | Labor/commercial claims are not linked to measured market or operational evidence. |
| DIP-9.1.1–9.1.10 | non-conforming | CI, memory, PR body, production DB state | State categories are documented but public/active claims exceed live evidence. |
| DIP-9.2.1–9.2.5 | non-conforming | CI PostgreSQL; live scripts unexecuted | Real Supabase, provider, browser, shared-employee, and commercial acceptance are missing. |
| DIP-9.3.1–9.3.3 | partial | proof manifest and audit docs | Proof shape exists; current release has no complete release-bound packet. |
| 10.1–10.7 | partial | zod/JSON schemas, migrations, queues, logs | Versioning, relationship-scoped idempotency, actor provenance, and product-wide recovery are incomplete. |
| 11 | partial | this audit | Consequential boundaries traced; destructive/live tests explicitly not authorized. |
| 12 | partial | normative source map | Source map is usable but active docs are stale and ontology source does not exist in code. |
| 13 | partial | explicit operator approval in audit instruction | Human approval exists externally; `STANDARD.md` approval record remains stale by enforcement constraint. Amendment candidate recorded below. |

## 5. Severity-ranked findings

### P0 — core launch blockers

#### GAP-P0-001 — No durable assignment or labor-relationship graph
- **standard_clause:** AEP-1.1.1–1.1.5; OTIAP-2.1.1–2.1.5; CBMP-7.1.1–7.1.2
- **title:** Employee ownership, employment, assignment, access, authority, custody, benefit, and payment collapse into account ownership.
- **status:** non-conforming
- **severity:** P0
- **affected_files with exact lines:** `packages/db/migrations/0001_init.sql:25-99,205-215`; `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql:8-35,120-178`; `apps/manager/src/lib/mcp-auth.ts:10-18,36-65`; `apps/manager/src/lib/provisioning-reconciler.ts:29-64,200-263`.
- **current evidence tier:** migration and executable source; no live proof.
- **violated invariant:** Every consequential action must resolve an explicit, revocable assignment distinct from employee identity and account ownership.
- **concrete failure or exploit path:** The schema cannot represent one employee shared with two accounts under different memory, connector, approval, and billing scopes. Any attempted sharing must duplicate the employee or reuse one account scope, causing either identity fracture or data/authority merger.
- **business and labor impact:** Managed, fractional, marketplace, multi-user, multi-organization, delegated, and customer-beneficiary labor cannot be governed or billed correctly.
- **existing workaround:** Separate employee records and runtimes per account. This destroys stable employee identity and does not satisfy the standard.
- **root cause:** Initial schema treated `employees.account_id` as ownership, tenancy, employment, and execution scope.
- **remediation path:** Introduce organizations, accounts, employee principals, employment/management relationships, assignments, assignment principals/roles, resource grants, authority policies, payer/beneficiary/custody relationships, and assignment-scoped foreign keys.
- **required tests and proof tier:** Migration invariants plus real-Supabase identity matrix with shared employee, unrelated assignment denial, revocation, memory/connector isolation, and payer/beneficiary separation; provider-runtime-live proof.

#### GAP-P0-002 — Account membership grants unrelated employee and data access
- **standard_clause:** AEP-1.1.3–1.1.4; AEP-1.2.2; OTIAP-2.2.1–2.2.5; HIP-6.2.1–6.2.4
- **title:** RLS, owner routes, streams, and SMS authorize the account, not the employee assignment.
- **status:** non-conforming
- **severity:** P0
- **affected_files with exact lines:** `packages/db/migrations/0002_rls.sql:12-89`; `apps/manager/src/server.ts:987-1066`; `apps/manager/src/webhooks/twilio.ts:157-190`; `packages/db/migrations/0001_init.sql:44-50`.
- **current evidence tier:** migrations and executable source.
- **violated invariant:** An authorized user may access only assignments and resources explicitly granted to that principal; unrelated employees in the same account must remain isolated.
- **concrete failure or exploit path:** Any account member resolved by `amtech_account_ids()` can read every employee and owner-facing resource in that account. Any verified phone on the account can message any live employee. Owner resource/stream routes accept any employee whose `account_id` matches the session account.
- **business and labor impact:** Multi-user accounts cannot safely separate executives, estimators, bookkeepers, contractors, departments, or customer-specific employees.
- **existing workaround:** One account per user/employee. This defeats multi-user and multi-employee requirements.
- **root cause:** Account membership is used as a universal authorization grant.
- **remediation path:** Replace account-wide read predicates and route checks with relationship-aware assignment authorization functions and projection policies.
- **required tests and proof tier:** Real-Supabase tests for multiple users, multiple employees, cross-account denial, cross-employee denial, authorized shared access, role-specific approvals, and revocation; release-bound live packet.

#### GAP-P0-003 — Approval authority is not bound to an authorized human principal
- **standard_clause:** OTIAP-2.3.1–2.3.4; TGP-3.1.1–3.1.6; TGP-3.3.1–3.3.6
- **title:** Approval records and signed actions prove possession of account/bearer context, not assignment-specific authority.
- **status:** non-conforming
- **severity:** P0
- **affected_files with exact lines:** `packages/db/migrations/0001_init.sql:186-198`; `apps/manager/src/tools/estimate.stub.ts:348-506`; `apps/manager/src/lib/signed-links.ts:83-128`; `apps/manager/src/lib/preview-links.ts:40-87,100-123`; `apps/manager/src/server.ts:348-377,911-985`.
- **current evidence tier:** migration and executable source.
- **violated invariant:** Consequential approval must bind requester, exact action/resource/diff, assignment, authorized resolver principal/role, policy version, expiration/revocation, and durable decision evidence.
- **concrete failure or exploit path:** The global internal tool route labels `resolve_approval` as actor `owner` without authenticating an owner principal. Preview tokens bind account/employee/resource/actions but not a user, role, assignment, policy version, or approval snapshot. Approval rows do not record requested-by or resolved-by principals.
- **business and labor impact:** Money, customer communication, and accounting actions cannot prove who had authority or whether that authority remained valid.
- **existing workaround:** Treat every account as single-owner and protect bearer links manually. This is not a safe multi-user workaround.
- **root cause:** Approval was implemented as a resource state, not an authority protocol.
- **remediation path:** Add authority policy evaluation, resolver grants, principal-bound approval sessions/tokens, immutable action snapshot/hash, policy version, requested/resolved actors, and revocation checks.
- **required tests and proof tier:** Negative principal/role/assignment matrix, delegated authority tests, revoked-role tests, replay tests, and provider-backed effect proof tied to the approved snapshot.

#### GAP-P0-004 — Terminal approvals and preview actions are replay-raceable
- **standard_clause:** TGP-3.1.3–3.1.6; TGP-3.3.3–3.3.6; 10.3–10.5
- **title:** Read-then-effect-then-consume ordering permits concurrent duplicate terminal actions.
- **status:** non-conforming
- **severity:** P0
- **affected_files with exact lines:** `apps/manager/src/lib/preview-links.ts:90-123`; `apps/manager/src/server.ts:911-985`; `apps/manager/src/tools/estimate.stub.ts:412-506`.
- **current evidence tier:** executable source; no concurrency proof.
- **violated invariant:** A terminal approval or signed action must be claimed atomically before effect and be exactly-once or explicitly ambiguous.
- **concrete failure or exploit path:** `resolvePreviewLink` never rejects `consumed_at`; the server checks consumption before calling `resolve_approval`, then marks the link consumed after the approval/follow-up effect. `resolve_approval` reads unresolved state then performs an unconditional update. Concurrent requests can both pass the read before either write.
- **business and labor impact:** Duplicate sends, invoices, accounting writes, or contradictory approval outcomes can occur under retries or double taps.
- **existing workaround:** Operator avoids concurrent actions. No safe technical workaround exists at the boundary.
- **root cause:** Terminal state and effect ownership are not a database compare-and-set transaction.
- **remediation path:** Add atomic claim RPC with row lock/version, unique effect key, terminal command/effect receipt, lease, ambiguous state, and consume-before-effect semantics.
- **required tests and proof tier:** Parallel approval/link requests, delayed provider response, client retry, process crash after provider acceptance, and replay; zero duplicate committed effects threshold.

### P1 — launch blockers with bounded operational workarounds

#### GAP-P1-005 — Global internal tool transport bypasses scoped MCP identity
- **standard_clause:** TGP-3.2.1–3.2.5; RIP-4.1.2; 10.6
- **title:** One shared Manager bearer can invoke tools for caller-supplied account and employee IDs.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/server.ts:348-377`; `apps/manager/src/lib/run-tool.ts:30-62`.
- **current evidence tier:** executable source.
- **violated invariant:** Every transport must derive identity and assignment server-side and preserve the same authority envelope.
- **concrete failure or exploit path:** A holder of `MANAGER_INTERNAL_TOKEN` can submit arbitrary `account_id` and `employee_id`; `resolve_approval` is explicitly tagged as owner. Handler ownership checks do not establish user/assignment authority.
- **business and labor impact:** One leaked internal token becomes cross-account control-plane authority.
- **existing workaround:** Keep the route host-private and rotate the shared token.
- **root cause:** Legacy front-door transport remained alongside scoped MCP.
- **remediation path:** Remove or constrain the route to signed service principals with audience, capability, assignment, nonce, expiration, and actor class.
- **required tests and proof tier:** Wrong audience, wrong assignment, replay, expired service token, and leaked-token blast-radius tests; production network proof.

#### GAP-P1-006 — Owner sessions survive membership or authority revocation
- **standard_clause:** OTIAP-2.2.3–2.2.5; OTIAP-2.3.2–2.3.4; TGP-3.3.4
- **title:** Session validation checks token hash and expiry only.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/lib/owner-session.ts:18-53`; `apps/manager/src/server.ts:987-1066`.
- **current evidence tier:** executable source.
- **violated invariant:** Access and authority revocation must take effect durably and promptly.
- **concrete failure or exploit path:** Removing an account membership or changing a role does not invalidate a 14-day owner session because validation does not recheck membership, role, status, session revocation, or assignment grant.
- **business and labor impact:** Former employees or removed collaborators retain data and action access.
- **existing workaround:** Delete session rows manually or rotate signing material.
- **root cause:** Session is an account bearer, not a relationship lease.
- **remediation path:** Add revocation/session version, current membership/assignment/role checks, principal status, and bounded refresh.
- **required tests and proof tier:** Membership removal, role downgrade, assignment revocation, user disable, concurrent session, and expiration tests on real Supabase.

#### GAP-P1-007 — Account creation and claim consumption are non-transactional and race-prone
- **standard_clause:** OTIAP-2.1.1–2.1.5; 10.3–10.5
- **title:** Auth creation and database identity graph can partially commit; phone/claim ownership is check-then-write.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/tools/identity.stub.ts:274-395`; `apps/manager/src/server.ts:597-635`; `packages/db/migrations/0001_init.sql:53-64`.
- **current evidence tier:** executable source and schema.
- **violated invariant:** Identity creation and claim ownership must converge under failure, retry, and concurrency.
- **concrete failure or exploit path:** Supabase Auth user creation occurs before sequential account/user/membership/phone/session writes; several write results are unchecked and no compensation exists. Claim consumption updates `consumed_at` after a prior read without conditional claim ownership.
- **business and labor impact:** Orphan Auth users, incomplete accounts, dead owner sessions, or conflicting phone claims require manual repair.
- **existing workaround:** Manual cleanup and re-onboarding.
- **root cause:** Cross-system saga and database claim primitives were not defined.
- **remediation path:** Database RPC for local identity graph, conditional phone/claim transition, external-auth saga state, compensation, replay key, and repair command.
- **required tests and proof tier:** Fault injection after every step, duplicate requests, simultaneous claim, Auth timeout/duplicate email, and repair proof.

#### GAP-P1-008 — Model-gateway budget, rate limit, audit, and retry semantics are not durable
- **standard_clause:** RIP-4.1.4–4.1.8; RIP-4.3.3–4.3.4; CBMP-7.2.3–7.2.5; 10.3–10.7
- **title:** Limits reset on process restart, spend is never decremented, audit failure is swallowed, and provider retries lack an idempotency contract.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/lib/model-gateway.ts:13,61-72,173-186,197-219`; `apps/manager/src/lib/model-gateway-http.ts:102-189`; `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql:38-63`.
- **current evidence tier:** executable source and migration; no provider-live proof.
- **violated invariant:** Runtime limits, usage, cost, receipts, and retries must remain correct across concurrency and reboot.
- **concrete failure or exploit path:** Restart clears `rateBuckets`; `spend_limit_cents` is only checked for positive value and never consumed transactionally; successful provider responses are returned even when audit persistence fails; exception retries can duplicate provider work without an upstream idempotency key.
- **business and labor impact:** Unbounded model spend, missing labor cost records, unreconstructable work, and duplicate provider charges.
- **existing workaround:** Provider-side account limits and log review.
- **root cause:** Gateway policy is a signed static claim plus process memory, not a durable budget ledger.
- **remediation path:** Transactional budget reservation/settlement, durable rate window, mandatory receipt write or ambiguous state, upstream idempotency where supported, and fail-closed accounting policy.
- **required tests and proof tier:** Parallel requests, restart, budget exhaustion, audit outage, provider timeout-after-accept, retry, and reconciliation tests; provider-live packet.

#### GAP-P1-009 — Agent context primer explicitly fails open
- **standard_clause:** AEP-1.3.2–1.3.7; RIP-4.1.5; 10.4–10.5
- **title:** Missing or failed primer-claim persistence still injects context.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/server.ts:395-430`.
- **current evidence tier:** executable source.
- **violated invariant:** Context mutation must have durable ownership and replay semantics.
- **concrete failure or exploit path:** When the claim gate is unavailable, the route deliberately primes anyway. Concurrent or repeated runtime requests can receive duplicate priming and inconsistent session state.
- **business and labor impact:** Duplicate instructions, context drift, and non-reproducible employee behavior.
- **existing workaround:** Ensure migration and database availability; inspect warning logs.
- **root cause:** Availability was prioritized over deterministic context ownership.
- **remediation path:** Fail closed into retryable unavailable state, persist claim/version, and expose repair path.
- **required tests and proof tier:** Missing migration, DB timeout, duplicate request, session rotation, and restart tests; zero duplicate primer threshold.

#### GAP-P1-010 — Owner web turns lack stable intent idempotency and complete recovery proof
- **standard_clause:** AEP-1.3.1–1.3.7; 10.3–10.5
- **title:** Queue primitives are durable, but the web caller manufactures a new key for every retry.
- **status:** partial
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/lib/turn-queue.ts:7-173`; `apps/manager/src/server.ts:638-688`.
- **current evidence tier:** executable source and migration tests; no live reboot proof.
- **violated invariant:** The same human intent must converge to one turn and one bounded effect across network retry and reboot.
- **concrete failure or exploit path:** Web idempotency uses current time and a fresh ID, so browser retry or proxy retry creates a new turn. Queue completion does not prove downstream provider/materialization atomicity.
- **business and labor impact:** Duplicate work, duplicate drafts/sends, and owner confusion.
- **existing workaround:** Disable retry at clients and manually reconcile duplicates.
- **root cause:** Queue supports idempotency but ingress does not expose a stable client intent key.
- **remediation path:** Client-generated intent ID, durable command receipt, turn/effect correlation, replay response, and recovery surface.
- **required tests and proof tier:** Lost response, double submit, reconnect, process crash, older queued turn, and downstream effect tests.

#### GAP-P1-011 — Provider and connector bindings have no assignment scope
- **standard_clause:** AEP-1.1.2–1.1.5; OTIAP-2.2.4; RIP-4.3.1–4.3.4
- **title:** Provider ingress resolves account and employee, not authorized assignment/resource custody.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `packages/db/migrations/0001_init.sql:205-262,269-321`; `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql:145-190`; `apps/manager/src/webhooks/twilio.ts:157-217`; `apps/manager/src/lib/ambient-inbox.ts:6-46`.
- **current evidence tier:** schema and executable source.
- **violated invariant:** Inbound and outbound provider work must bind the exact assignment and resource grant before data enters memory or effects execute.
- **concrete failure or exploit path:** Ambient envelopes carry optional account/employee only; connector uniqueness is employee-level; SMS authorization is any verified account phone. Shared employee or delegated connector custody cannot be isolated.
- **business and labor impact:** Customer data, inboxes, accounting books, and communications can cross assignment boundaries.
- **existing workaround:** One employee and connector set per account.
- **root cause:** Provider protocols inherited singleton tenancy.
- **remediation path:** Assignment-scoped connector installations, provider subject bindings, custody grants, memory partition IDs, and relationship-aware ingress resolution.
- **required tests and proof tier:** Two assignments on one employee with distinct Gmail/QBO/SMS resources, wrong-binding denial, revocation, retry, and provider-live evidence.

#### GAP-P1-012 — Production database is behind executable source
- **standard_clause:** RIP-4.2.1–4.2.5; DIP-9.1.1–9.2.5
- **title:** Production Supabase stops at migration `0031`; current runtime requires `0032`–`0038`.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `memory/2026-07-17-employee-work-production-boundary-reconciler-pass.md`; `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql:1-204`; `0034_reconciler_workers_and_ambient_replay.sql:1-159`; `0035_worker_terminal_claim_and_effect_receipts.sql:1-63`; `0036_worker_service_role_grants.sql:1-58`; `0037_welcome_effect_ready_gate.sql:1-94`; `0038_needs_reprovision_command_trigger.sql:1-94`.
- **current evidence tier:** source and CI PostgreSQL; explicit live absence.
- **violated invariant:** Deployed schema must match release source before runtime claims.
- **concrete failure or exploit path:** Current Manager paths call tables/functions that do not exist in production, causing worker, gateway, inbox, or reprovision failures.
- **business and labor impact:** Production runtime cannot safely execute the audited source.
- **existing workaround:** Keep new workers disabled and use older deployment behavior.
- **root cause:** Release migration gate has not been executed against real Supabase.
- **remediation path:** Staging Supabase application/verification, rollback plan, then production migration under release manifest.
- **required tests and proof tier:** Real Supabase migration, grants/RLS/RPC verification, rollback rehearsal, and release-bound database proof.

#### GAP-P1-013 — Required live and commercial evidence is absent
- **standard_clause:** REVP-8; DIP-9.1–9.3; STANDARD 0.2
- **title:** The live-proof harness exists but none of its required phases has release-bound evidence for the audited head.
- **status:** not-implemented
- **severity:** P1
- **affected_files with exact lines:** `infra/acceptance/production-boundary-live.json:1-55`; `memory/2026-07-17-employee-work-production-boundary-reconciler-pass.md`; PR `#19` status body.
- **current evidence tier:** scripts/manifest only.
- **violated invariant:** Source-wired, CI, production-like, provider, runtime, commercial, and live states must remain distinct and hard-gated.
- **concrete failure or exploit path:** Release can be described as ready from source and focused CI without any real migration, two-employee isolation, credential rotation, provider ingress, browser onboarding, reboot recovery, or generated work-object packet.
- **business and labor impact:** Operators cannot distinguish deployable code from proven employee labor.
- **existing workaround:** Manual caution in memory and PR text.
- **root cause:** Proof execution is deferred outside the release gate.
- **remediation path:** Make the manifest an enforced release ledger with immutable artifacts and explicit human authorization for destructive phases.
- **required tests and proof tier:** All nine manifest phases plus relationship matrix and commercial attribution where paid claims apply; provider-runtime-live and commercial-live tiers.

#### GAP-P1-014 — Current CI is not a product release gate
- **standard_clause:** DIP-9.2.1–9.2.5; 10.1–10.7
- **title:** The green workflow validates a narrow backend slice and ignores production TypeScript lint.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `.github/workflows/employee-work-production-boundary.yml:25-158`; `package.json:16-29`; `eslint.config.mjs:1-9`.
- **current evidence tier:** successful CI run `29632149822` for declared steps.
- **violated invariant:** A release gate must cover all active product surfaces and required hard boundaries.
- **concrete failure or exploit path:** Workflow omits web build/typecheck, full unit suite, general integration suite, agent-template checks, lint, browser tests, provider tests, real Supabase, and relationship matrix. ESLint ignores every `.ts` and `.tsx` file.
- **business and labor impact:** UI/API breakage and authority/isolation regressions can merge under a green status.
- **existing workaround:** Manual local commands and focused review.
- **root cause:** Workflow was built as a production-boundary slice, then treated as broader acceptance evidence.
- **remediation path:** Product-wide required workflow with separate source, DB, web, Manager, runtime, security, browser, and live evidence jobs.
- **required tests and proof tier:** Deliberately seeded failing web/type/lint/RLS/assignment tests must fail CI; full release artifact manifest.

#### GAP-P1-015 — Consequential protocols are incompletely versioned
- **standard_clause:** AEP-1.2.1; TGP-3.2.1; ECP-5.1–5.3; 10.1–10.2
- **title:** Version fields exist in selected envelopes but not across assignment, approval, connector, command, memory, and billing protocols.
- **status:** partial
- **severity:** P1
- **affected_files with exact lines:** `packages/db/migrations/0001_init.sql:66-99,186-215`; `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql:145-178`; `apps/manager/src/tools/estimate.stub.ts:348-506`; shared tool/surface contracts.
- **current evidence tier:** source and types.
- **violated invariant:** Every cross-component consequential contract must declare schema/protocol version and compatibility/rejection behavior.
- **concrete failure or exploit path:** Old approval/connector/event/profile rows can be interpreted by new code without explicit compatibility rules; types do not enforce stored payload versions.
- **business and labor impact:** Rolling deploys and replay can execute stale semantics.
- **existing workaround:** Coordinated single-version deployment and manual migration discipline.
- **root cause:** Versioning was added per feature rather than as a protocol envelope rule.
- **remediation path:** Canonical versioned envelopes, database checks, upcasters/rejectors, and compatibility tests.
- **required tests and proof tier:** Old/new producer-consumer matrix, unknown-version rejection, migration replay, and rolling deploy tests.

#### GAP-P1-016 — Platform admin identity is an unsigned request header behind a shared bearer
- **standard_clause:** OTIAP-2.4.1–2.4.3; HIP-6.3.1–6.3.4; 10.6
- **title:** Support/admin role lookup trusts caller-supplied platform user ID after global internal-token admission.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `apps/manager/src/server.ts` admin routes and header extraction; `apps/manager/src/lib/admin.ts:174-236`.
- **current evidence tier:** executable source.
- **violated invariant:** Administrative actor identity and role must be independently authenticated, least-privilege, and non-repudiable.
- **concrete failure or exploit path:** Any caller holding the shared internal bearer can choose an active `X-AMTECH-Platform-User-Id` and inherit that user’s strongest role.
- **business and labor impact:** Support, billing, lifecycle, credential, and customer-data actions can be impersonated.
- **existing workaround:** Restrict network access and protect the shared token.
- **root cause:** Role authorization was added without a platform authentication session/token.
- **remediation path:** Signed platform sessions/service identity, MFA/step-up for sensitive actions, audience/capability binding, support-access lease enforcement, and immutable actor provenance.
- **required tests and proof tier:** Header spoof, role downgrade, expired support session, step-up, audit immutability, and network boundary tests.

#### GAP-P1-017 — Payer, beneficiary, owner, employer, and usage attribution are absent or conflated
- **standard_clause:** AEP-1.1.1–1.1.2; CBMP-7.1–7.3; RIP-4.3.4
- **title:** Usage and billing records cannot attribute labor to the correct relationship.
- **status:** non-conforming
- **severity:** P1
- **affected_files with exact lines:** `packages/db/migrations/0001_init.sql:98-106,313-321`; `apps/manager/src/lib/entitlements.ts:12-55`; model-gateway audit schema and source.
- **current evidence tier:** schema/source; no commercial proof.
- **violated invariant:** Billing attribution must distinguish payer, beneficiary, employee, assignment, provider cost, entitlement, and labor outcome.
- **concrete failure or exploit path:** Shared/fractional or managed labor cannot assign cost and benefit to separate entities; account/employee usage cannot prove which assignment consumed work or who owes payment.
- **business and labor impact:** Paid managed-workforce launch creates disputed invoices, margin blindness, and subsidy leakage.
- **existing workaround:** Manual invoice and spreadsheet attribution for one-owner/one-account pilots.
- **root cause:** Monetization was scaffolded as feature usage, not labor accounting.
- **remediation path:** Assignment-bound usage ledger, payer/beneficiary relationships, budget owner, rate plan, provider cost settlement, outcome attribution, and immutable invoice linkage.
- **required tests and proof tier:** Split payer/beneficiary, shared employee, refunds/credits, budget exhaustion, replay, and commercial reconciliation proof.

### P2 — material violations before scale

#### GAP-P2-018 — Entitlement checks are hardcoded allow
- **standard_clause:** CBMP-7.2.1–7.2.5; TGP-3.2.3
- **title/status/severity:** Entitlement enforcement is logging theater; non-conforming; P2.
- **affected_files:** `apps/manager/src/lib/entitlements.ts:22-36`; `0001_init.sql:81-111` in the audit/entitlement section.
- **current evidence tier:** source/schema.
- **violated invariant:** Policy decision must be durable and enforceable.
- **failure path:** Every feature returns allow regardless stored policy.
- **impact:** Product limits, suspensions, trials, and paid capabilities cannot be enforced.
- **workaround:** Manual account disablement.
- **root cause/remediation:** Replace constant with versioned policy evaluation tied to assignment and billing state.
- **required proof:** deny/allow precedence, stale cache, role, assignment, and billing-state tests.

#### GAP-P2-019 — Human surfaces are singleton and role-insensitive
- **standard_clause:** HIP-6.1.1–6.1.6; AEP-1.2.2
- **title/status/severity:** Web UI assumes one owner/account employee context and lacks workforce, role, authority, cost, and repair projections; partial; P2.
- **affected_files:** `apps/web/app/agent/[employeeId]/**`; `apps/web/app/dashboard/page.tsx`; `apps/manager/src/lib/employee-stream.ts`.
- **current evidence tier:** source/fixtures; no canonical browser proof.
- **violated invariant:** Lean operators must see only authorized work, decisions, cost, proof, and repair state.
- **failure path:** Account members receive same employee projection and cannot distinguish employment/assignment/beneficiary.
- **impact:** Unsafe delegation and high support burden.
- **workaround:** Single-owner pilot.
- **root cause/remediation:** Build relationship-aware surface projection and workforce selector after ontology migration.
- **required proof:** Role screenshots/browser packet across owner, supervisor, collaborator, payer, beneficiary, support.

#### GAP-P2-020 — Public and active product copy exceeds evidence
- **standard_clause:** DIP-9.1.1–9.1.10; REVP-8.4
- **title/status/severity:** Public copy says shipped behavior and implies universal approval/receipt guarantees without live proof; non-conforming; P2.
- **affected_files:** `apps/web/app/page.tsx`; `README.md`; active GTM docs.
- **current evidence tier:** copy/source versus explicit absent live evidence.
- **violated invariant:** Claims must state exact evidence tier.
- **failure path:** Buyers infer deployed, proven governed labor from source-wired capabilities.
- **impact:** Mis-selling and support/legal exposure.
- **workaround:** Founder verbal qualification.
- **root cause/remediation:** Add claim registry and release-state labels; remove absolute claims until live packets exist.
- **required proof:** Claim-to-proof audit in CI and approved commercial packet.

#### GAP-P2-021 — Worker lifecycle is process-coupled and operational observability is incomplete
- **standard_clause:** RIP-4.2; HIP-6.3; 10.5–10.7
- **title/status/severity:** Reconciler and ambient workers use in-process timers/flags; partial; P2.
- **affected_files:** `apps/manager/src/lib/provisioning-reconciler.ts:66-69`; `apps/manager/src/lib/ambient-inbox.ts:62-64`; Manager server startup.
- **current evidence tier:** source; no live crash/reboot packet.
- **violated invariant:** Worker recovery and liveness must survive Manager deploy/restart and be externally observable.
- **failure path:** Manager restarts stop all worker loops until startup succeeds; no independent queue depth/SLO/alert hard gate is proven.
- **impact:** Silent labor backlog and coupled blast radius.
- **workaround:** Process supervisor and manual dashboard checks.
- **root cause/remediation:** Separate worker deployment or durable scheduler leadership, metrics, alerts, and runbook.
- **required proof:** kill/restart/backlog/duplicate leader tests and red-health alert packet.

#### GAP-P2-022 — Active instructions and status documents are stale
- **standard_clause:** DIP-9.1; STANDARD 0.2; section 12
- **title/status/severity:** `CLAUDE.md`, `AGENTS.md`, root/scoped codegraphs, PR body, and memory disagree on branch, reconciler state, standard approval, and final head; non-conforming; P2.
- **affected_files:** `mvp-build/CLAUDE.md`; `mvp-build/AGENTS.md`; `CODEGRAPH.md`; `mvp-build/CODEGRAPH.md`; `memory/MEMORY.md`; PR `#19` body.
- **current evidence tier:** active docs.
- **violated invariant:** Canonical operational status must be current and cannot inflate or understate deployment.
- **failure path:** Agents act from stale priorities or obsolete head/proof IDs.
- **impact:** Wrong deployment and duplicated work.
- **workaround:** Read newest memory and source manually.
- **root cause/remediation:** No automated status reconciliation; add generated release-state ledger and stale-doc check.
- **required proof:** CI fails when branch/head/migration/proof state diverges.

#### GAP-P2-023 — Public estimator remains an active alternate architecture and primary CTA
- **standard_clause:** STANDARD 0.4–0.5; AEP-1.1.6; DIP-9.1
- **title/status/severity:** Non-canonical estimator code and routes remain prominent and can be mistaken for employee acceptance; partial; P2.
- **affected_files:** `apps/web/app/page.tsx`; `apps/web/app/free-estimator/**`; `apps/web/app/api/public-estimator/**`; Manager public-estimator modules; `package.json:84-85`.
- **current evidence tier:** source; explicitly excluded as launch proof.
- **violated invariant:** Fixture/estimator behavior must not masquerade as persistent employee labor.
- **failure path:** Product funnel and tests validate estimator paths while canonical employee path lacks live proof.
- **impact:** Roadmap and sales drift back to a model wrapper/tool.
- **workaround:** Manual labeling.
- **root cause/remediation:** Remove primary positioning, add explicit non-canonical banner/telemetry separation, and exclude estimator proofs from employee release gates.
- **required proof:** Claim/funnel review and canonical employee conversion packet.

### P3 — required next-phase capability gaps

#### GAP-P3-024 — Generic long-tail work materialization is incomplete
- **standard_clause:** AEP-1.2.7; ECP-5.3
- **status/severity:** partial; P3.
- **affected_files:** `materialization.ts`; work-object renderers; MCP resource rendering.
- **failure/impact:** New tools still require bespoke assumptions and do not uniformly produce versioned resources/actions/proof.
- **remediation/proof:** Canonical schema-driven renderer, unsafe-schema rejection, property tests, and provider-backed long-tail object packet.

#### GAP-P3-025 — Voice and full cross-surface continuity are absent
- **standard_clause:** AEP-1.4.1–1.4.5
- **status/severity:** not-implemented; P3.
- **affected_files:** web/SMS runtime and channel router; no active voice implementation.
- **failure/impact:** One employee identity cannot yet preserve assignment-safe work across all promised channels.
- **remediation/proof:** Versioned channel envelope, voice identity/consent, handoff/replay tests, and live multi-channel packet.

#### GAP-P3-026 — Cross-employee delegation protocol is absent
- **standard_clause:** AEP-1.1.5
- **status/severity:** not-implemented; P3.
- **affected_files:** no delegation tables/commands/proof envelopes in active schema.
- **failure/impact:** Employees cannot collaborate without ad hoc context transfer and authority leakage.
- **remediation/proof:** Delegation work object with context subset, inherited authority rule, separate runs/receipts, and denial tests.

#### GAP-P3-027 — REVP experiment registry and automatic release evaluation are absent
- **standard_clause:** REVP-8.1–8.3
- **status/severity:** not-implemented; P3.
- **affected_files:** research docs, proof scripts, no durable experiment registry in active DB.
- **failure/impact:** Research and product claims cannot be evaluated consistently across releases.
- **remediation/proof:** Durable vector registry, baseline, metric computation, hard-gate evaluator, release binding, and signed decision record.

### P4 — aspirational/research gaps

#### GAP-P4-028 — HRR, typed compiler, and generative-UI claims remain hypotheses
- **standard_clause:** REVP-8.3; STANDARD 0.6.8
- **status/severity:** not-implemented; P4.
- **affected_files:** website-framework research and active UX research references.
- **failure/impact:** No baseline proves these methods improve labor outcomes, safety, or operator efficiency.
- **remediation/proof:** Register hypotheses and baselines; do not ship claims before declared vectors pass.

#### GAP-P4-029 — Labor-displacement and market-value claims lack baselines
- **standard_clause:** AEP-1.1.6; CBMP-7.3; REVP-8.4
- **status/severity:** not-implemented; P4.
- **affected_files:** public/GTM copy and no labor-outcome ledger.
- **failure/impact:** “AI employee” and managed workforce pricing cannot be tied to hours, duties, exception rate, review burden, or customer willingness to pay.
- **remediation/proof:** Duty baseline, retained authority measure, exception/review rate, time/cost displacement, pilot retention, and paid conversion vectors.

## 6. REVP-8 validation vectors for every P0/P1 boundary

Each record uses: requirement; state; metric; threshold; evidence; confidence; release. A hard-gate failure remains a release failure.

| Finding | Vector | Requirement / metric / threshold | State | Evidence | Confidence | Release |
|---|---|---|---|---|---|---|
| P0-001 | theory | Relationship graph represents all required roles; 100% required relationships expressible | fail | schema has account-owned employee only | high | blocked |
| P0-001 | implementation | assignment/grant/payer/beneficiary tables and enforced FKs | fail | absent | high | blocked |
| P0-001 | validation | 9 relationship tests pass | blocked | cannot construct shared assignment | high | blocked |
| P0-001 | deployment | real-Supabase graph and RLS packet | unknown | no live schema | high | blocked |
| P0-001 | market | managed/shared labor contracts reconcile | unknown | no commercial packet | medium | blocked |
| P0-002 | theory | unrelated assignments deny by default; zero leakage | fail | account membership is universal grant | high | blocked |
| P0-002 | implementation | assignment-aware RLS/routes/SMS | fail | account predicates only | high | blocked |
| P0-002 | validation | zero unauthorized reads/actions in identity matrix | blocked | tests absent | high | blocked |
| P0-002 | deployment | real-Supabase RLS and browser/SMS denial packet | unknown | absent | high | blocked |
| P0-002 | market | multi-user pilot has zero unauthorized exposure | unknown | absent | medium | blocked |
| P0-003 | theory | exact authorized human principal resolves approval | fail | bearer/account authority | high | blocked |
| P0-003 | implementation | actor/role/assignment/policy/snapshot binding | fail | fields/enforcement absent | high | blocked |
| P0-003 | validation | unauthorized/self/revoked/delegated matrix; zero false approvals | blocked | incomplete tests | high | blocked |
| P0-003 | deployment | signed actor and provider-effect packet | unknown | absent | high | blocked |
| P0-003 | market | customer disputes attributable to actor/snapshot | unknown | no commercial evidence | medium | blocked |
| P0-004 | theory | one terminal claim and one effect under concurrency | fail | read-then-write ordering | high | blocked |
| P0-004 | implementation | atomic CAS/lease/effect receipt | fail | absent for approvals/preview | high | blocked |
| P0-004 | validation | 100 parallel retries produce exactly one committed effect | blocked | no test | high | blocked |
| P0-004 | deployment | crash-after-accept/replay provider packet | unknown | absent | high | blocked |
| P0-004 | market | zero duplicate customer/money effects in pilot | unknown | absent | medium | blocked |
| P1-005 | theory | every transport has least-privilege derived identity | fail | global bearer + caller IDs | high | blocked |
| P1-005 | implementation | service principal/audience/capability binding | fail | absent | high | blocked |
| P1-005 | validation | wrong-scope/replay/expired token denial 100% | blocked | absent | high | blocked |
| P1-005 | deployment | private-network and credential blast-radius proof | unknown | absent | medium | blocked |
| P1-005 | market | not applicable to commercial claim | blocked | security gate | high | blocked |
| P1-006 | theory | revocation terminates access within declared SLA | fail | session checks expiry only | high | blocked |
| P1-006 | implementation | current relationship/session-version check | fail | absent | high | blocked |
| P1-006 | validation | revoked user denied within 60 seconds | blocked | absent | high | blocked |
| P1-006 | deployment | live session revocation packet | unknown | absent | medium | blocked |
| P1-006 | market | support access complaints attributable | unknown | absent | low | blocked |
| P1-007 | theory | identity saga converges without orphan/double claim | fail | partial writes/races | high | blocked |
| P1-007 | implementation | transactional RPC + saga compensation | fail | absent | high | blocked |
| P1-007 | validation | fault at every step leaves one repairable state | blocked | absent | high | blocked |
| P1-007 | deployment | real Auth/Supabase duplicate/recovery packet | unknown | absent | medium | blocked |
| P1-007 | market | onboarding failure/recovery baseline | unknown | absent | low | blocked |
| P1-008 | theory | limits and accounting survive concurrency/reboot | fail | process bucket/static spend | high | blocked |
| P1-008 | implementation | durable reservation/settlement/audit hard gate | fail | absent | high | blocked |
| P1-008 | validation | no overspend; no missing successful receipt | blocked | absent | high | blocked |
| P1-008 | deployment | provider-live budget/restart/timeout packet | unknown | absent | high | blocked |
| P1-008 | market | gross-margin reconciliation within 1 cent/event | unknown | absent | medium | blocked |
| P1-009 | theory | context claim fails closed/retryable | fail | explicit fail-open | high | blocked |
| P1-009 | implementation | durable claim/version required | fail | fail-open branch | high | blocked |
| P1-009 | validation | zero duplicate primers under retry/restart | blocked | absent | high | blocked |
| P1-009 | deployment | live session-rotation/reboot packet | unknown | absent | medium | blocked |
| P1-009 | market | not applicable | blocked | runtime gate | high | blocked |
| P1-010 | theory | same intent maps to one turn/effect | fail | new web key each request | high | blocked |
| P1-010 | implementation | client intent receipt and correlation | partial | queue key exists; ingress unstable | high | blocked |
| P1-010 | validation | lost-response/double-submit yields one turn | blocked | absent | high | blocked |
| P1-010 | deployment | browser/network retry packet | unknown | absent | medium | blocked |
| P1-010 | market | duplicate-work rate below 0.1% | unknown | absent | low | blocked |
| P1-011 | theory | provider resource custody is assignment-bound | fail | account/employee only | high | blocked |
| P1-011 | implementation | assignment connector bindings and ingress resolver | fail | absent | high | blocked |
| P1-011 | validation | wrong assignment/provider subject denied 100% | blocked | absent | high | blocked |
| P1-011 | deployment | two-assignment real-provider packet | unknown | absent | high | blocked |
| P1-011 | market | managed connector custody accepted by customer | unknown | absent | low | blocked |
| P1-012 | theory | deployed schema equals release source | fail | production stops at 0031 | high | blocked |
| P1-012 | implementation | migrations 0032–0038 exist | pass | source/CI PostgreSQL | high | blocked |
| P1-012 | validation | real-Supabase verifier passes all checks | blocked | not run | high | blocked |
| P1-012 | deployment | release-bound production migration proof | fail | absent | high | blocked |
| P1-012 | market | not applicable | blocked | deployment gate | high | blocked |
| P1-013 | theory | evidence tiers cannot be conflated | pass | standard/proof manifest | high | blocked |
| P1-013 | implementation | nine-phase harness exists | pass | manifest/scripts | high | blocked |
| P1-013 | validation | every required phase has valid evidence | fail | no packets | high | blocked |
| P1-013 | deployment | provider/runtime/browser/live accepted | fail | explicitly absent | high | blocked |
| P1-013 | market | paid/retained operator proof | unknown | absent | high | blocked |
| P1-014 | theory | release gate covers all active hard boundaries | fail | narrow workflow | high | blocked |
| P1-014 | implementation | web/full tests/lint/live jobs required | fail | omitted/no-op lint | high | blocked |
| P1-014 | validation | seeded regression fails CI | unknown | not tested | medium | blocked |
| P1-014 | deployment | required status attached to release SHA | partial | one narrow job | high | blocked |
| P1-014 | market | not applicable | blocked | release gate | high | blocked |
| P1-015 | theory | consequential protocols reject unknown versions | fail | selective versions | high | blocked |
| P1-015 | implementation | version columns/envelopes/upcasters | partial | inconsistent | high | blocked |
| P1-015 | validation | old/new compatibility and rejection matrix | blocked | absent | medium | blocked |
| P1-015 | deployment | rolling-deploy replay packet | unknown | absent | medium | blocked |
| P1-015 | market | not applicable | blocked | protocol gate | high | blocked |
| P1-016 | theory | admin actor independently authenticated/non-repudiable | fail | header identity | high | blocked |
| P1-016 | implementation | signed platform session/MFA/audience | fail | absent | high | blocked |
| P1-016 | validation | spoof/downgrade/expired support denied 100% | blocked | absent | high | blocked |
| P1-016 | deployment | network and admin-auth packet | unknown | absent | medium | blocked |
| P1-016 | market | support trust incident rate zero | unknown | absent | low | blocked |
| P1-017 | theory | payer/beneficiary/cost/outcome separable | fail | account/employee only | high | blocked |
| P1-017 | implementation | assignment labor ledger and billing links | fail | absent | high | blocked |
| P1-017 | validation | split-party reconciliation exact | blocked | absent | high | blocked |
| P1-017 | deployment | live usage-to-invoice packet | unknown | absent | high | blocked |
| P1-017 | market | paid pilot margin and dispute threshold declared/passed | unknown | absent | high | blocked |

## 7. Bypass and alternate-path inventory

| Path | Boundary bypass or contradiction | Finding |
|---|---|---|
| `/manager/tools/:name` | Shared bearer, caller-supplied account/employee, owner actor label for approval resolution | P1-005, P0-003 |
| Owner session routes | Account-wide employee/resource access; no current membership/role/assignment check | P0-002, P1-006 |
| Signed preview link | Bearer is authority; no principal/role/assignment; consume after effect | P0-003, P0-004 |
| SMS employee inbound | Any verified phone on account authorized for any live employee | P0-002, P1-011 |
| Agent context primer | Durable claim failure primes anyway | P1-009 |
| Web turn ingress | Fresh idempotency key per request | P1-010 |
| Account creation | External Auth and local identity graph are not one saga | P1-007 |
| Model gateway | Process-local rate counter, static spend claim, best-effort audit | P1-008 |
| Admin/support | Shared bearer plus caller-selected platform user header | P1-016 |
| Public estimator | Conventional tool path remains prominent and separately deployable; excluded from employee proof | P2-023 |
| Fixtures/dev login | Explicitly non-production but can create misleading UI acceptance if fixture flag/bypass is used | DIP risk; covered by P1-013/P1-014 |
| Active docs/PR body | Stale head and implementation status can override operator understanding | P2-022 |

## 8. Missing live and commercial proof matrix

| Required proof | Current state | Release requirement |
|---|---|---|
| Standard approval record in durable canonical ledger | External approval exists; standard record stale | Record approval without editing enforcement baseline, then amend through controlled standard revision. |
| Production Supabase migrations 0032–0038 | fail/absent | Staging and production release-bound verifier packet. |
| Multi-user/multi-account/multi-employee identity matrix | unknown | All nine relationship tests pass on real Supabase. |
| Authorized shared-employee access | blocked by schema | New ontology plus live test. |
| Unrelated-assignment memory/connector isolation | blocked by schema | Two assignments, two data partitions, real connector packet. |
| Role-specific approval authority and revocation | fail | Principal-bound approval packet with negative matrix. |
| Concurrent approval/replay/crash safety | fail | Exactly one effect or explicit ambiguous state. |
| Model-gateway two-employee isolation | source/CI only | Public ingress and credential matrix live proof. |
| Durable budget/rate/accounting | fail | Restart/concurrency/provider packet and invoice reconciliation. |
| Reconciler reboot/drift/compensation | source/CI only | Authorized destructive live proof. |
| Provider inbox duplicate/dead-letter/replay | source/CI only | Real provider packet. |
| Canonical browser onboarding | absent | Real public-origin browser packet without fixtures/dev login. |
| Provider-backed generated work object | absent | Gateway request, durable envelope, materialization, receipt, owner projection. |
| Voice continuity | not implemented | Future-tier proof before claim. |
| Paid managed-workforce outcome | absent | Payer/beneficiary ledger, margin, retained operator authority, paid retention. |
| Labor displacement baseline | absent | Duty time, review burden, exception rate, correction/recovery rate, retained authority. |

## 9. Standard defects and amendment candidates

These do not reduce code severity and do not change the approved standard during enforcement.

1. `STANDARD.md` section 13 still states unapproved after explicit operator approval. The next controlled revision should add approval identity, timestamp, approved source SHA, and standard blob/SHA.
2. The standard should define the minimum launch tier explicitly. Some P3/P4 clauses are universal in wording but operationally future-tier. This audit classified them by the supplied severity definitions without weakening P0/P1 invariants.
3. REVP-8 should define the durable registry schema and proof-signing format, not only vector fields.
4. Assignment should receive a canonical identifier and required foreign-key placement table to eliminate interpretation disputes.
5. Approval should define required immutable snapshot/hash fields and terminal claim/effect transaction semantics.

## 10. Pivot or scope-reduction verdict

**Do not pivot back to a model wrapper, estimator, or conventional account-scoped SaaS assistant.** That would make the implementation simpler only by abandoning the approved product category.

**Required scope reduction for the next launch gate:** one organization, one account, one or more users, one or more employees, explicit user-to-employee assignments, no cross-organization sharing, no marketplace, no cross-employee delegation, web plus SMS only, one provider-backed work-object slice, and manual commercial invoicing. Even this reduced tier still requires the P0 relationship/authority/isolation model, atomic approvals, revocable sessions, durable gateway accounting, real Supabase deployment, and live proof.

Until those gates pass, the only defensible state is internal engineering preview. No production, paid, managed-workforce, or labor-displacement claim conforms to the approved standard.
