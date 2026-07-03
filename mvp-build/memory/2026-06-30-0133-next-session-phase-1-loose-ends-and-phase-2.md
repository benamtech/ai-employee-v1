# Handoff — next session: tie up Phase 1, then build Phase 2 (production)

Date: 2026-06-30 01:33
Status: orientation for the next session (forward-looking)
Scope: finish Phase 1 loose ends → full production implementation of Phase 2

## Orient fast (read in this order)

1. `../identity.md` · `../../CODEGRAPH.md`
2. `CLAUDE.md` (or `AGENTS.md`) — build-home guide + non-negotiables.
3. `../wiki/MVP/build-plan-current/phases/README.md` — the phase plan + dependency graph.
4. `2026-06-30-0120-rephase-and-phase-1-acceptance.md` — what just shipped (prior handoff).
5. `../wiki/MVP/implementation-records/2026-06-30-phase-01-acceptance-harness-record.md` — Phase 1 facts.

**Naming reminder:** new memory handoffs are `YYYY-MM-DD-HHMM-title.md`. Update `MEMORY.md` index.

## Where things stand

- Phase 0 baseline loop: `source-wired`. Phase 1 acceptance **harness**: `source-wired` + locally
  verified; live **gate** `pending` (no `.env`/host here). `mvp-build` is a local-only git repo
  (branch `main`, no remotes). Local truth: typecheck/build/lint pass, 23 files / 117 unit tests,
  integration skips clean.
- ⚠️ **Phase numbering is the NEW era plan.** "Phase 2" = **Runtime & Scheduler Productionization**
  (`phases/phase-02-runtime-scheduler-productionization.md`) — NOT the old "estimate artifact" Phase 2
  (that's already in the Phase 0 baseline). Don't confuse them.

## Session objective

### 1. Tie up Phase 1 loose ends
Goal: the acceptance system is complete, correct, and honest — ready to flip to `provider-accepted`/
`runtime-accepted` the moment creds exist.
- If a real `.env`/host is available: run it for real — `acceptance:preflight` → `db:migrate` →
  golden-path `step1..7` → `acceptance:report`; capture proof ids; write a new implementation record
  + memory handoff; flip statuses. **Do not fake any of it.**
- If still no creds: review/harden the harness instead — re-verify each `run{1..8}` verifier's column
  names against `packages/db/migrations/0001`–`0007`; confirm the golden-path runbooks are accurate;
  resolve the open item below; make sure nothing is half-wired and the record stays honest.
- **Open item:** `number-pool.mjs` reconciles the `number_pool` table (0001) directly; the Phase-10
  admin `number_assignments` table is deliberately separate — decide if/when they converge (leave a
  note, don't pre-build Phase 10).

### 2. Phase 2 — Runtime & Scheduler Productionization (full production implementation)
Spec: `phases/phase-02-runtime-scheduler-productionization.md`. Depends on Phase 1 (a live runtime
host). Build to the same bar as Phase 1: real, locally verifiable, honest status.
- Make `docker` the first-pilot runtime backend default; keep `local` explicitly dev/demo
  (`runtime_endpoints.backend_type`, `HERMES_BACKEND_TYPE`).
- Stand up **Hermes Jobs** (or equivalent runner) for `dispatch_due_reminders`,
  `renew_expiring_watches`, `dispatch_daily_briefs`, and health checks; keep `scheduler:tick`
  (`infra/scripts/scheduler-tick.mjs`) as the dev/cron fallback only.
- Write real **`hermes_job_runs`** proof on each scheduled cycle; add **`runtime_health_checks`**
  snapshots surfaced to Manager/admin (and to `infra/scripts/healthcheck.mjs`).
- Acceptance: `runtime-accepted` = real Hermes run/job ids visible for a full cycle; containment is
  `docker` for the pilot. (Likely partly host-blocked — build + locally verify the source, mark
  live pieces `pending`, exactly like Phase 1.)
- After implementing: update `phases/phase-02-*.md` status, add an implementation record, write a
  dated memory handoff, update `mvp-build/README.md` + `CODEGRAPH.md` if status changes.

## Guardrails (carry in)
No faked proof; acceptance vocabulary only; secrets by reference (no raw secrets in logs/records);
RLS + service-role boundaries; approval gates on money/customer actions; review Data API exposure for
any new browser-readable table. Run the baseline checks before and after. Commit on `main` when asked.

## Parallelizable (FYI)
Once Phase 1's live environment stands, Phases **3** (generic ingress/routing), **6** (metering
foundation), and **9** (admin foundations) are independent and can start in parallel — see the
dependency graph in `phases/README.md`.
