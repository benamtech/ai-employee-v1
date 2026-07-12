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
`second-half-plan/`; the older reconciled modular phase graph remains in `../wiki/MVP/build-plan-current/`. The parallel
Hermes context-engineering lives in `second-half-plan/context-engineering/`. **CE-1, CE-2, CE-3, and CE-4 are
source-wired** (migrations `0029`/`0030` applied live for CE-1/CE-3); live Hermes/direct-MCP proofs remain
pending. The authoritative spec is
`second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md`.

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
- **Second-half Phase 3 SMS ambient inbox + signed previews/actions:** `source-wired` (2026-07-09; approval handoff fixed 2026-07-10). Signed, scoped, expiring preview/action links (`lib/signed-links.ts` `preview_link` + `lib/preview-links.ts` + migration `0017_preview_links`) render a `WorkResource` from the same read model as the web desk (`lib/preview-render.ts` `buildWorkResource` over `buildEmployeeSnapshot`, artifacts kind-agnostic not PDF-only). Token-only `POST /manager/preview/resolve` + owner-authenticated `POST /manager/preview/action`; approve/reject reuse idempotent `resolve_approval` and now wake the employee with an owner/system turn so approved work can actually proceed; respond/edit route into the owner-turn pipeline; single-use `consumed_at`. SMS carries a grammar-aware `descriptor.preview_url` minted in `employee-events.ts` (no inbound keyword parser — the employee LLM resolves via MCP `resolve_approval`); signed `/webhooks/twilio/status` delivery callback. Web `agent/[employeeId]/review` token-auth mobile surface + fixture screenshot. First `WorkResource`/`WorkAction` shared contracts (Phase 4 seam). Live SMS/tool-loop proof still pending a provider-backed live model/runtime loop.
- **MVP hardening pass (2026-07-09):** `source-wired`, live DB migrated. Fixed 5 Phase-3 review findings (dead "Open document" action → `WorkResource.open_url`; expired-vs-invalid token via `decodeSignedToken` → 410 reissue; approval-preview amount persisted on the approval refs; `createPreviewLink`/false-success inserts → `mustWrite`; deliver-path pre-dedupe orphan → binds moved after the dedupe claim) and a sweep of accumulated stragglers: **CRITICAL RLS closure** (migrations 0018-0021 — all 21 unprotected public tables now Manager-only, turn-queue RPCs revoked from anon; verified by Supabase `get_advisors` + `has_function_privilege`), stuck-`running`-turn reaper, Stripe atomic webhook dedupe, `mustWrite` false-success fixes (gmail refresh, claim link, owner session), Twilio `StatusCallback` wiring, best-effort access counters, retention GC lane, and `denyInternal` fail-closed hardening. 59 files / 356 unit tests green.
- **Second-half Phase 4 production materialization/capability layer:** `source-wired` (2026-07-10); live provider/runtime proof still `pending`. Added shared `SurfaceEnvelope`, `CapabilityGraphNode`, proof/safety/render envelopes, and employee stream event contracts; Manager capability registry over tool schemas + MCP + connector state + runtime health + policy; generic materialization projection from current rows; Manager MCP `resources/list` + `resources/read`; internal materialization diagnostics endpoint; tuple `(created_at,id)` Work Surface cursor; serialized SSE progress writes; atomic signed-link counter RPCs; stricter secret-ref direct-read posture; and an over-budget turn-drain fail/notify path. Local proof: typecheck, 373 unit tests, lint, build, UI fixture smoke; integration suite env-skipped.
- **Pre-tenant agent trust-boundary hardening:** `source-wired` (2026-07-10); live DB/runtime proof still `pending`. Replaced the employee-container shared Manager bearer path with per-employee scoped MCP credentials (`0023_agent_boundary_hardening.sql`, `lib/mcp-auth.ts`), removed `MANAGER_INTERNAL_TOKEN` from rendered employee env/config, made `/manager/mcp` derive identity from the scoped credential instead of headers, blocked employee self-resolution of high-risk approvals, and added immediate Docker launch hardening flags. Old rendered profiles must be reprovisioned before real tenant use.
- **Audit-fix pass (2026-07-10):** `source-wired`. A skeptical direct-code audit against `architecture-and-security-review-2026-07.md` found and fixed four gaps beyond that review: (1) `packages/shared/src/approval-policy.ts` centralizes approval `action_key` gating (`SEND_GATE_ACTION_KEY_GROUPS` → derived `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`) so a send-gated action_key can no longer silently miss the owner-auth-required set (previously three independently-maintained literal Sets in `estimate.stub.ts`/`gmail.stub.ts`/`stripe.stub.ts` plus `employee-events.ts`'s own fallback literals); (2) migration `0024_turn_claim_lock_race_fix.sql` closes an unhandled 23505 in `claim_employee_turn_job[_for_employee]` via `ON CONFLICT (employee_id) DO NOTHING` on the `employee_turn_locks` insert, proven by a new env-gated `tests/integration/turn-claim-race.integration.test.ts`; (3) `reapStuckTurns` (`lib/turn-drain.ts`) now guards its requeue/fail updates with `lease_token` + `status='running'`, matching `complete_employee_turn_job`'s compare-and-swap, closing a lost-update race that could duplicate a customer-facing send; (4) `runtime-backend.ts`'s new `isLocalRuntimeBackendAllowed()` is a real provisioning-time admission check (default-deny, `ALLOW_LOCAL_RUNTIME_BACKEND` opt-in, hard-vetoed under `NODE_ENV=production`) — previously `isProductionRuntimeBackend()` existed but was only used for health-scoring, never to reject provisioning a real tenant onto the uncontained `local` backend. Local proof: typecheck, 67 files / 400 unit tests (+17), build, lint; integration 11 skipped cleanly. Migration `0024` not yet applied live.
- **Second-half Phase 5 admin/ops/trial readiness:** `source-wired` (2026-07-10); live DB/operator proof still `pending`. Added shared admin contracts/routes, migration `0025_phase5_admin_ops.sql`, Manager-only platform user/role/support-access/admin-action tables, DB-backed platform role checks, support-reason audit, server-side redaction, admin dashboard/account/employee/readiness read models, support actions for suspend/resume/disable/needs-reprovision/MCP credential rotate+revoke/event repair, and an internal Next `/admin` console proxied through `/api/admin/*` with a production `AMTECH_ADMIN_BROWSER_TOKEN` gate before browser requests can attach an operator identity. Owner surface vocabulary was tightened so raw Manager tool names/status/profile/runtime internals do not leak into owner-facing cards. Local proof: shared build, targeted admin/materialization tests, full typecheck, 68 files / 406 unit tests, lint, build, UI fixture smoke; integration suite env-skipped (6 files / 11 skipped).
- **Current priority (live-testing phase):** apply live migrations `0022`-`0026` when env/approval allows and run Supabase advisors/privilege checks; seed a real platform operator row for the admin surface; reprovision a fresh employee to prove scoped MCP auth; close the live tool-execution gate with a real Hermes model loop / funded provider, then provider-prove Phase 3 SMS previews and Phase 4/5 materialization/admin readiness against live Hermes/provider events. **QuickBooks live gate:** register an Intuit developer app, fill the `QBO_*` env, and run the sandbox handshake → approved `create_expense` → `commit_quickbooks_write` → webhook path (verifier `run10-quickbooks.mjs`); **re-verify Intuit's CloudEvents webhook envelope + refresh-token rotation policy against live docs before relying on them** (the 2026-07-31 CloudEvents cutover may have passed/shifted). Egress control remains a pre-tenant requirement.
- **QuickBooks Online connector — Phase A (2026-07-10):** `source-wired`; live provider/runtime proof `pending`. A native Manager tool family (`qbo.stub.ts`) mirroring `gmail.stub.ts`/`stripe.stub.ts` — not a bolted-on MCP subprocess. Delivered: connector lifecycle (`connect_quickbooks`/`complete_quickbooks_oauth`/`run_quickbooks_connector_test`) via `intuit-oauth`; `qbo-client.ts` over `@apigrate/quickbooks` (Accounting-API calls only; `intuit-oauth` exclusively owns refresh-token rotation, guarded by an atomic `connector_accounts.token_refresh_lease_until` compare-and-swap); entity-name resolution with disambiguation (ambiguity/zero → ask, never guess); four approval-gated write previews (`create_expense`→Purchase, `create_bill`, `create_invoice`, `create_payment`) + one commit path (`commit_quickbooks_write`); a whitelisted generic `query_quickbooks` + four reports (P&L/Balance Sheet/Aged Receivables/Aged Payables). **The confused-deputy fix both reference repos leave open:** every write stages a `quickbooks_pending_writes` row and binds the returned `approval_id` onto it (set once); `commit_quickbooks_write` verifies `row.approval_id === supplied approval_id` (not merely "some approval says approved"), atomically compare-and-swaps `pending_approval→committing`, recomputes a payload-hash tamper check, and its zod schema is a deliberate `.strict()` exception (no entity payload enters at commit). `QBO_WRITE_ACTION_KEY_GROUPS` is its own peer array in `approval-policy.ts` (not folded into the send-specific `SEND_GATE_ACTION_KEY_GROUPS`). CloudEvents-native webhook (`webhooks/quickbooks.ts`) + external-door adapter (`events/adapters/quickbooks.ts`): HMAC verify, multi-company fan-out, dedupe via `inbound_qbo_events`, QBO text treated as untrusted data (lethal-trifecta). Capability-registry wired under a new `"accounting"` `CapabilityCategory` (zero new UI). Migration `0026`; acceptance verifier `run10-quickbooks.mjs`. Docs: `docs/quickbooks-connector-{architecture,implementation-plan,api-gotchas,implementation-handoff-prompt}.md`. Local proof: typecheck, unit (6 new QBO test files incl. the approval-reuse/confused-deputy + concurrent-commit CAS tests), build, lint. Migration `0026` not yet applied live; no Intuit sandbox exercised (all mocked). Phase B (remaining entities, `/cdc` sweep, sandbox↔prod switch) and Phase C (Local Companion) remain planned.
- **Deep review / Phase 5 loose-end closure (2026-07-10):** `source-wired`; no live gates upgraded. Fixed owner-visible work-loop bugs and small correctness gaps found by reading source, not diffs: Work Surface `inbound_events` snapshot/SSE queries now scope by `account_id`/`employee_id` before limit/cursor; SMS signed-link and web approval resolution now wake the employee through the normal owner-turn/runtime path and signal the Work Surface stream; admin account detail now scopes runtime endpoints by account employees before limit; QBO lower-severity review items were closed locally (refresh contention waits through the lease, lookup cache is bounded, and full/truncated 1000-row lookup pages fail closed instead of false resolving/not_found). Added focused regressions for each. Also added a Save For Later / "No Later" research handoff for future resurfacing UX. Live migrations `0022`-`0026`, platform operator seeding, scoped-MCP reprovision proof, real Hermes tool loop, QBO sandbox proof, and egress control remain `pending`.
- **Tool-agnostic Connector Center + resurfacing projection (2026-07-11):** `source-wired`; no live gates upgraded and no Business Brain/portal work. Added shared `ConnectionSurface` and `ResurfaceItem` contracts, Manager derivation over the existing employee snapshot (`capabilities` + `surface_envelopes` + connector rows + tasks), MCP resource/admin diagnostics exposure, generic owner Connected cards, Daily Brief/Today attention counts from resurfacing items, and fixture coverage. This is the missing product use of the Phase 4 materialization/capability layer: Connected is no longer just raw Gmail/Stripe/QBO rows, and resurfacing starts as a projection before any ledger table. Local proof: full `typecheck` + 76 unit files / 488 tests + `lint` + `build` pass.
- **Production deploy readiness review + re-sequencing decision (2026-07-11):** docs-only; no code changed. A source audit found the product surfaces are far ahead of the **operational** layer: nothing in the repo starts/supervises/restarts the core services (Caddy/Web/Manager) or the per-employee containers (`runtime-backend.ts:19` says so verbatim), employee launch is an undefined `HERMES_RUNTIME_COMMAND` env string with `HERMES_VERSION` unpinned, a newly provisioned subdomain never routes (no `caddy reload` after `writeCaddySnippet`), and there is no backup/observability/egress story. Founder decision: fix **deployability + core tool-loop reliability before** further admin-panel/billing work (Phase 5 is source-wired and sufficient); orchestration target = **docker-compose** core + per-account employee containers. Both are docs: `docs/production-deploy-readiness-review-2026-07-11.md` and `second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`. Also refreshed the GTM wiki to current product state (surfaces source-wired; Hermes's real OOTB capability breadth; the multi-plan "phase number" caveat).
- **Pod Alpha runtime proof harness (2026-07-11):** `source-wired`. Executable operator proof layer for the re-sequenced runtime work: JSON-emitting `deploy:smoke`, real-container `ops:caddy-proof`, host-side `ops:reprovision-scoped-mcp`, guarded `capacity:pod-alpha` benchmark, off-host `ops:backup`/dry-run `ops:restore`, `ops:red-health`, and dry-run/apply `ops:egress-policy`, plus `docs/pod-alpha-runtime-runbook.md`. Scripts write `infra/proofs/*.json`.
- **Pod Alpha orchestration substrate — lifecycle + DNS/routing proven on a real Docker host (2026-07-11):** the compose core + per-employee fleet DNS/routing/lifecycle is now proven on a real host (Docker Engine 29.5.2), not just source-wired; the LLM tool loop stays out of scope (a separate funded-creds concern). On-host: `amtech_runtime` user-defined bridge (compose `networks.amtech_runtime.external: true` — host-owned so it outlives `compose down` and both the fixed core and provisioner-launched employees share it); `hermes-agent:0.18.0` pinned (image self-reports v0.18.0); `HERMES_DOCKER_NETWORK=amtech_runtime` wired so employees join with the `amtech-hermes-<id>` DNS alias; the stale pre-fix orphan fleet (`CapAdd=[]`) GC'd (profile dirs preserved). Compose core (`manager`/`web`/`caddy`) built + up, **all `healthy`**, correct start-order, on the shared network with the `manager` alias; 3 employees on the same network. Proofs (real container ids): `deploy-smoke` **PASS 8/8** (manager/web health, caddy reachable, 3x compose health, `caddy validate`, **`docker-dns:employee-alias` — Caddy resolves the employee by Docker DNS**), `caddy-proof` **PASS**, `capacity` **PASS tier 5** (5 concurrent employees, 0 DNS failures; a small honest tier on a 4-CPU/8GB dev box, **not** the real 20-25 Pod Alpha number), `egress-policy` **dry_run** (default-deny `DOCKER-USER` rule design + resolved manager/employee IPs). Employee lifecycle `stop`/`gc`/`restart` proven. Three proof-script correctness fixes: `deploy-smoke` treats a reverse-proxy 308→HTTPS as reachable (`redirect: "manual"` — auto-HTTPS can't get certs on a host without public DNS); `capacity` guards the unprivileged `/proc/<pid>/smaps_rollup` read (EACCES → null, no longer aborts) and uses `alpine` (has `getent`) not `busybox` (doesn't) for the DNS probe. **`pending` real-VPS proof:** crash/reboot **auto-recovery** — `--restart=unless-stopped` is set on every employee (verified) and `restart: unless-stopped` on core services, but this sandbox daemon does not fire restart-on-kill even for a plain control container, so recovery is correctly configured but unproven here; egress `--apply` (needs root); a real capacity number (needs a 64GB node + root for PSS). See `memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md`.
- **Inbound/two-way surface review + production DNS/roles design (2026-07-11):** docs-only; no feature code, migrations, runtime proof, provider proof, DNS changes, or Cloudflare/Caddy operations. `docs/inbound-two-way-surface-map.md` maps the as-built inbound paths (web owner turn, owner inbound SMS, provider webhooks), including the SMS nuance that owner inbound SMS goes directly to `deliverOwnerTurnToRuntime` while `events/ingress.ts` is for provider events and `channel-router.ts` is outbound routing. `docs/production-networking-and-dns.md` recommends Cloudflare DNS-only records, static `*.agents.amtechai.com`, and Caddy wildcard DNS-01 with a scoped Cloudflare token; IPv6 remains optional/deferred for Pod Alpha. `docs/roles-and-delegated-permissions-design.md` defers account-member roles until after live/provider/VPS proof, reuses `account_memberships` rather than `platform_user_roles`, and designs requester != approver owner approval with per-turn Hermes authority injection as a build gate, not a live runtime claim.
- **Production networking/admin infra slice (2026-07-11):** `source-wired`; no live Cloudflare/DNS/TLS/provider/runtime gate upgraded. Safe Cloudflare desired-state tooling (`dns:cloudflare:plan` dry-run by default, `dns:cloudflare:apply` gated by `CLOUDFLARE_DNS_APPLY_CONFIRM`), plugin-built Caddy wildcard DNS-01 path (`infra/deploy/caddy.Dockerfile`, `infra/caddy/production.Caddyfile`), wildcard config/plugin proof (`ops:caddy-wildcard-proof`), production-environment proof aggregation (`prod-env:proof`), and read-only Admin Environment readiness over proof JSON are now in source. Proof tiers remain explicit: `static`, `local_mirror`, `limited_live_infra`, `provider_runtime_live`. Roles/delegation remain deferred.
- **Context-engineering CE-1 (2026-07-12):** `source-wired`; live Hermes hook/runtime proof still `pending`. The "business brain" is now implemented as an integrated index/resource map, not a facts stub. Profile generation requires normalized `profile_context` from the onboarding manifest (`lib/profile-context.ts`) and renders Hermes-native `memories/MEMORY.md` / `USER.md` plus `workspace/brain/business-brain.md` from generic slots (`lib/memory-seed.ts`). The contractor package declares slots/resource pointers in `distribution.yaml`; no launched-backcompat path is kept. `pre_llm_call` hook wiring calls Manager once per session via scoped MCP credential; Manager owns the once-per-session gate in `agent_context_primer_sessions` (`0029`) and returns a reference-shaped primer capped at ~2k estimated tokens with a 400k session target note (`lib/agent-context.ts`, `/manager/agent-context`). `get_business_brain` and `amtech://manager/business-brain` return an index/resource map; explicit fact values live behind `amtech://manager/business-facts`. Local proof: typecheck, 84 unit files / 518 tests, build, lint, integration skipped cleanly.
- **Context-engineering CE-2 + CE-3 + CE-1 loose ends (2026-07-12):** `source-wired`; migrations `0029`/`0030` **applied live** (schema/RLS/grants verified); live Hermes hook/compression/rotation behavior + live employee reprovision `pending`. **CE-1 loose ends:** `claimAgentContextPrimer` now distinguishes `already_primed` (23505 PK conflict) from `claim_failed` (unapplied gate/transient) so an employee can't silently never-prime; the primer gate column was renamed `session_key`→`transcript_session_id` (rotates), keyed off the transcript id not the stable memory key; `/manager/agent-context` drops the `X-Hermes-Session-Key` fallback and surfaces `claim`/`carryover` in proof. **CE-2:** `{{COMPRESSION_CONFIG}}` (Hermes-default safety net, rotation trips first) + `{{DELEGATION_CONFIG}}` (`delegate_task` in-turn context isolation) + tokenized `{{HOOKS}}` rendered by `profile-renderer.ts`; new `packages/shared/src/model-context.ts` is the ONLY place model metadata enters CE (context-window capability input, never a behavior branch); a deterministic Hermes **plugin** `packages/agent-template/plugins/amtech-hygiene` (`transform_tool_result`/`transform_terminal_output`, plugin-only per NousResearch PRs #12972/#12929) redacts secrets always but size-trims only pathological bulk (40k tool / 50k terminal, generous head/tail) so it never nerfs normal results; `deployPlugins` installs it into `$HERMES_HOME/plugins`; `routeForEventType` (`event-types.ts`) is a data-driven `deliver_only`/`wake_employee` policy table replacing the inline `classifyRoute`. **CE-3:** migration `0030_employee_sessions` (Manager-only, RLS on), `lib/session-rotation.ts` with pre-turn `rotateSessionIfNeeded` (rotate BEFORE the turn so it runs fresh + re-primes) and post-turn `recordSessionOccupancy` (tolerant `usage` parser: prompt/input tokens + Anthropic cache tokens), wired under the turn lock at `runtime.ts`/`wake.ts`/`turn-drain.ts`; rotation mints a fresh `transcript_session_id`, preserves `memory_session_key`, repoints `runtime_endpoints.api_session_id`, and sets `pending_carryover` so the next primer carries a handoff (`buildAgentContext` + `deriveNextAction`). Env kill-switch `AMTECH_SESSION_ROTATION_DISABLED`. Local proof: typecheck, 87 unit files / 543 tests, `plugins:test` 10/10, build, lint. Spec: `second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md`.
- **Context-engineering CE-4 + estimator materialization research (2026-07-12):** `source-wired` for CE-4; live direct-MCP connector proof still `pending`. Added `packages/shared/src/connector-registry.ts` as the declarative connector metadata/custody source. `capability-registry.ts` now routes connector-backed statuses by connector category/metadata instead of tool-name substring branches and projects direct read-only MCP connector nodes generically; `employee-stream.ts` uses the same custody metadata for Connected surface copy. `profile-renderer.ts` renders `direct_mcp_connectors` into `config.yaml` only when custody is read-only; write/money/customer-facing requests are dropped and remain Manager-mediated. `agent-context.ts` exposes a business-type/operator-mode primer policy seam; `session-rotation.ts` accepts an optional policy rotate ratio. Research doc `second-half-plan/estimator-product-limits-research.md` studies the conversational website estimator materialization: one generated employee, many visitor conversations, local website chat as the form, artifact-backed HTML/PDF output. Key finding: the reusable pieces exist, but visitor-session isolation and deterministic HTML-to-PDF are the two clearest missing primitives.

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
- The current inbound/two-way surface review is `docs/inbound-two-way-surface-map.md`; companion designs are
  `docs/production-networking-and-dns.md` and `docs/roles-and-delegated-permissions-design.md`.

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
| `apps/web/app/api/employee/[employeeId]/approval/resolve/route.ts` | Resolves Manager approval records from web. Manager's `resolve_approval` route now wakes the employee after owner approval/denial, matching signed SMS approval behavior. |
| `apps/web/app/admin/page.tsx`, `apps/web/app/admin/AdminClient.tsx` | Internal Phase 5 operator console: dashboard, accounts, provisioning, repairs, provider status, billing scaffold, readiness, materialization inspector, and audited employee support actions. |
| `apps/web/app/api/admin/[...path]/route.ts` | Browser-to-Manager admin proxy. Requires `AMTECH_ADMIN_BROWSER_TOKEN` in production before attaching Manager internal auth, platform-user id, and support reason for `/manager/admin/*`; Manager still enforces the configured platform operator/role. |

### Manager app - backend control plane

| Path | Feature connection |
|---|---|
| `apps/manager/src/server.ts` | Hono server entrypoint. Registers health, Manager tools (via `runManagerTool`), the `/manager/mcp` MCP server endpoint, scheduler, claim consume, owner message routing, artifact/resource routes, webhooks, orchestrator, and provisioner. |
| `apps/manager/src/orchestrator.ts` | Front-door onboarding orchestrator routes. Uses model adapter and manifest contract. |
| `apps/manager/src/lib/orchestrator-model.ts` | OpenAI-compatible Chat Completions adapter with structured output fallback. |
| `apps/manager/src/provisioner.ts` | Production-shaped `POST /provision` and profile/package provisioning flow. |
| `apps/manager/src/lib/profile-renderer.ts` | Renders profile package params into Hermes profile files, including CE-1 native memory and context-slot templates. |
| `apps/manager/src/lib/profile-context.ts` | CE-1 onboarding-manifest normalizer: package-aware mapping into generic profile context slots. |
| `apps/manager/src/lib/memory-seed.ts` | CE-1 Hermes memory renderer for capped `MEMORY.md` / `USER.md` and slot markdown. |
| `apps/manager/src/lib/agent-context.ts` | CE-1 once-per-session live-state primer builder: references/counts/headlines only, capped at ~2k estimated tokens with a 400k session target note. |
| `apps/manager/src/lib/business-brain.ts` | CE-1 business-brain index/resource-map builder plus explicit business-facts resource reader. |
| `apps/manager/src/lib/session-rotation.ts` | CE-3 rotation: pre-turn `rotateSessionIfNeeded` (rotate before a turn so it runs fresh + re-primes) + post-turn `recordSessionOccupancy` (tolerant `usage` prompt-token parser incl. Anthropic cache tokens). Runs under the turn lock; fail-open. Kill-switch `AMTECH_SESSION_ROTATION_DISABLED`. |
| `apps/manager/src/lib/runtime-backend.ts` | Runtime backend policy; Docker default, `local` dev/demo only. `isLocalRuntimeBackendAllowed()` is the real provisioning-time admission check (default-deny, `ALLOW_LOCAL_RUNTIME_BACKEND` opt-in, hard-vetoed under `NODE_ENV=production`), consumed by `provisioning.stub.ts`. |
| `apps/manager/src/lib/runtime.ts` | Compatibility wrapper for queued owner turns; legacy invented endpoint paths fail closed. |
| `apps/manager/src/lib/hermes-client.ts` | Authenticated Hermes API Server client for health, capabilities, toolset introspection (`getToolsets` → `/v1/toolsets`), canonical session creation, and Sessions chat turns. |
| `apps/manager/src/lib/run-tool.ts` | Single Manager-tool dispatch path shared by the HTTP route and the MCP server: validates input against the zod schema, blocks scheduler-only tools, runs the existing registry handler (gates/audit reused). |
| `apps/manager/src/lib/mcp-server.ts` | Manager control plane exposed as a native MCP server (`@modelcontextprotocol/sdk`, web-standard streamable-http, stateless). `tools/list` = tool JSON Schemas; `tools/call` → `runManagerTool`; read-only resources expose business-brain index, explicit business facts, connector, artifact, approval, work queue, runtime health, and capability registry state under bound identity. |
| `apps/manager/src/lib/mcp-auth.ts` | Per-employee scoped MCP credential mint/verify/revoke helpers. `/manager/mcp` uses this to derive account/employee identity from a hashed `mcp_...` credential instead of the global Manager internal bearer or spoofable identity headers. |
| `apps/manager/src/lib/capability-registry.ts` | Phase 4 owner-language capability graph builder. Merges Manager tool schemas/MCP callable surface, connector status, runtime health, and policy into `CapabilityGraphNode`s and backfills legacy `abilities`. |
| `apps/manager/src/lib/materialization.ts` | Phase 4 generic materialization projection from the existing employee snapshot rows into `SurfaceEnvelope`, `WorkResource`, and `WorkAction` lists with proof/safety/render metadata. |
| `apps/manager/src/lib/employee-stream.ts` | Owner Work Surface read model and SSE delta cursor. Snapshot and delta work-event queries are account/employee-scoped at the database before limits, then descriptor-filtered as defense in depth. |
| `apps/manager/src/lib/admin.ts` | Phase 5 Manager-only admin/ops read and action layer: platform-role enforcement, support-access audit, redacted dashboard/account/employee views, readiness reports, read-only environment proof status, and scoped support actions including employee lifecycle and MCP credential rotation/revocation. |
| `apps/manager/src/lib/proof-reader.ts` | Redacted proof JSON reader for Admin Environment readiness. Loads latest operator proofs from `AMTECH_PROOF_DIR` / `infra/proofs` without running infrastructure actions. |
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
| `apps/manager/src/tools/estimate.stub.ts` | Business-brain index/resource tool, durable business-fact writes, estimate artifact creation, PDF registration/storage/linking, approvals. |
| `apps/manager/src/tools/gmail.stub.ts` | Gmail OAuth, token custody, connector test, draft/send, watch/history/PubSub handling, watch renewal. |
| `apps/manager/src/tools/stripe.stub.ts` | Stripe Connect test-mode account, onboarding, deposit invoice, invoice send, webhook handling. |
| `apps/manager/src/tools/qbo.stub.ts` | QuickBooks Online tool family: connector lifecycle, four approval-gated write previews + `commit_quickbooks_write` (the sole write path, with the pending-write↔approval binding + compare-and-swap claim + payload-hash check), generic `query_quickbooks`, and four reports. Phase B write/update tools registered but return `not_supported_yet`. |
| `apps/manager/src/lib/qbo-tokens.ts` | Sole owner of QBO token refresh: `intuit-oauth` for the actual refresh, sealed by reference (`secrets.ts`), guarded by an atomic per-connector `token_refresh_lease_until` compare-and-swap so concurrent requests never race the rotating refresh token; losing contenders poll through the lease window for the persisted fresh token. |
| `apps/manager/src/lib/qbo-client.ts` | The only QBO REST boundary. Constructs a fresh `@apigrate/quickbooks` `QboConnector` per call (Accounting-API methods only — never its OAuth) from a fresh access token; narrow typed surface per operation + a documented `qboRawFetch` escape hatch. `apigrate-quickbooks.d.ts` supplies the ambient types (@apigrate ships none). |
| `apps/manager/src/lib/qbo-lookup.ts` | Bounded TTL-cached per-connector name→id resolution (Customer/Vendor/Account/Item/Class/Department). Exact match resolves only when the page is not truncated; ambiguous/zero returns `needs_disambiguation`/`not_found`, and full/truncated 1000-row pages fail closed as `lookup_truncated` — never a best-guess pick. |
| `apps/manager/src/lib/qbo-query.ts` | Generic QBO SQL-like query builder with a per-entity filterable-fields whitelist + single-quote rejection (injection-safety boundary), and report flattening from nested `Rows.Row[]` to a stable owner-summarizable shape. |
| `apps/manager/src/lib/qbo-gotchas.ts` | QBO API limitations as validated, unit-tested logic (PaymentType, single-department expense, sparse-update required fields, expense-ref preservation, SyncToken staleness, JE balance) — not documentation. |
| `apps/manager/src/webhooks/quickbooks.ts` | QBO OAuth callback (captures `realmId`) + CloudEvents-native change webhook: HMAC verify, CloudEvents/legacy parse, per-realm fan-out, dedupe via `inbound_qbo_events`, deliver through the shared event mesh. |
| `apps/manager/src/events/adapters/quickbooks.ts` | External-door `EventSourceAdapter` for QBO change events: matches connector by `realm_id`, normalizes to an owner-safe fact, treats QBO record text as untrusted data (lethal-trifecta). |
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
| `packages/shared/src/admin.ts` | Phase 5 shared admin contracts: platform roles, account/employee dashboard summaries, readiness reports, support actions, and support-action result shapes. |
| `packages/shared/src/approval-policy.ts` | Single source of truth for approval `action_key` gating: `SEND_GATE_ACTION_KEY_GROUPS` (send-gated families) **and** `QBO_WRITE_ACTION_KEY_GROUPS` (QuickBooks writes — its own peer array, not a send) both spread into `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`, so a new gated key structurally cannot miss the owner-authenticated-resolution requirement. `requiresOwnerAuthenticatedResolution()` is consumed by `estimate.stub.ts`'s `resolve_approval`; the key constants are consumed by `gmail.stub.ts`/`stripe.stub.ts`'s send-gates, `qbo.stub.ts`'s write gates, and `employee-events.ts`'s `approvalActionKey()` fallback. |
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
| `packages/db/migrations/0025_phase5_admin_ops.sql` | Phase 5 admin/ops schema: additive account trial/billing/lifecycle fields, employee lifecycle/reprovision fields, and Manager-only `platform_users`, `platform_user_roles`, `support_access_sessions`, and `admin_action_events` tables with RLS enabled and browser grants revoked. |
| `packages/db/migrations/0026_quickbooks_connector.sql` | QuickBooks Online connector: additive `connector_accounts` columns (`environment`, `realm_id`, `external_label`, `token_refresh_lease_until`) + Manager-only `quickbooks_pending_writes` (the write↔approval binding source of truth) and `inbound_qbo_events` (webhook/CDC dedupe), both RLS-on with browser grants revoked. |
| `packages/db/migrations/0029_ce1_agent_context_primer_sessions.sql` | CE-1 Manager-owned once-per-session primer gate, PK `(employee_id, transcript_session_id)` — keyed on the Hermes **transcript** session id (rotates in CE-3), not the stable memory key; hook files are transport only, not the authority. Applied live 2026-07-12. |
| `packages/db/migrations/0030_employee_sessions.sql` | CE-3 session rotation: Manager-only `employee_sessions` (RLS on, browser grants revoked, partial-unique one-active-per-employee) tracking `transcript_session_id`/`memory_session_key`/`context_tokens`/`status`/`rotated_from`/`pending_carryover`. Applied live 2026-07-12. |

### Hermes profile package

| Path | Feature connection |
|---|---|
| `packages/agent-template/README.md` | Render contract and package layout. |
| `packages/agent-template/SOUL.md` | Constant employee persona and SMS voice. |
| `packages/agent-template/config.yaml` | Hermes profile config; includes rendered runtime backend token, `platform_toolsets.api_server`, `mcp_servers.amtech_manager`, the tokenized `{{HOOKS}}` block (CE-1 `pre_llm_call` primer), and the CE-2 `{{COMPRESSION_CONFIG}}` (safety net) + `{{DELEGATION_CONFIG}}` (`delegate_task`) blocks. |
| `packages/agent-template/plugins/amtech-hygiene/` | CE-2 deterministic Hermes plugin (`plugin.yaml` + `__init__.py` `register(ctx)`) registering `transform_tool_result`/`transform_terminal_output`: always-on secret redaction + last-resort size-trim of pathological bulk only (never normal results). Stdlib self-test `test_hygiene.py` (`npm run plugins:test`). Deployed to `$HERMES_HOME/plugins` by `profile-renderer.ts` `deployPlugins`. |
| `packages/shared/src/model-context.ts` | CE context-window map — the ONLY place model metadata enters CE (`contextWindowFor`/`rotateAtTokens`, capability input, never a behavior branch; model-agnostic across Opus/Sonnet/GLM/GPT). |
| `packages/agent-template/distribution.yaml` | Package metadata/distribution shape plus package-declared CE-1 context slots, memory limits, and resource pointers. |
| `packages/agent-template/.env.tpl` | Per-profile env template; secrets by reference, scoped hook credential, and hook auto-accept. |
| `packages/agent-template/profile.params.example.yaml` | Example render params including required `profile_context`. |
| `packages/agent-template/hooks/pre-session-context.mjs` | CE-1 fail-open hook transport that asks Manager for the once-per-session primer. |
| `packages/agent-template/memories/MEMORY.md`, `packages/agent-template/memories/USER.md` | Native Hermes memory templates rendered from normalized profile context. |
| `packages/agent-template/workspace/AGENTS.md` | Runtime policy loaded into employee workspace, including confirmation gates. |
| `packages/agent-template/workspace/manager-tools.md` | Tool-call contract the employee uses to talk to Manager. |
| `packages/agent-template/workspace/brain/business-brain.md` | CE-1 rendered navigation layer for the integrated business brain: context slots plus Manager resource pointers. |
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
| `infra/scripts/acceptance/run10-quickbooks.mjs` | QuickBooks acceptance verifier: live-DB proof of a connected connector + a committed write carrying a real `qbo_entity_id` + any recorded webhook event. `not-run` without QBO/Supabase env. |
| `infra/scripts/scheduler-tick.mjs` | Dev/manual scheduler fallback through Manager. |
| `infra/scripts/hermes-jobs-runner.mjs` | Production-oriented Hermes Jobs scheduler entrypoint. |
| `infra/scripts/cloudflare-dns.mjs` | Cloudflare DNS desired-state planner/apply gate for apex, `www`, `api`, `agent`, and static `*.agents`; emits redacted proof JSON. |
| `infra/scripts/caddy-wildcard-proof.mjs` | Validates the production Caddy wildcard DNS-01 config and confirms the plugin-built image includes the Cloudflare DNS module; does not issue certs. |
| `infra/scripts/prod-env-proof.mjs` | Aggregates latest `infra/proofs/*.json` into a production-environment proof with explicit proof tier boundaries. |
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
| `docs/quickbooks-connector-architecture.md` | QuickBooks Online connector architecture (Phase A now `source-wired`): native Manager tool family (`qbo.stub.ts`) mirroring Gmail/Stripe rather than a bolted-on MCP subprocess; entity-resolution-with-disambiguation layer; approval-gate extension replacing both reference repos' model-flippable draft/confirm pattern; CloudEvents-native event mesh; capability-registry/materialization wiring; MCP-security posture mapping; explicitly-future two-agent Local Companion design for QuickBooks Desktop/non-API workflows. |
| `docs/quickbooks-connector-implementation-plan.md` | Decision-complete Phase A build sequence for the QuickBooks connector, hardened by a heavy critique pass (2026-07-10): a settled Client Library Decision (`intuit-oauth` for OAuth, `@apigrate/quickbooks` for Accounting-API calls only, with a narrow raw-fetch escape hatch — not `node-quickbooks`, not hand-rolled fetch), a `quickbooks_pending_writes` table with an explicit approval-id-must-match binding rule (closes a confused-deputy gap), a `.strict()` exception to the codebase's default passthrough tool-schema convention for `commit_quickbooks_write`, `QBO_WRITE_ACTION_KEY_GROUPS` as its own peer array (not folded into the send-specific `SEND_GATE_ACTION_KEY_GROUPS`), and an explicit build order (prove `create_expense` completely before cloning to Bill/Invoice/Payment). |
| `docs/quickbooks-api-gotchas.md` | Carried-forward QuickBooks Online API limitations ledger (SyncToken concurrency, sparse-update required fields, single-department-per-expense, a live upstream bug stripping department/vendor on expense line edits, per-entity filterable-fields whitelist, CloudEvents webhook migration deadline) to encode as validated business logic and unit tests, not documentation alone. |
| `docs/quickbooks-connector-implementation-handoff-prompt.md` | Copy-ready session-handoff prompt to implement the QuickBooks connector (Phase A0-A6 + the fastest-path vertical slice) end to end, explicitly scoped apart from the current Phase 4/5 loose ends (named so a fresh agent doesn't drift into them). |
| `second-half-plan/README.md` | Active second-half forward plan for moving from source-wired prototype to free trials and paid pilots. |
| `second-half-plan/phase-00-current-state-handoff.md` | Large current-state handoff: code, dirty tree, architecture, UI/SMS gaps, deployment/factory state, and readiness. |
| `second-half-plan/phase-01-preserve-and-close-live-gate.md` | Immediate next phase: preserve interrupted tool-enabled employee work and close local live gate. |
| `second-half-plan/phase-01-handoff-prompt.md` | Copy-ready implementation prompt for a fresh agent to complete Phase 1. |
| `second-half-plan/phase-02-owner-work-surface-redesign.md` | Planned web employee desk redesign inspired by Hermes Desktop/WebUI/Workspace. |
| `second-half-plan/phase-03-sms-ambient-inbox-and-link-previews.md` | Planned SMS ambient inbox and signed-preview/action surface. |
| `second-half-plan/phase-04-tool-agnostic-capability-and-renderer-layer.md` | Planned capability/rendering/materialization layer: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, generic renderers. |
| `second-half-plan/phase-05-trial-operations-admin-billing.md` | Source-wired admin/ops/trial-readiness layer for trials and paid pilots; billing remains scaffolded/default-allow and live operator proof is pending. |
| `second-half-plan/phase-06-free-trial-and-paid-pilot-readiness.md` | Planned launch gate across proof, UX, SMS, admin, billing, and support. |
| `second-half-plan/surface-research-hermes-gui-and-materialization.md` | Deep Hermes Workspace/WebUI/Desktop research translated into AMTECH surfaces and materialization strategy. |
| `second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md` | Re-sequencing decision: fix production deployability + core tool-loop before admin/billing (parked); docker-compose core + per-account employee containers; P0/P1/P2 ordering; admin/billing parked; live gate + launch after. |
| `second-half-plan/production-networking-admin-phase6-implementation-handoff-prompt.md` | Copy-ready, research-heavy implementation prompt for the next production-infra run: Cloudflare DNS desired state, Caddy wildcard DNS-01, local production mirror, limited live-infra proof tiers, admin readiness updates, and Phase 6 production-environment gates. |
| `docs/production-deploy-readiness-review-2026-07-11.md` | Evidence-backed production deploy readiness review: 10 gaps (no supervision, undefined employee launch, no caddy reload, no lifecycle/reboot recovery, no CI/deploy, no backup/DR, no observability, open egress, no graceful drain, plaintext host secrets), each with severity + "done" criteria, for the one-VPS factory. |
| `docs/pod-alpha-runtime-runbook.md` | Operator runbook for the Pod Alpha proof layer: Cloudflare DNS dry-run/apply-gated proof, local tool-loop proof, Compose smoke, Caddy rollback + wildcard DNS-01 proof, scoped-MCP reprovision, capacity tiers, backup/restore, red-health, egress policy, production-environment proof aggregation, and Realness Rule status boundaries. |
| `docs/inbound-two-way-surface-map.md` | Docs-only Part A review of the as-built inbound/two-way surface: web owner turns, owner inbound SMS, provider webhooks, turn queue serialization, stuck-turn recovery, idempotency/dedupe, presence routing, and load fragilities. |
| `docs/production-networking-and-dns.md` | Part B design + source-wired path for Pod Alpha public DNS/TLS: Cloudflare DNS-only records, static `*.agents.amtechai.com`, Caddy wildcard DNS-01, IPv4-first with optional/deferred IPv6, webhook ingress vs egress default-deny, firewall posture, and the new DNS/Caddy/proof/admin commands. |
| `docs/roles-and-delegated-permissions-design.md` | Docs-only Part C design for deferred account-member roles/delegated permissions: reuse `account_memberships`, keep `platform_user_roles` for AMTECH staff only, requester != approver owner approvals, per-user phone/web identity, audit binding, and per-turn Hermes authority context. |
| `ui-handoff/README.md` | Entry point for a UI-focused partner: read order, current phase position, safe work areas, and product mental model. |
| `ui-handoff/data-catalog.md` | Full inventory of every data shape/route available to the UI (`ResourcePayload`, `WorkResource`/`WorkAction`, `SurfaceEnvelope`/`CapabilityGraphNode`, admin contracts), across every surface (web desk, signed mobile review, admin console, MCP-UI generative cards), plus the concrete artifact-link/preview-image rendering plumbing. |
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
| 9-10 Admin | source-wired, live operator proof pending | `apps/manager/src/lib/admin.ts`, `/manager/admin/*`, `apps/web/app/admin/*`, migration `0025`, `docs/admin-*.md`. |
| 11 Billing scaffold | source-wired scaffold, no paywall | `packages/shared/src/admin.ts`, migration `0025` account billing fields, admin dashboard billing view; keep separate from owner Stripe Connect payments. |
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

Expected local truth as of the current records: typecheck/build/lint pass, 76 unit files / 487 tests pass,
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
