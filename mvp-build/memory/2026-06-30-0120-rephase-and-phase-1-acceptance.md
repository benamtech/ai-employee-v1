# Handoff — Re-phasing + Phase 1 acceptance harness + local git repo

Date: 2026-06-30 01:20
Status: re-phasing complete · Phase 1 harness `source-wired` (live gate `pending`)
Scope: `wiki/MVP/build-plan-current/` (plan) + `mvp-build/` (code); local git repo init

## What changed

1. **Forward plan re-authored as real modular phases.** The forward work that lived as eight parallel
   "Workstreams A–H" in `wiki/MVP/build-plan-current/05-implementation-workstreams.md` is now a
   dependency-ordered phase plan in **`wiki/MVP/build-plan-current/phases/`**:
   - `phase-00-baseline.md` (current source-wired loop, with a 12-step loop→module/file map),
   - `phase-01` … `phase-13` (live acceptance → runtime → event spine → metering → admin → billing →
     LLM registry → 1000-user ops), each one module with its own acceptance gate,
   - `phases/README.md` (dependency graph + status legend + index).
   `05-*.md` was retired to a Workstream→phase crosswalk. README / `00-source-of-truth` /
   `01-reconciled-scope` / `03` (Phase 1 runbook) / `04` (design detail) / `06-next-agent-handoff`
   and root `CODEGRAPH.md` were updated to point at `phases/`.

2. **Phase 1 — Live Provider & Runtime Acceptance system, built to production level.** No new DB
   schema; reads existing tables / drives existing Manager tools.
   - **Acceptance harness** `infra/scripts/acceptance/`: `preflight.mjs` (runnable/blocked matrix),
     `run1-db-rls` … `run8-security` verifiers (assert doc-03 proof ids; `run8` is a live
     forged-request probe), `report.mjs` (aggregates → `infra/acceptance/reports/phase01-<ts>.json|md`,
     gitignored; marks pass/fail/not-run, never fabricates a pass), `_env.mjs` (the env matrix).
   - **Ops scripts** (were named-but-unwritten seams): `infra/scripts/number-pool.mjs`,
     `healthcheck.mjs`, `repair.mjs` (repair commands → Manager tools; money commands gated).
   - **Tests:** `tests/unit/forged-requests.test.ts` (always-on, in-process forged Twilio/Stripe
     denial + signature/token controls), `tests/integration/security-live.test.ts` (env-gated
     cross-account artifact denial).
   - **Runbooks:** `tests/golden-path/step6-repair-and-event-bus.md`, `step7-security.md`.
   - **Wiring:** `package.json` scripts `acceptance:preflight`, `acceptance:report`,
     `ops:number-pool|healthcheck|repair`; `smoke:phase01` → `run2`; `phase01-proof.mjs` is now a shim.
   - Record: `wiki/MVP/implementation-records/2026-06-30-phase-01-acceptance-harness-record.md`.

3. **`mvp-build` is now a local-only git repo.** `git init`, branch `main`, **no remotes**. Baseline
   commit captured the pre-Phase-1 state; this work is the next commit. `.gitignore` already covers
   `node_modules/`, `dist/`, `.next/`, `.env`; added `infra/acceptance/reports/`.

4. **In-repo durable memory established** at `mvp-build/memory/` with the writing protocol
   (`MEMORY.md`). Build-home agent guide added as `mvp-build/CLAUDE.md` + `mvp-build/AGENTS.md`.

## Why

The docs referenced "phases" that were never authored as real, shippable units — Ben wanted genuine
modular phases (one module per phase, dependency-ordered, each with an acceptance gate). Phase 1 is
the live-acceptance gate; with no `.env` here it can't be executed, but the **system** that executes
and verifies it is real, production-level code — built and verified locally, with honest records that
never claim live external tests that didn't run.

## Current status (acceptance vocabulary)

- Phase 0 baseline loop: `source-wired`.
- Phase 1 acceptance **harness**: `source-wired` (locally verified).
- Phase 1 **gate** (provider/runtime acceptance): `pending` — no `.env`, no captured proof ids.
- Phases 2–13: `planned`.

## Verification (actually run, 2026-06-30)

- `npm run typecheck` ✓ · `npm run build` ✓ · `npm run lint` ✓
- `npm run test:unit` ✓ **23 files / 117 tests** (was 22/110; +forged-requests)
- `npm run test:integration` ✓ skips cleanly (4 skipped, no mock pass)
- `npm run acceptance:preflight` → all 8 BLOCKED, exit 1 · `npm run acceptance:report` → 8 not-run,
  exit 0, report written, "NOT yet accepted"
- ops scripts fail-fast with clear missing-env messages

## Carry-forward / next

- **Execute Phase 1 live** when creds exist: `cp .env.example .env`, fill, `acceptance:preflight`
  until all RUNNABLE, `db:migrate`, run golden-path `step1..7`, `acceptance:report`, then write a new
  implementation record + flip statuses to `provider-accepted`/`runtime-accepted`. Update this memory.
- **Then Phase 2** (runtime/scheduler productionization) and the independent foundations
  **3 / 6 / 9** can start in parallel — see `phases/README.md` dependency graph.
- Open: number-pool table reconciliation vs the Phase-10 admin `number_assignments` table (kept
  separate for now).
