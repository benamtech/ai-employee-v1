# Next session: map the inbound / two-way surface, production DNS/TLS, and the roles model

Date: 2026-07-11 ~21:00 EDT
Status: copy-ready next-session prompt. Scope = **review + research + design + plan only** (no build this
pass). Prerequisite context: the outbound orchestration substrate is proven on a real Docker host (see
`memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md`).

## Why this exists (read first)

We proved the **outbound** production infra: the docker-compose core, per-employee Hermes containers, the
shared `amtech_runtime` network, Docker-DNS, and Caddy routing OUT to each employee. The logical next step
before resuming feature work is the **other direction — the two-way surface**: a real person (the owner, or
a future permissioned user) or a provider webhook comes IN through a surface (web / SMS / provider callback)
-> Caddy -> Manager -> a Hermes turn -> Manager tools -> back OUT to the surfaces. Plus the two things that
make that real in production: **managed public DNS + wildcard/on-demand TLS + IPv4/IPv6**, and a
**roles / delegated-permission model** (e.g. a secretary who can send invoices and mark QBO deposits, but
whose riskier actions require the owner's SMS approval before the AI employee proceeds).

Most of the inbound spine is already **source-wired** — your job is to MAP and stress-test what exists, then
DESIGN the net-new pieces (production DNS/TLS, roles) and sequence them. Do not rebuild the inbound spine.

Deliverables this pass: two design docs + a sequenced plan (details in "Definition of done"). No feature code.

## Read order (orient before analyzing)

1. `../identity.md` — required operating identity.
2. `CODEGRAPH.md` §3 — authoritative current status; §5 (runtime/Hermes boundary), §6 (source map).
3. `memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md` — the proven outbound infra.
4. `../wiki/MVP/agent-inbox-and-channel-architecture.md` and `../wiki/MVP/hermes-run-session-semantics-research.md`
   and `memory/2026-07-03-2021-hermes-capabilities-runs-alignment.md` — the inbox/turn-atomic/channel model.
5. `second-half-plan/phase-01`..`phase-06` — the forward plan the sequencing must fit.
6. Then the inbound code (Part A). Re-ground in Hermes' CURRENT version behavior (Sessions/Runs/Jobs/approvals/
   toolsets) — do not assume; verify against the docs above + Hermes source/docs.

## Part A — Map the inbound path AS BUILT (review, cite files; do not rebuild)

Trace and document, end to end, each inbound turn type. The spine already exists — assess correctness and
where it is fragile under real concurrency/load, not whether to build it.

- **Web owner turn**: `apps/web/app/api/employee/[employeeId]/message/route.ts` -> Manager owner-message route
  in `apps/manager/src/server.ts` -> `lib/owner-session.ts` (auth) -> `lib/runtime.ts` `deliverOwnerTurnToRuntime`
  -> `lib/turn-queue.ts` (claim/lease, compare-and-swap) -> `lib/wake.ts` / `lib/hermes-client.ts` (Hermes
  Sessions turn, turn-atomic) -> employee calls Manager tools over MCP (`lib/mcp-server.ts`, scoped cred) ->
  work events -> `lib/employee-stream.ts` SSE + poll back to the web desk.
- **SMS inbound turn**: `apps/manager/src/webhooks/twilio.ts` (X-Twilio-Signature verify) -> `events/ingress.ts`
  (two-door) -> `lib/employee-events.ts` (dedupe/triage/atomic wake claim/descriptor bind) ->
  `lib/channel-router.ts` (presence: active-web-wins / ambient SMS / silent record) -> owner turn via the same
  turn-queue path; outbound via `lib/sms-sender.ts`. Signed mobile previews: `lib/preview-links.ts` +
  `lib/preview-render.ts` + `apps/web/app/agent/[employeeId]/review/`, action via
  `apps/web/app/api/employee/[employeeId]/preview/action/route.ts` -> `resolve_approval` -> wake.
- **Provider webhook turn**: `webhooks/{gmail,stripe,quickbooks}.ts` (signature / Pub-Sub OIDC / HMAC verify)
  -> `events/ingress.ts` + `events/adapters/*` (the **two-door invariant**: external/untrusted via
  `ingestEvent`; internal Manager-authored via `deliverEmployeeEvent`) -> deliver-only vs wake_employee.

Explicitly assess: turn-atomicity + the serialized inbox under bursts; the stuck-turn reaper; presence routing
correctness; idempotency/dedupe on at-least-once webhooks; and how a long Hermes turn interacts with a second
inbound message (queue vs interrupt). Note anything that only holds under single-tenant/low-load today.

## Part B — Production networking / DNS / TLS / IPv4-v6 (research + design)

Open research gap: the Caddyfile has no wildcard / on-demand TLS, and nothing in the repo covers public DNS
zones, `*.amtechai.com`, AAAA/IPv6, or per-client subdomain provisioning. Research (web + Hermes/Caddy docs)
and design -> `docs/production-networking-and-dns.md`:

- **Public DNS zone** for `amtechai.com`: apex + `www` + `api` + `agent` + a **wildcard `*.amtechai.com`** so
  each employee subdomain resolves with no per-client DNS write. A vs AAAA records; dual-stack; TTLs; which
  managed DNS provider (Cloudflare / Route53 / etc.) and whether provisioning is wildcard-static or API-driven.
