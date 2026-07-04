# CLAUDE.md — AI Employee MVP build home

> Tool-agnostic mirror: **[`AGENTS.md`](AGENTS.md)** holds the same content. Keep the two in sync.

This is **`mvp-build/`**, the build home for the AMTECH AI Employee MVP. The owner only ever talks to
one employee; the Manager is the invisible backend control plane.

## Read order (a fresh agent orients from these)

1. [`../identity.md`](../identity.md) — operating self-image (required, every session).
2. [`../CODEGRAPH.md`](../CODEGRAPH.md) — workspace map + canonical facts.
3. [`../wiki/MVP/build-plan-current/`](../wiki/MVP/build-plan-current/) — the reconciled plan; the
   **forward roadmap is [`../wiki/MVP/build-plan-current/phases/`](../wiki/MVP/build-plan-current/phases/)**
   (Phase 0 baseline + Phases 1–13, dependency-ordered modular phases).
4. [`../wiki/MVP/implementation-records/`](../wiki/MVP/implementation-records/) — factual code-state ledger.
5. [`memory/`](memory/) — in-repo durable dev handoffs + the memory writing protocol (read the newest).
6. The relevant source under `apps/`, `packages/`, `infra/` before changing code.

`../wiki/MVP/old-build-plan/` is the preserved original mechanics packet — do **not** rewrite it.

## Current status

- **Phase 0 baseline loop** (signup/claim → estimate PDF → approved Gmail send → real reply → Stripe
  test-mode deposit → reminder): `source-wired`.
- **Phase 1 acceptance harness** (preflight + 8 run-verifiers + report + ops scripts + forged-request
  tests): `source-wired`, locally verified; the **live gate** is `pending` (needs `.env` + host; no
  provider proof captured yet).
- **Phase 2 runtime/scheduler productionization:** `source-wired` (Docker-default backend policy,
  Manager scheduler runner, `hermes_job_runs` proof writes, `runtime_health_checks` snapshots);
  live `runtime-accepted` gate is still `pending` real Docker/Hermes Jobs proof.
- **Phase 3 / 3A / 4:** `source-wired` locally, **TDD-hardened (2026-07-03)**. Real Hermes Sessions
  client, DB-backed turn queue, generic ingress, channel router, and Gmail reply wake descriptors are wired
  and now have direct deterministic unit coverage + env-gated Postgres integration proof (turn serialization,
  new-table RLS). A `drain_employee_turns` scheduler lane handles straggler owner turns and persists routed
  replies. Live runtime/provider proof remains `pending`.
- **Phase 6 metering foundation:** `source-wired`. Migration `0013` (six Manager-only ledgers +
  additive `run_id` columns), migration `0014` (turn-claim RPC `run_id` propagation), `lib/metering.ts`
  best-effort helpers, and `run_id` threaded through ingress → deliver → wake → turn-queue → router →
  owner-turn.
- **Phases 5, 7–13:** `planned`. See `phases/README.md` for the dependency graph.

Local truth: typecheck/build/lint pass; **38 unit files / 216 tests** pass; integration skips clean
(9 env-gated checks without live Supabase creds).

## Layout

```
apps/web/        Next.js — front door, owner Work Surface, signed artifact route
apps/manager/    Node/TS control plane — tool registry, security libs, webhooks, server, orchestrator, provisioner
packages/shared/ typed contracts (tool-contracts, work-events, routes, ids, profile-package, ...)
packages/db/     migrations 0001–0008 + runner + service/anon clients
packages/agent-template/  Hermes employee template (agent-as-files)
infra/           caddy/, hermes/ (RUNBOOK), scripts/ (ops + acceptance/ harness)
tests/           unit/ (mocks ok) · integration/ (real creds, env-gated) · golden-path/ (manual runbooks)
docs/            production admin + metering architecture/implementation plans
memory/          in-repo durable dev handoffs + writing protocol
```

## How to work

**Baseline checks — run before and after changes:**
```
npm run typecheck && npm run test:unit && npm run build && npm run lint
npm run test:integration   # env-gated; skips cleanly without live Supabase creds
```
Current local truth: typecheck/build/lint pass; **38 unit files / 216 tests** pass; integration skips clean
(9 env-gated checks without live Supabase creds).

**Acceptance (Phase 1):**
```
npm run acceptance:preflight   # runnable/blocked matrix per run (no secrets printed)
npm run acceptance:report      # runs all 8 verifiers; writes infra/acceptance/reports/ (gitignored)
npm run ops:number-pool | ops:healthcheck | ops:repair
npm run scheduler:tick         # dev/manual fallback; writes scheduler_tick job-run rows
npm run scheduler:hermes-jobs  # production-oriented Hermes Jobs entrypoint
```

## Non-negotiables (Realness Rules + security)

- **No faked proof.** A capability is accepted only with real provider/runtime proof ids (Twilio SID,
  Gmail/Stripe ids, Pub/Sub message id, Supabase storage/migration evidence, Hermes job proof).
  Manually injected provider results, mocks, or stubbed successes are **never** acceptance. Records
  must never claim a live external test that didn't run. Mocks are allowed only in `tests/unit/`.
- **Acceptance vocabulary:** `source-wired` / `provider-accepted` / `runtime-accepted` / `planned` /
  `pending`. Don't upgrade a status without the proof.
- **Secrets by reference only.** No raw tokens, signatures, email/webhook bodies, or secret values in
  logs, `audit_log.details`, admin payloads, or reports. Don't pass provider tokens to models/browser.
- **Security boundaries are real:** Twilio `X-Twilio-Signature`, Stripe `Stripe-Signature` (raw body),
  Pub/Sub OIDC JWT, owner web session, signed artifact tokens, Manager tool auth. RLS protects the
  owner/anon path; the service-role client (Manager only) is the control-plane authority — never
  authorize off `user_metadata`.
- **Approval gates** before money/customer-facing actions. Provider test mode is allowed for Stripe.
- **No new browser-readable Supabase table/view without reviewing Data API exposure + RLS + grants.**

## Memory protocol (standing requirement)

Maintain in-repo durable memory in [`memory/`](memory/) per [`memory/MEMORY.md`](memory/MEMORY.md).
Write/update a dated handoff: **(1)** mid-session after substantial multi-feature or architectural
work, **(2)** after a full phase implementation, **(3)** after an architectural decision/plan change.
Keep the `memory/MEMORY.md` index current. Use `wiki/MVP/implementation-records/` for factual
code-state; `memory/` for the agentic-dev narrative + decisions + pointers.

## Git

`mvp-build` is a **local-only** git repo (branch `main`, no remotes). Commit only when asked; never
push (there is no remote). If asked to commit from the default branch for feature work, prefer a
branch first. End commit messages with the Co-Authored-By trailer.
