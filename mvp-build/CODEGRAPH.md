# CODEGRAPH.md - AMTECH AI Employee MVP build map

Status: active

> Audience: AI agents working inside `mvp-build/`. This is the source navigation map for the flagship
> AMTECH AI Employee product. It explains how the code, Hermes profile template, provisioning program,
> Manager control plane, web surface, provider connectors, event mesh, tests, docs, and phase plan fit
> together.

---

## 1. What this folder is

`mvp-build/` is the code home for AMTECH's flagship product: a textable AI Employee for owner-operated
SMBs, starting with painting and landscaping contractors. The root repo is the AMTECH company brain;
this folder is the product implementation inside that brain.

The employee is built on an existing open-source agent substrate: **Hermes agent from Nous Research**.
AMTECH does not own Hermes itself. AMTECH owns the product layer around Hermes:

- deterministic employee provisioning from a profile package;
- the invisible Manager backend control plane;
- owner-facing web/SMS surfaces;
- account, session, approval, connector, artifact, event, scheduler, repair, admin, and metering layers;
- the business-specific contractor estimator package and Manager tool contract.

The owner only ever experiences one employee. The Manager is invisible backend infrastructure.

## 2. Read order

For a cold session:

1. `../identity.md` - required AMTECH operating identity.
2. `../CODEGRAPH.md` - whole workspace map and canonical facts.
3. `CLAUDE.md` / `AGENTS.md` - build-home agent rules, local checks, Realness Rules, memory protocol.
4. `second-half-plan/README.md`, `second-half-plan/phase-00-current-state-handoff.md`, and `second-half-plan/phase-01-preserve-and-close-live-gate.md` - current second-half forward plan.
5. `../wiki/MVP/second-half-current-and-future-state.md` - wiki companion for current/future app state.
6. `../wiki/MVP/build-plan-current/README.md` and `../wiki/MVP/build-plan-current/phases/README.md` - older reconciled phase graph and factual context.
7. `../wiki/MVP/implementation-records/README.md` - factual code-state ledger.
8. `memory/MEMORY.md`, then the newest dated handoff - durable development narrative.
9. This `CODEGRAPH.md`, then the relevant authored source files below.

Use `../wiki/MVP/old-build-plan/` for original whole-product mechanics only. The immediate forward sequencing now lives in
`second-half-plan/`; the older reconciled modular phase graph remains in `../wiki/MVP/build-plan-current/`.

## 3. Current status

Status vocabulary is shared with the build plan:

| Status | Meaning |
|---|---|
| `source-wired` | Code exists and local typecheck/unit/build/lint proof exists. |
| `provider-accepted` | Live provider proof ids exist: Twilio, Gmail, Pub/Sub, Stripe, Supabase, etc. |
| `runtime-accepted` | Live Hermes/runtime/job proof exists. |
| `planned` | Designed but not implemented. |
| `pending` | Blocked by missing env/host/credentials or not yet attempted. |

Current factual state:

- **Phase 0 baseline loop:** `source-wired`. Signup/claim, live employee path, estimate artifact, approved Gmail send seam, Gmail reply event seam, Stripe test-mode deposit seam, and internal reminder seams exist in code.
- **Phase 1 live-acceptance harness:** `source-wired`; live gate `pending`. Preflight/report and 8 run-verifiers exist, but real provider/runtime proof ids are absent.
- **New-era Phase 2 runtime/scheduler productionization:** `source-wired`; runtime gate `pending`. Docker-default backend policy, scheduler runner, `hermes_job_runs`, and `runtime_health_checks` exist.
- **Phase 3 / 3A / 4 live-employee source:** `source-wired`, **TDD-hardened (2026-07-03)**. Real Hermes Sessions chat client, DB-backed per-employee turn queue, generic ingress for Gmail/Stripe/manager events, Channel/Session/Presence router, and Gmail reply -> live wake -> validated descriptor path exist in code, now with direct unit coverage (fake-supabase enforces unique indexes + a faithful turn-claim rpc) and env-gated Postgres integration proof. A `drain_employee_turns` scheduler lane handles straggler owner turns and persists routed replies. **Two-door invariant:** external/untrusted sources enter via an `EventSourceAdapter` + `ingestEvent`; internal Manager-authored events call `deliverEmployeeEvent` directly.
- **Phase 6 metering foundation:** `source-wired`. `0013` six Manager-only ledgers + additive `run_id` columns; `0014` keeps `run_id` crossing real turn-claim RPCs; `0015` adds stable Hermes session key + external runtime run correlation; `lib/metering.ts` best-effort helpers; one `run_id` threads ingress -> deliver -> wake -> turn-queue -> router -> owner-turn.
- **Tool availability + materialization (2026-07-05):** `source-wired`; live employee proofs `pending`.
  (1) Hermes toolset enablement — rendered `config.yaml` `platform_toolsets.api_server` from a safe-set
  policy (`packages/shared/platform-toolsets.ts`) tied to backend blast radius + provider-key availability;
  `getToolsets()` + `npm run local:inspect` prove the live surface. (2) Schema-first Manager contract —
  `packages/shared/tool-schemas.ts` (zod source of truth) + `lib/run-tool.ts` shared dispatch (validate,
  block scheduler-only, reuse handlers/gates). (3) **Manager-as-MCP-server** — `lib/mcp-server.ts`
  (`@modelcontextprotocol/sdk`, web-standard streamable-http, `POST /manager/mcp`), `mcp_servers.amtech_manager`
  in the rendered config auto-attaches to api_server; employee calls Manager tools natively. (4)
  `ToolActivityDescriptor` + `formViewFromJsonSchema` so any tool materializes from schema with no per-tool
  code. Live `/v1/toolsets`, MCP handshake, and the Hermes->Work native-schema pipeline are pending.