- **Per-subdomain TLS**: compare Caddy **on-demand TLS** (HTTP-01 per subdomain + an `ask` endpoint so only
  known tenants can trigger issuance) vs a **wildcard cert via DNS-01** (needs DNS-provider API creds, one cert
  for all subdomains). Cover Let's Encrypt rate limits, renewal, and failure modes. Recommend one for Pod Alpha.
- **IPv4 vs IPv6**: single public IPv4 (+ optional IPv6); Caddy/Docker dual-stack bind; AAAA records; whether
  employee containers need outbound IPv6; reverse DNS.
- **Webhook ingress**: Twilio / Gmail-Pub/Sub / Stripe / Intuit all POST to `api.amtechai.com` — must be
  publicly reachable with valid TLS and the correct callback URL per env. Show how this coexists with **egress
  default-deny** (inbound is unaffected; the Manager's OUTBOUND provider calls must be on the egress allowlist).
- **VPS firewall posture**: only 80/443 public; 8080/3000 bound to loopback; the `docker.sock` blast-radius note.

## Part C — Roles & delegated permissions (design only; the "secretary" example)

Today the model is **single-owner**: `packages/agent-template/.env.tpl` `SMS_ALLOWED_USERS={{OWNER_PHONE_E164}}`;
owner web session; `packages/shared/src/approval-policy.ts` (`OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`) gates
money/send; `resolve_approval` requires owner auth. Multi-user roles are **net-new** on this base. (Do NOT
conflate with platform-operator roles from migration `0025` — that is the AMTECH-staff admin audience.)

Design -> `docs/roles-and-delegated-permissions-design.md`:

- **Model**: an account gains `account_members` (multiple users) each with a **role** (owner + delegated roles
  e.g. secretary) and per-role **capability scopes**. A delegated user acts directly within scope; a risky or
  out-of-scope action raises an **owner-SMS approval** before the AI employee proceeds — the requester (e.g.
  secretary) is NOT the approver (owner). Worked example: secretary may `send_invoice` / `mark deposit in QBO`
  directly, but `online ordering` (or any spend/new-vendor action) pauses for owner SMS approval.
- **Reuse, don't reinvent**: the existing approval gate + `approval-policy.ts` (add per-role gating tiers) +
  `lib/channel-router.ts` (route the approval to the OWNER's number even when the requester is the secretary)
  + `resolve_approval`, extended with a requester != approver binding and `audit_log` (who requested, who
  approved). Multi-number `SMS_ALLOWED_USERS` (per-number identity). Owner-session/identity gains a role claim.
- **Hermes angle (research)**: how a Hermes turn carries per-user identity/authority so the employee knows "who
  is talking and what they may authorize" — injected as per-turn context/metadata, not baked into the profile.
  Verify against current Hermes Sessions semantics.
- **Seams to name**: `approval-policy.ts`, owner-session/`identity.stub.ts`, `SMS_ALLOWED_USERS`,
  `employee-events`/`wake` (carry requester+approver), `audit_log`, and a new members/roles schema (a migration,
  RLS Manager-only, browser grants revoked — follow the `0025` posture). Deferred to post-live-proof build.

## Part D — Sequence (make the order explicit)

1. **This review/design** (now, no creds): Parts A-C.
2. **Finish remaining MVP surface features + live provider acceptance** (on creds): close the employee LLM tool
   loop on a real provider-backed Hermes model (the local model bridge is dead), run the Phase 1 harness.
3. **Finish admin + real billing** (Phase 5 -> real collection/paywall state, not just scaffold).
4. **Limited real-VPS production tests**: 5-100 employees per pod, one employee per business, NOT blitzscale;
   prove reboot recovery, backups/DR, observability, egress `--apply`, and a real capacity number there.
5. **THEN build roles/delegation** on the proven base.

Roles = design now, build later. Keep the scalability target modest and honest (pods of ~20-25 / 64GB node).

## Constraints & definition of done

- Realness rules (`source-wired` / `provider-accepted` / `runtime-accepted` / `planned` / `pending`); never
  claim a live test that did not run. **No emojis anywhere.** One-phase-per-plan discipline for any follow-on
  implementation plan. Every claim traced to a file path or a cited source (web research linked).
- This pass ships **design/review docs + a phased plan, not feature code**:
  1. `docs/production-networking-and-dns.md` (Part B) with a recommended DNS+TLS posture for Pod Alpha.
  2. `docs/roles-and-delegated-permissions-design.md` (Part C) with the schema/seam changes, explicitly deferred.
  3. A written map of the inbound path (Part A) — as a doc or folded into CODEGRAPH/second-half-plan — noting
     fragilities under real load.
  4. The Part D sequence, reconciled with `second-half-plan/`.
- Update `CODEGRAPH.md` §3 and write a dated `memory/` handoff when done.

Work from the goal: a clear, buildable picture of how a real person or provider reaches the employee and gets
safe work back in production — including who is allowed to authorize what — so that afterward we finish the
MVP, add live providers, complete admin/billing, and run real limited-capacity VPS tests with confidence.