- **Second-half plan (2026-07-09):** active in `second-half-plan/`. The backend is ahead of the owner product; the next seven phases are: Phase 0 handoff, Phase 1 preserve/close live gate, Phase 2 web employee desk, Phase 3 SMS ambient inbox/signed previews, Phase 4 tool-agnostic capability/rendering/materialization, Phase 5 trial ops/admin/billing, Phase 6 free-trial/paid-pilot readiness.
- **Second-half Phase 1 preserve/close live gate:** `source-wired/static-green`; live gate `blocked` pending a usable model/provider path. Manager MCP identity injection, Docker Manager-origin rendering, in-container terminal backend, broad persona, local bridge tool compatibility, and structured artifact fallback are preserved and tested.
- **Second-half Phase 2 owner Work Surface redesign:** `source-wired`. The owner web surface is now a multi-region employee desk backed by a stronger Manager read model: persisted conversation, Today/Chat/Jobs/Tasks/Outputs/Connected/Abilities/Activity/Settings views, selected preview pane, derived outputs/tasks/abilities/runtime health, SSE/poll fallback, approval/work-card reuse, and generic artifact HTML fallback. Browser/live acceptance remains pending local runtime/model availability.
- **Second-half Phase 3 SMS ambient inbox + signed previews/actions:** `source-wired` (2026-07-09). Signed, scoped, expiring preview/action links (`lib/signed-links.ts` `preview_link` + `lib/preview-links.ts` + migration `0017_preview_links`) render a `WorkResource` from the same read model as the web desk (`lib/preview-render.ts` `buildWorkResource` over `buildEmployeeSnapshot`, artifacts kind-agnostic not PDF-only). Token-only `POST /manager/preview/resolve` + owner-authenticated `POST /manager/preview/action` (approve/reject reuse the idempotent `resolve_approval`; respond routes into the owner-turn pipeline; single-use `consumed_at`). SMS carries a grammar-aware `descriptor.preview_url` minted in `employee-events.ts` (no inbound keyword parser — the employee LLM resolves via MCP `resolve_approval`); signed `/webhooks/twilio/status` delivery callback. Web `agent/[employeeId]/review` token-auth mobile surface + fixture screenshot. First `WorkResource`/`WorkAction` shared contracts (Phase 4 seam; `SurfaceEnvelope`/`EmployeeEventStream`/capability registry deferred). Static+fixture green (58 files / 346 unit tests); live SMS/tool-loop proof pending the temporary model bridge.
- **MVP hardening pass (2026-07-09):** `source-wired`, live DB migrated. Fixed 5 Phase-3 review findings (dead "Open document" action → `WorkResource.open_url`; expired-vs-invalid token via `decodeSignedToken` → 410 reissue; approval-preview amount persisted on the approval refs; `createPreviewLink`/false-success inserts → `mustWrite`; deliver-path pre-dedupe orphan → binds moved after the dedupe claim) and a sweep of accumulated stragglers: **CRITICAL RLS closure** (migrations 0018-0021 — all 21 unprotected public tables now Manager-only, turn-queue RPCs revoked from anon; verified by Supabase `get_advisors` + `has_function_privilege`), stuck-`running`-turn reaper, Stripe atomic webhook dedupe, `mustWrite` false-success fixes (gmail refresh, claim link, owner session), Twilio `StatusCallback` wiring, best-effort access counters, retention GC lane, and `denyInternal` fail-closed hardening. 59 files / 356 unit tests green.
- **Second-half Phase 4 production materialization/capability layer:** `source-wired` (2026-07-10); live provider/runtime proof still `pending`. Added shared `SurfaceEnvelope`, `CapabilityGraphNode`, proof/safety/render envelopes, and employee stream event contracts; Manager capability registry over tool schemas + MCP + connector state + runtime health + policy; generic materialization projection from current rows; Manager MCP `resources/list` + `resources/read`; internal materialization diagnostics endpoint; tuple `(created_at,id)` Work Surface cursor; serialized SSE progress writes; atomic signed-link counter RPCs; stricter secret-ref direct-read posture; and an over-budget turn-drain fail/notify path. Local proof: typecheck, 373 unit tests, lint, build, UI fixture smoke; integration suite env-skipped.
- **Pre-tenant agent trust-boundary hardening:** `source-wired` (2026-07-10); live DB/runtime proof still `pending`. Replaced the employee-container shared Manager bearer path with per-employee scoped MCP credentials (`0023_agent_boundary_hardening.sql`, `lib/mcp-auth.ts`), removed `MANAGER_INTERNAL_TOKEN` from rendered employee env/config, made `/manager/mcp` derive identity from the scoped credential instead of headers, blocked employee self-resolution of high-risk approvals, and added immediate Docker launch hardening flags. Old rendered profiles must be reprovisioned before real tenant use.
- **Audit-fix pass (2026-07-10):** `source-wired`. A skeptical direct-code audit against `architecture-and-security-review-2026-07.md` found and fixed four gaps beyond that review: (1) `packages/shared/src/approval-policy.ts` centralizes approval `action_key` gating (`SEND_GATE_ACTION_KEY_GROUPS` → derived `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`) so a send-gated action_key can no longer silently miss the owner-auth-required set (previously three independently-maintained literal Sets in `estimate.stub.ts`/`gmail.stub.ts`/`stripe.stub.ts` plus `employee-events.ts`'s own fallback literals); (2) migration `0024_turn_claim_lock_race_fix.sql` closes an unhandled 23505 in `claim_employee_turn_job[_for_employee]` via `ON CONFLICT (employee_id) DO NOTHING` on the `employee_turn_locks` insert, proven by a new env-gated `tests/integration/turn-claim-race.integration.test.ts`; (3) `reapStuckTurns` (`lib/turn-drain.ts`) now guards its requeue/fail updates with `lease_token` + `status='running'`, matching `complete_employee_turn_job`'s compare-and-swap, closing a lost-update race that could duplicate a customer-facing send; (4) `runtime-backend.ts`'s new `isLocalRuntimeBackendAllowed()` is a real provisioning-time admission check (default-deny, `ALLOW_LOCAL_RUNTIME_BACKEND` opt-in, hard-vetoed under `NODE_ENV=production`) — previously `isProductionRuntimeBackend()` existed but was only used for health-scoring, never to reject provisioning a real tenant onto the uncontained `local` backend. Local proof: typecheck, 67 files / 400 unit tests (+17), build, lint; integration 11 skipped cleanly. Migration `0024` not yet applied live.
- **Current priority:** close the live tool-execution gate with a real Hermes model loop / funded provider (the throwaway bridge returns tool-call JSON as text and does not run Hermes's tool loop), then provider-prove Phase 3 SMS previews and Phase 4 materialization against live Hermes/provider events; apply migration `0024` live and run the new turn-claim-race integration test for real proof.

Do not mark provider or runtime acceptance without real proof ids. Local tests do not prove live acceptance.

## 4. End-user experience graph

The user-facing whole-product path:

```text
Owner creates employee
  -> front-door onboarding (web or SMS)
  -> phone verification / claim token
  -> account + owner session
  -> provision_employee renders a Hermes profile package
  -> employee is reachable through SMS and web
  -> owner asks for estimate
  -> Hermes employee uses Manager tools to create/store/link PDF artifact
  -> owner approves customer-facing action
  -> Gmail sends estimate
  -> real customer reply becomes a work event
  -> owner approves Stripe test-mode deposit invoice
  -> payment event becomes a work event
  -> employee sets/fires internal job reminder
  -> Work Surface shows daily brief, job folders, cards, receipts, approvals, chat
  -> second-half product layer materializes the same work as web previews, SMS signed links, admin proof, and future desktop/email/customer-link renderings
```

The code intentionally keeps customer-facing sends and money movement behind approval gates.

Second-half surface target:

```text
Hermes/Manager/provider events
  -> EmployeeEventStream
  -> SurfaceEnvelope + WorkResource + WorkAction
  -> web employee desk / SMS ambient inbox / signed preview / admin inspector / optional desktop
```

## 5. Runtime model and Hermes boundary

Hermes is the employee substrate:

- `packages/agent-template/` is the AMTECH-authored Hermes profile package.
- `apps/manager/src/provisioner.ts` and `apps/manager/src/lib/profile-renderer.ts` render package params into a per-employee profile.
- `apps/manager/src/lib/hermes-client.ts` talks to real Hermes API Server endpoints; `runtime.ts` is now a compatibility wrapper around queued owner turns and rejects legacy invented endpoint paths.
- `infra/hermes/RUNBOOK.md` documents local/manual Hermes setup and smoke testing.
- `infra/scripts/hermes-jobs-runner.mjs` is the production-oriented scheduler entrypoint for Hermes Jobs.

Important architecture truth from `../wiki/MVP/agent-inbox-and-channel-architecture.md` and
`../wiki/MVP/hermes-run-session-semantics-research.md`:

- Hermes HTTP Runs/Sessions are turn-atomic.
- Native Hermes delegation/subagents can help bounded work re-enter an active session.
- Durable/external work should run through Jobs or worker lanes, then re-enter as a message to the agent.
- Manager owns the fallback serialized inbox and the Channel/Session/Presence router.
- The conversation is a brain artifact, not a channel artifact. SMS, web, and future voice attach to one thread.

## 6. Authored source map

Generated/local-heavy paths such as `node_modules/`, `.next/`, `dist/`, `tsconfig.tsbuildinfo`, and acceptance
report outputs are not authoritative. Prefer authored source, migrations, docs, tests, and scripts.

### Root build files

| Path | Role |
|---|---|
| `package.json` | npm workspace root. Defines build/typecheck/test/lint, db migration, dev servers, scheduler, ops, and acceptance commands. |
| `.env.example` | Environment inventory for Supabase, Twilio, Hermes/runtime, Gmail/PubSub, Stripe, Manager auth, and orchestrator model. |
| `tsconfig.base.json`, `eslint.config.mjs`, `vitest*.config.ts` | Shared TypeScript, lint, unit, and integration test config. |
| `CLAUDE.md`, `AGENTS.md` | Build-home operating guide; keep mirrored. |
| `README.md` | Human-facing build status, stack, run commands, working/planned feature overview. |
| `CODEGRAPH.md` | This file; keep current when source layout or phase status changes materially. |
| `ui-handoff/` | UI contributor packet for working on owner surfaces while MVP functionality continues: orientation, current UI map, research/principles, experimental future surfaces, and handoff protocol. |

### Web app - owner surfaces and browser routes

| Path | Feature connection |
|---|---|
| `apps/web/app/page.tsx` | Landing/root route into the product surface. |
| `apps/web/app/create-ai-employee/page.tsx` | Web front door for creating an employee. Calls front-door API routes. |
| `apps/web/app/claim/` | Claim flow after SMS/link verification; consumes Manager claim token and creates owner session. |
| `apps/web/app/login/page.tsx` | Owner login surface. |
| `apps/web/app/api/front-door/*` | Browser-facing proxies for onboarding, verification, claim-token, account creation, provisioning, and front-door messages. |
| `apps/web/app/api/_lib/manager.ts` | Shared proxy to Manager with internal token handling. |
| `apps/web/app/agent/[employeeId]/page.tsx` | Authenticated owner Work Surface route. |
| `apps/web/app/agent/[employeeId]/AgentClient.tsx` | Main Work Surface client: multi-region employee desk with left navigation, center work views, right preview pane, persisted conversation, tasks/outputs/connectors/abilities/activity views, SSE/poll fallback, and approval/work-card actions. |
| `apps/web/app/agent/[employeeId]/components/*` | Presentation components for approval cards, work cards, receipts, daily brief, and job folders. |
| `apps/web/app/agent/[employeeId]/components/deliverables/index.tsx` | Deliverable-type renderers used by work cards. |
| `apps/web/app/agent/[employeeId]/lib/group-by-job.ts` | Groups artifacts/events/invoices/reminders into owner-readable job folders. |
| `apps/web/app/agent/[employeeId]/lib/surface-model.ts` | Client-side view model helpers for nav counts, default preview selection, owner-facing connector labels, and status tone mapping. |
| `apps/web/app/agent/[employeeId]/fixtures.ts` | Representative local `ResourcePayload` fixture for UI-only development/testing when `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`; avoids Manager/Supabase/Docker/Hermes/provider/model dependencies. |
| `apps/web/app/agent/[employeeId]/surface-types.ts` | Resource payload shape used by the Work Surface. |
| `apps/web/app/agent/[employeeId]/surface.tokens.ts` | Work Surface visual tokens. |
| `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts` | Signed artifact/owner-session resolution route for PDFs and other outputs; redirects stored files and renders Manager-provided safe HTML fallbacks for payload-only artifacts. |
| `apps/web/app/agent/[employeeId]/review/{page.tsx,ReviewClient.tsx}` | Phase 3 signed mobile review surface (token-auth, no owner login): resolves a `WorkResource` via `/manager/preview/resolve` and renders a mobile-first sticky Approve/Decline/Reply bar; documents in a sandboxed iframe; fixture mode for UI-only work. |
| `apps/web/app/api/employee/[employeeId]/preview/action/route.ts` | Proxy for owner-authenticated signed preview actions to `/manager/preview/action`. |
| `apps/web/app/api/employee/[employeeId]/resources/route.ts` | Loads Work Surface snapshot through Manager. |
| `apps/web/app/api/employee/[employeeId]/events/route.ts` | SSE-shaped snapshot route; currently sends one snapshot and closes, with polling fallback. |
| `apps/web/app/api/employee/[employeeId]/message/route.ts` | Sends owner webchat messages to the employee runtime through Manager. |
| `apps/web/app/api/employee/[employeeId]/approval/resolve/route.ts` | Resolves Manager approval records from web. Same acceptance primitive as SMS/future voice. |

### Manager app - backend control plane

| Path | Feature connection |
|---|---|
| `apps/manager/src/server.ts` | Hono server entrypoint. Registers health, Manager tools (via `runManagerTool`), the `/manager/mcp` MCP server endpoint, scheduler, claim consume, owner message routing, artifact/resource routes, webhooks, orchestrator, and provisioner. |
| `apps/manager/src/orchestrator.ts` | Front-door onboarding orchestrator routes. Uses model adapter and manifest contract. |
| `apps/manager/src/lib/orchestrator-model.ts` | OpenAI-compatible Chat Completions adapter with structured output fallback. |
| `apps/manager/src/provisioner.ts` | Production-shaped `POST /provision` and profile/package provisioning flow. |
| `apps/manager/src/lib/profile-renderer.ts` | Renders profile package params into Hermes profile files. |
| `apps/manager/src/lib/runtime-backend.ts` | Runtime backend policy; Docker default, `local` dev/demo only. `isLocalRuntimeBackendAllowed()` is the real provisioning-time admission check (default-deny, `ALLOW_LOCAL_RUNTIME_BACKEND` opt-in, hard-vetoed under `NODE_ENV=production`), consumed by `provisioning.stub.ts`. |
| `apps/manager/src/lib/runtime.ts` | Compatibility wrapper for queued owner turns; legacy invented endpoint paths fail closed. |
| `apps/manager/src/lib/hermes-client.ts` | Authenticated Hermes API Server client for health, capabilities, toolset introspection (`getToolsets` → `/v1/toolsets`), canonical session creation, and Sessions chat turns. |
| `apps/manager/src/lib/run-tool.ts` | Single Manager-tool dispatch path shared by the HTTP route and the MCP server: validates input against the zod schema, blocks scheduler-only tools, runs the existing registry handler (gates/audit reused). |
| `apps/manager/src/lib/mcp-server.ts` | Manager control plane exposed as a native MCP server (`@modelcontextprotocol/sdk`, web-standard streamable-http, stateless). `tools/list` = tool JSON Schemas; `tools/call` → `runManagerTool`; Phase 4 read-only `resources/list`/`resources/read` expose owner-safe business brain, connector, artifact, approval, work queue, runtime health, and capability registry state under bound identity. |
| `apps/manager/src/lib/mcp-auth.ts` | Per-employee scoped MCP credential mint/verify/revoke helpers. `/manager/mcp` uses this to derive account/employee identity from a hashed `mcp_...` credential instead of the global Manager internal bearer or spoofable identity headers. |
| `apps/manager/src/lib/capability-registry.ts` | Phase 4 owner-language capability graph builder. Merges Manager tool schemas/MCP callable surface, connector status, runtime health, and policy into `CapabilityGraphNode`s and backfills legacy `abilities`. |
| `apps/manager/src/lib/materialization.ts` | Phase 4 generic materialization projection from the existing employee snapshot rows into `SurfaceEnvelope`, `WorkResource`, and `WorkAction` lists with proof/safety/render metadata. |
| `apps/manager/src/lib/turn-queue.ts` | DB-backed per-employee turn queue/lease helpers for multi-instance-safe Hermes turn serialization. |
| `apps/manager/src/lib/channel-router.ts` | Minimal Channel/Session/Presence router: heartbeat/SMS presence, delivery decisions, active-web-wins, silent record, SMS fallback. |
| `apps/manager/src/lib/wake.ts` | Phase 4-core wake path: prompts Hermes for JSON descriptors, parses, stamps identity, validates, retries once, and repairs on failure. |
| `apps/manager/src/lib/sms-sender.ts` | Dedicated employee-number sender resolution and production fail-closed sender identity. |
| `apps/manager/src/lib/runtime-health.ts` | Runtime health snapshots for employee runtimes. |
| `apps/manager/src/lib/scheduler-runner.ts` | Protected scheduler boundary for reminders, watch renewal, daily briefs, runtime health checks, `drain_employee_turns`, `flush_event_batches`, and the `reap_stuck_turns` + `cleanup_expired` lanes. |
| `apps/manager/src/lib/turn-drain.ts` | Drains straggler owner-chat turns FIFO and delivers replies out-of-band via the channel router; `reapStuckTurns` recovers turns stuck in `running` after a worker crash (requeue under the attempt budget, else fail + notify the owner); event-wakes fail closed. Its requeue/fail updates are guarded by `lease_token` + `status='running'` (matching `complete_employee_turn_job`'s compare-and-swap) so a turn that legitimately completes right at the lease boundary can't be clobbered back to queued/failed. |
| `apps/manager/src/lib/cleanup.ts` | Retention GC (`cleanup_expired` lane): best-effort prune of long-past `preview_links`, `claim_tokens`, `delivery_decisions`, `inbound_events` so a long-lived VPS doesn't grow unbounded. |
| `apps/manager/src/lib/metering.ts` | Phase 6 best-effort metering: `startWorkRun`/`finishWorkRun`/`recordMeterEvent`/`recordToolInvocation`; never aborts the owner-facing action. |
| `apps/manager/src/tools/registry.ts` | Tool registry; fails if any shared `TOOL_NAMES` handler is missing. |
| `apps/manager/src/tools/identity.stub.ts` | Phone verification, account creation, owner/session identity tools. |
| `apps/manager/src/tools/provisioning.stub.ts` | `provision_employee`, provisioning status, profile package install/start seams. |
| `apps/manager/src/tools/estimate.stub.ts` | Business brain, estimate artifact creation, PDF registration/storage/linking, approvals. |
| `apps/manager/src/tools/gmail.stub.ts` | Gmail OAuth, token custody, connector test, draft/send, watch/history/PubSub handling, watch renewal. |
| `apps/manager/src/tools/stripe.stub.ts` | Stripe Connect test-mode account, onboarding, deposit invoice, invoice send, webhook handling. |
| `apps/manager/src/tools/events.stub.ts` | `send_employee_event`, reminders, daily briefs, scheduler-facing event/reminder tools. |
| `apps/manager/src/tools/repair.stub.ts` | Repair queue operations: replay, relink, duplicate, redeliver, suppress, regenerate onboarding link. |
| `apps/manager/src/tools/types.ts` | Tool handler/context types. |
| `apps/manager/src/lib/employee-events.ts` | Central event delivery primitive: dedupe, triage, atomic wake claim, descriptor binding, inbound event/message rows, and router-backed owner delivery. |
| `apps/manager/src/lib/event-triage.ts` | Suppression, repair, batch-candidate decisions. |
| `apps/manager/src/events/registry.ts` | Generic event-source registry. |
| `apps/manager/src/events/ingress.ts`, `apps/manager/src/events/adapters/*` | Primary generic ingress spine for Gmail, Stripe, and Manager events: structural verify, safe-fact normalize, route deliver-only vs wake. |
| `apps/manager/src/webhooks/twilio.ts` | Twilio inbound SMS and signature boundary. |
| `apps/manager/src/webhooks/gmail.ts` | Gmail/PubSub push verification and event entry. |
| `apps/manager/src/webhooks/stripe.ts` | Stripe signed webhook verification and event entry. |
| `apps/manager/src/lib/artifacts.ts` | Private Supabase Storage artifact upload and signed URL generation. |
| `apps/manager/src/lib/artifact-view.ts` | Deterministic escaped HTML fallback renderer for structured artifact payloads that do not yet have a stored file/PDF. |
| `apps/manager/src/lib/preview-links.ts` | Phase 3 signed preview/action links: `createPreviewLink` (mint token + persist `preview_links` row) and `resolvePreviewLink` (auth primitive; fails closed on invalid/expired/revoked/scope-mismatch — cross-account tokens cannot widen scope). |
| `apps/manager/src/lib/preview-render.ts` | `buildWorkResource` — renders a `WorkResource` for a signed preview from the same read model the web desk uses (`buildEmployeeSnapshot` + `renderArtifactHtml`); artifacts are kind-agnostic (stored file / payload HTML / media), not PDF-only. |
| `apps/manager/src/lib/audit.ts` | Safe audit-log writes. |
| `apps/manager/src/lib/db.ts` | DB fault helpers and duplicate-insert handling. |
| `apps/manager/src/lib/secrets.ts` | Secret sealing/reference handling. No raw provider tokens to model/browser/logs. |
| `apps/manager/src/lib/signed-links.ts` | Claim/artifact/preview signed-token mint/verify/hash helpers (`preview_link` purpose + `mint/verifyPreviewToken` for Phase 3 scoped mobile links). |
| `apps/manager/src/lib/owner-session.ts` | Owner web-session validation. |
| `apps/manager/src/lib/twilio.ts` | Twilio Verify/SMS helpers. |
| `apps/manager/src/lib/google-gmail.ts`, `gmail-tokens.ts`, `mime.ts`, `pubsub.ts`, `oauth-state.ts` | Gmail connector internals. |
| `apps/manager/src/lib/signature.ts`, `stripe-signature.ts` | Provider signature/security helpers. |
| `apps/manager/src/lib/entitlements.ts` | Default-allow feature/usage scaffolding for later monetization/paywalls. |

### Shared contracts

| Path | Feature connection |
|---|---|
| `packages/shared/src/tool-contracts.ts` | Full Manager tool surface and typed tool inputs (compile-time interfaces). This is the contract shared by front door, employee, Manager, and tests. |
| `packages/shared/src/tool-schemas.ts` | Runtime zod schemas keyed by `ToolName` — the JSON-Schema source of truth for HTTP dispatch validation, MCP `tools/list`, and the schema-driven renderer. Permissive passthrough fallback for the long tail. |
| `packages/shared/src/platform-toolsets.ts` | Hermes `api_server` toolset safe-set policy (backend blast radius + provider-key availability) rendered into `config.yaml`. |
| `packages/shared/src/work-events.ts` | Typed Work Surface descriptor contract: notify/question/review, deliverable type (incl. `tool_activity`), acceptance grammar, grammar-aware SMS rendering with an optional signed `preview_url`, and `formViewFromJsonSchema` (schema → form for any tool). |
| `packages/shared/src/preview-links.ts` | Phase 3 signed-link vocabulary + the first `WorkResource`/`WorkAction` render contract (Phase 4 seam): `PreviewResourceType`, `PreviewActionType`, `defaultActionsFor`/`actionScopeFor`. |
| `packages/shared/src/resource-payload.ts` | Shared Work Surface read-model contract: Manager snapshot rows plus Phase 2 derived employee/runtime health, abilities, outputs, tasks, and Phase 4 capability/surface envelope projections consumed by the web desk and MCP resources. |
| `packages/shared/src/materialization.ts` | Phase 4 shared contracts: `SurfaceEnvelope`, `RenderHints`, `SafetyEnvelope`, `ProofEnvelope`, `CapabilityGraphNode`, `EmployeeEventStreamEvent`, and aggregate `MaterializedWork`. |
| `packages/shared/src/approval-policy.ts` | Single source of truth for approval `action_key` gating: `SEND_GATE_ACTION_KEY_GROUPS` (one array per send-gated tool family) derives `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`, so a new send-gate key structurally cannot miss owner-authenticated-resolution requirement. `requiresOwnerAuthenticatedResolution()` is consumed by `estimate.stub.ts`'s `resolve_approval`; the key constants are consumed by `gmail.stub.ts`/`stripe.stub.ts`'s send-gates and `employee-events.ts`'s `approvalActionKey()` fallback. |
| `packages/shared/src/manifest.ts` | Seven-question onboarding manifest and validation. |
| `packages/shared/src/profile-package.ts` | Profile package keys and render/build parameter types. |
| `packages/shared/src/routes.ts` | Shared Manager route builders. |
| `packages/shared/src/event-types.ts` | Event source/type definitions. |
| `packages/shared/src/envelope.ts` | Tool envelope success/failure shape. |
| `packages/shared/src/ids.ts` | ID prefixes and `newId` helper. |
| `packages/shared/src/index.ts` | Public export barrel. |

### Database and migrations

| Path | Feature connection |
|---|---|
| `packages/db/src/index.ts` | Supabase client exports for Manager/service/anon use. |
| `packages/db/migrate.mjs` | Migration runner/status command. |
| `packages/db/migrations/0001_init.sql` | Baseline schema: accounts, employees, onboarding, tools, events, artifacts, approvals, usage/audit, provider primitives. |
| `packages/db/migrations/0002_rls.sql` | RLS posture and grants. |
| `packages/db/migrations/0003_phase1_profile_packages.sql` | Profile packages and provisioning records. |
| `packages/db/migrations/0022_phase4_materialization.sql` | Phase 4 manager-only materialization tables, atomic signed-link counter RPCs, and secret-reference direct-read policy tightening for connector tables. |
| `packages/db/migrations/0004_phase2_artifacts.sql` | Artifact/storage/approval additions. |
| `packages/db/migrations/0005_phase3_gmail.sql` | Gmail connector/watch/history/reply state. |
| `packages/db/migrations/0006_phase5_reminders.sql` | Job commitments and reminders. |
| `packages/db/migrations/0007_phase6_repair_and_jobs.sql` | Repair queue, job-run proof, source suppression, triage/batching, event-bus seams. |
| `packages/db/migrations/0008_phase2_runtime_scheduler.sql` | Runtime health checks and scheduler job-run metadata. |
| `packages/db/migrations/0009_phase5_reminder_idempotency.sql` | Reminder idempotency backstop. |
| `packages/db/migrations/0010_phase3_inbound_event_dedupe.sql` | Unique inbound event idempotency key backstop for at-least-once webhooks. |
| `packages/db/migrations/0011_phase4_hermes_runtime.sql` | Runtime API fields, private `runtime_endpoint_secrets`, `employee_turn_jobs`/`employee_turn_locks` + claim/complete plpgsql. |
| `packages/db/migrations/0012_phase3a_channel_router.sql` | `channel_sessions` + `delivery_decisions` (presence, delivery-decision proof). |
| `packages/db/migrations/0013_phase6_metering.sql` | Six Manager-only metering ledgers (`work_runs`, `meter_events`, `tool_invocations`, `meter_pricing_versions`, `usage_rollups_daily`, `budget_policies`) + additive `run_id` columns. |
| `packages/db/migrations/0014_phase4_turn_claim_run_id.sql` | Recreates turn-claim RPCs so `run_id` crosses the real Postgres claim boundary for the drain lane. |
| `packages/db/migrations/0015_hermes_runs_capabilities_alignment.sql` | Adds stable Hermes session-key storage and external Hermes run id correlation on Manager-owned `work_runs`. |
| `packages/db/migrations/0016_phase5_event_batching.sql` | Event-batching support for triage/digest lanes. |
| `packages/db/migrations/0017_phase3_preview_links.sql` | `preview_links` — Manager-only (RLS on, no browser grants) backing table for Phase 3 signed preview/action tokens: resource scope, `actions[]`, expiry/revoke, single-use `consumed_at`, `access_count`. |
| `packages/db/migrations/0018_manager_only_rls.sql` | Closes the RLS gap: enables RLS (no policy = Manager-only) on the 21 earlier public tables that had none (users, onboarding_sessions, claim_tokens, inbound_email_events, audit_log, stripe_*, …) so the anon Data API can no longer read them cross-tenant. |
| `packages/db/migrations/0019_migrations_table_rls.sql` | RLS on the migration runner's own `_migrations` bookkeeping table (owner bypass keeps the runner working). |
| `packages/db/migrations/0020_revoke_turn_rpc_from_anon.sql`, `0021_turn_rpc_grants_fix.sql` | Lock the `claim/complete_employee_turn_job` SECURITY DEFINER RPCs to `service_role`: revoke EXECUTE from `public`/anon/authenticated (0021 fixes the PUBLIC-inherited grant 0020 missed) so anon can't claim owner turns / read message bodies via `/rest/v1/rpc`. |
| `packages/db/migrations/0023_agent_boundary_hardening.sql` | `employee_mcp_credentials` (Manager-only, hashed per-employee scoped MCP bearer, `token_hash` unique) — the pre-tenant trust-boundary hardening pass; see `lib/mcp-auth.ts`. |
| `packages/db/migrations/0024_turn_claim_lock_race_fix.sql` | `CREATE OR REPLACE FUNCTION` for `claim_employee_turn_job[_for_employee]`: adds `ON CONFLICT (employee_id) DO NOTHING` on the `employee_turn_locks` insert so two concurrent claims for the same employee (2+ queued turns) no longer raise an uncaught 23505 — the loser now cleanly returns zero rows. Signature-preserving, so the `service_role`-only grants from 0020/0021 carry over without a re-grant. |

### Hermes profile package

| Path | Feature connection |
|---|---|
| `packages/agent-template/README.md` | Render contract and package layout. |
| `packages/agent-template/SOUL.md` | Constant employee persona and SMS voice. |
| `packages/agent-template/config.yaml` | Hermes profile config; includes rendered runtime backend token, `platform_toolsets.api_server` (rendered safe-set), and `mcp_servers.amtech_manager` (Manager MCP server, bearer header). |
| `packages/agent-template/distribution.yaml` | Package metadata/distribution shape. |
| `packages/agent-template/.env.tpl` | Per-profile env template; secrets by reference. |
| `packages/agent-template/profile.params.example.yaml` | Example render params. |
| `packages/agent-template/workspace/AGENTS.md` | Runtime policy loaded into employee workspace, including confirmation gates. |
| `packages/agent-template/workspace/manager-tools.md` | Tool-call contract the employee uses to talk to Manager. |
| `packages/agent-template/workspace/brain/business-brain.md` | Seed business brain; starts thin and is filled over time. |
| `packages/agent-template/workspace/brain/customers.md` | Seed customer memory. |
| `packages/agent-template/skills/estimate/SKILL.md` | Contractor estimate wedge skill; main MVP proof path. |
| `packages/agent-template/skills/invoice/SKILL.md` | Invoice/deposit support skill. |
| `packages/agent-template/skills/daily-checkin/SKILL.md` | Daily brief/check-in skill. |

### Infra, ops, and acceptance

| Path | Feature connection |
|---|---|
| `infra/caddy/Caddyfile`, `infra/caddy/client-snippet.tpl` | Host routing for web, Manager, and per-employee gateways. |
| `infra/hermes/RUNBOOK.md` | Hermes install/smoke/run guidance. |
| `infra/scripts/README.md` | Ops script index. |
| `infra/scripts/acceptance/preflight.mjs` | Phase 1 acceptance env/proof readiness matrix. |
| `infra/scripts/acceptance/report.mjs` | Runs all 8 verifiers and writes gitignored reports. |
| `infra/scripts/acceptance/run1-db-rls.mjs` | Supabase/RLS acceptance verifier. |
| `infra/scripts/acceptance/run2-provision.mjs` | Provisioning/runtime acceptance verifier. |
| `infra/scripts/acceptance/run3-artifact.mjs` | Artifact/storage/signed-link verifier. |
| `infra/scripts/acceptance/run4-gmail.mjs` | Gmail/PubSub verifier. |
| `infra/scripts/acceptance/run5-stripe.mjs` | Stripe Connect/invoice/webhook verifier. |
| `infra/scripts/acceptance/run6-reminder.mjs` | Reminder/scheduler verifier. |
| `infra/scripts/acceptance/run7-repair-eventbus.mjs` | Repair/event-bus verifier. |
| `infra/scripts/acceptance/run8-security.mjs` | Forged-request/security verifier. |
| `infra/scripts/scheduler-tick.mjs` | Dev/manual scheduler fallback through Manager. |
| `infra/scripts/hermes-jobs-runner.mjs` | Production-oriented Hermes Jobs scheduler entrypoint. |
| `infra/scripts/ui/fixture-browser.mjs` | UI-only Playwright fixture runner. Starts fixture-backed Next dev server on loopback, warms the Work Surface fixture route, opens headed browser or runs smoke checks, and writes screenshots under `infra/.local/ui-fixtures/`. |
| `infra/scripts/healthcheck.mjs` | Runtime health persistence and endpoint health update. |
| `infra/scripts/number-pool.mjs` | Twilio number inventory/status. |
| `infra/scripts/repair.mjs` | Repair ops wrapper. |
| `infra/scripts/provisioner-health.mjs`, `profile-validate.mjs`, `hermes-smoke.mjs`, `phase01-proof.mjs` | Provisioning/profile/Hermes/proof helpers. |

### Tests and proof docs

| Path | Feature connection |
|---|---|
| `tests/unit/` | Unit coverage for contracts, security helpers, Manager tools, provider helpers, event bus, reminders, scheduler, runtime backend, Work Surface grouping. Mocks are allowed here. |
| `tests/integration/rls-cross-account.test.ts` | Env-gated live Supabase RLS/cross-account denial. |
| `tests/integration/security-live.test.ts` | Env-gated live security boundary checks. |
| `tests/golden-path/step1-create-employee.md` | Manual acceptance script for create employee. |
| `tests/golden-path/step2-estimate-artifact.md` | Manual acceptance script for estimate artifact. |
| `tests/golden-path/step3-gmail-reply-loop.md` | Manual acceptance script for Gmail reply loop. |
| `tests/golden-path/step4-stripe-deposit.md` | Manual acceptance script for Stripe deposit. |
| `tests/golden-path/step5-reply-paid-to-reminder.md` | Manual acceptance script for reply/paid/reminder close loop. |
| `tests/golden-path/step6-repair-and-event-bus.md` | Manual acceptance script for repair/event bus. |
| `tests/golden-path/step7-security.md` | Manual acceptance script for security. |

### Docs and memory

| Path | Role |
|---|---|
| `docs/admin-system-architecture.md` | Planned admin/operator architecture. |
| `docs/admin-system-implementation-plan.md` | Planned admin implementation sequence. |
| `docs/metering-architecture.md` | Planned production metering architecture. |
| `docs/metering-implementation-plan.md` | Planned metering implementation sequence. |
| `second-half-plan/README.md` | Active second-half forward plan for moving from source-wired prototype to free trials and paid pilots. |
| `second-half-plan/phase-00-current-state-handoff.md` | Large current-state handoff: code, dirty tree, architecture, UI/SMS gaps, deployment/factory state, and readiness. |
| `second-half-plan/phase-01-preserve-and-close-live-gate.md` | Immediate next phase: preserve interrupted tool-enabled employee work and close local live gate. |
| `second-half-plan/phase-01-handoff-prompt.md` | Copy-ready implementation prompt for a fresh agent to complete Phase 1. |
| `second-half-plan/phase-02-owner-work-surface-redesign.md` | Planned web employee desk redesign inspired by Hermes Desktop/WebUI/Workspace. |
| `second-half-plan/phase-03-sms-ambient-inbox-and-link-previews.md` | Planned SMS ambient inbox and signed-preview/action surface. |
| `second-half-plan/phase-04-tool-agnostic-capability-and-renderer-layer.md` | Planned capability/rendering/materialization layer: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, generic renderers. |
| `second-half-plan/phase-05-trial-operations-admin-billing.md` | Planned factory/admin/billing/operations layer for trials and paid pilots. |
| `second-half-plan/phase-06-free-trial-and-paid-pilot-readiness.md` | Planned launch gate across proof, UX, SMS, admin, billing, and support. |
| `second-half-plan/surface-research-hermes-gui-and-materialization.md` | Deep Hermes Workspace/WebUI/Desktop research translated into AMTECH surfaces and materialization strategy. |
| `ui-handoff/README.md` | Entry point for a UI-focused partner: read order, current phase position, safe work areas, and product mental model. |
| `ui-handoff/product-grounding.md` | Product grounding for UI agents: AMTECH product power, owner mental model, wiki-vs-`mvp-build` distinction, current source reality, and UI north star. |
| `ui-handoff/current-ui-map.md` | Source map for the current web UI, Work Surface data flow, styling state, and refactor boundaries. |
| `ui-handoff/research-and-principles.md` | Index of UI research, Hermes GUI discoveries, generative UI principles, and owner-facing vocabulary. |
| `ui-handoff/experiments-and-future-surfaces.md` | Design backlog for signed SMS previews, preview images/media/video, task progress, artifact representations, and cross-surface data renderings; web remains first priority. |
| `ui-handoff/working-protocol.md` | Parallel UI contributor workflow: checks, memory/handoff rules, contract boundaries, and coordination guidance. |
| `memory/MEMORY.md` | Durable memory writing protocol and handoff index. |
| `memory/YYYY-MM-DD-HHMM-*.md` | Dated agentic-dev handoffs and architectural decisions. |

## 7. Feature graph

### Front door, claim, account, provisioning

```text
apps/web/app/create-ai-employee/page.tsx
  -> apps/web/app/api/front-door/*
  -> apps/manager/src/orchestrator.ts
  -> apps/manager/src/lib/orchestrator-model.ts
  -> packages/shared/src/manifest.ts
  -> apps/manager/src/tools/identity.stub.ts
  -> apps/manager/src/tools/provisioning.stub.ts
  -> apps/manager/src/provisioner.ts
  -> apps/manager/src/lib/profile-renderer.ts
  -> packages/agent-template/*
  -> packages/db/migrations/0003_phase1_profile_packages.sql
```

End-user result: owner answers onboarding questions, verifies phone, creates account, and receives a live employee.

### Owner webchat and SMS runtime messages

```text
apps/web/app/agent/[employeeId]/AgentClient.tsx
  -> apps/web/app/api/employee/[employeeId]/message/route.ts
  -> apps/manager/src/server.ts /manager/employee/:employeeId/message
  -> apps/manager/src/lib/owner-session.ts
  -> apps/manager/src/lib/runtime.ts deliverOwnerTurnToRuntime()
  -> apps/manager/src/lib/turn-queue.ts
  -> apps/manager/src/lib/hermes-client.ts /api/sessions/{id}/chat
  -> Hermes employee runtime

apps/manager/src/webhooks/twilio.ts
  -> apps/manager/src/lib/runtime.ts deliverOwnerTurnToRuntime()
  -> apps/manager/src/lib/turn-queue.ts
  -> apps/manager/src/lib/hermes-client.ts /api/sessions/{id}/chat
  -> Hermes employee runtime
```

Router-backed employee-initiated delivery now records `delivery_decisions`; direct owner-turn replies stay on the originating channel.

### Estimate artifact and approval

```text
Hermes employee package skills/estimate/SKILL.md
  -> workspace/manager-tools.md
  -> apps/manager/src/tools/estimate.stub.ts
  -> apps/manager/src/lib/artifacts.ts
  -> packages/db/migrations/0004_phase2_artifacts.sql
  -> apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts
  -> apps/web/app/api/employee/[employeeId]/approval/resolve/route.ts
```

End-user result: the owner sees a PDF/link and approves customer-facing actions before anything leaves the business.

### Gmail reply loop

```text
apps/manager/src/tools/gmail.stub.ts
  -> apps/manager/src/lib/google-gmail.ts / gmail-tokens.ts / mime.ts / pubsub.ts
  -> apps/manager/src/webhooks/gmail.ts
  -> apps/manager/src/lib/employee-events.ts
  -> packages/shared/src/work-events.ts
  -> apps/web/app/agent/[employeeId]/AgentClient.tsx
```

End-user result: real customer replies become owner-readable work events, not raw webhook payloads.

### Stripe deposit loop

```text
apps/manager/src/tools/stripe.stub.ts
  -> apps/manager/src/webhooks/stripe.ts
  -> apps/manager/src/lib/stripe-signature.ts
  -> apps/manager/src/lib/employee-events.ts
  -> packages/shared/src/work-events.ts
  -> Work Surface / SMS event rendering
```

End-user result: approved test-mode deposit invoice actions and paid-invoice events enter the employee loop.

### Reminders, scheduler, daily briefs

```text
apps/manager/src/tools/events.stub.ts
  -> apps/manager/src/lib/scheduler-runner.ts
  -> infra/scripts/scheduler-tick.mjs
  -> infra/scripts/hermes-jobs-runner.mjs
  -> packages/db/migrations/0006_phase5_reminders.sql
  -> packages/db/migrations/0008_phase2_runtime_scheduler.sql
```

End-user result: the employee can set/fires internal reminders and generate daily brief records; runtime acceptance
still needs real Hermes job proof.

### Event mesh, repair, and future session routing

```text
provider/internal/source event
  -> apps/manager/src/webhooks/* OR scheduler/tools
  -> apps/manager/src/events/ingress.ts + events/adapters/*
  -> apps/manager/src/lib/employee-events.ts
  -> apps/manager/src/lib/event-triage.ts
  -> apps/manager/src/lib/channel-router.ts
  -> apps/manager/src/tools/repair.stub.ts
  -> packages/shared/src/work-events.ts
  -> apps/web/app/agent/[employeeId]/*
```

Forward work:

```text
Phase 3 generic ingress
  -> Phase 3A Channel/Session/Presence router
  -> Phase 4 live Hermes wake path + descriptors
  -> Phase 5 triage/batching/live Work Surface stream
```

The planned router should own presence, standing preferences, active-session-wins routing, cross-channel dedupe,
delivery-decision proof rows, and one acceptance primitive across SMS/web/voice.

## 8. Planned phase map

| Phase | Status | Code/docs to inspect first |
|---|---|---|
| 0 Baseline | source-wired | `README.md`, implementation records, existing apps/packages. |
| 1 Provider/runtime acceptance | harness source-wired, live pending | `infra/scripts/acceptance/*`, `../wiki/MVP/build-plan-current/03-provider-runtime-acceptance-plan.md`. |
| 2 Runtime/scheduler productionization | source-wired, runtime pending | `runtime-backend.ts`, `runtime-health.ts`, `scheduler-runner.ts`, `infra/scripts/hermes-jobs-runner.mjs`. |
| 3 Generic ingress/event routing | source-wired, live pending | `events/ingress.ts`, `events/adapters/*`, `employee-events.ts`, migration `0010`, phase doc. |
| 3A Channel/Session/Presence | source-wired, live pending | `channel-router.ts`, `channel_sessions`, `delivery_decisions`, web heartbeat, SMS presence. |
| 4 Live wake path/descriptors | source-wired (TDD-hardened), runtime pending | `hermes-client.ts`, `turn-queue.ts`, `wake.ts`, `turn-drain.ts`, `work-events.ts`, `employee-events.ts`, migrations `0011`-`0012`, `0014`-`0015`. |
| 5 Triage/batching/live stream | planned | `event-triage.ts`, Work Surface SSE route, Work Surface client. |
| 6 Metering foundation | source-wired | `lib/metering.ts`, migrations `0013`-`0015`, `run_id` threading; `docs/metering-*.md`. |
| 7-8 Metering instrumentation/rollups | planned | `docs/metering-*.md`, `entitlements.ts`, `usage_events`, `feature_checks`, `audit_log`. |
| 9-10 Admin | planned | `docs/admin-*.md`, provisioning/runtime health tables. |
| 11 Billing scaffold | planned | Admin docs; keep separate from owner Stripe Connect payments. |
| 12 LLM provider registry | planned | Orchestrator model adapter and metering/admin plans. |
| 13 1000-user operations | planned | Admin, metering, billing, provider registry, ops scripts. |

## 9. Local verification commands

Baseline checks from `CLAUDE.md`:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration
npm run acceptance:preflight
npm run acceptance:report
```

Expected local truth as of the current records: typecheck/build/lint pass, 67 unit files / 400 tests pass,
integration skips cleanly without live Supabase creds (6 files / 11 env-gated tests), acceptance reports no
fabricated proof until live env exists.

## 10. Update rules

Update this file when:

- a new source directory, major route, tool group, migration family, script family, or test family is added;
- phase status changes from planned/pending to source-wired/provider-accepted/runtime-accepted;
- the Hermes/session/channel model changes;
- `README.md`, `../CODEGRAPH.md`, or `../wiki/MVP/build-plan-current/` changes the canonical build state.

For substantial implementation work, also update `memory/` per `memory/MEMORY.md` and the factual
implementation records under `../wiki/MVP/implementation-records/` when code state changes.
