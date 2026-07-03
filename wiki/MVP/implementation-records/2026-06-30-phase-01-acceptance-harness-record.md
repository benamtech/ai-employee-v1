# Phase 1 — Provider/Runtime Acceptance Harness (record)

Status: active

Date: 2026-06-30

This record is **factual**. It documents the Phase 1 acceptance *system* that was built and verified
**locally**. It does **not** claim any live external provider was tested — no live credentials or host
were present in this environment, so no provider/runtime acceptance proof ids were captured.

Spec: [`../build-plan-current/phases/phase-01-provider-runtime-acceptance.md`](../build-plan-current/phases/phase-01-provider-runtime-acceptance.md)
and the detailed runbook [`../build-plan-current/03-provider-runtime-acceptance-plan.md`](../build-plan-current/03-provider-runtime-acceptance-plan.md).

## What was built (source-wired)

The Phase 1 acceptance system — the harness that *executes* the 8 acceptance runs, captures real
proof ids, and fails loudly when proof is absent. No new DB schema; everything reads existing tables
or drives existing Manager tools.

- **Env preflight** — `infra/scripts/acceptance/preflight.mjs` (`npm run acceptance:preflight`):
  runnable/blocked matrix for the 8 runs, naming the exact missing vars; no secret values printed.
- **Per-run verifiers** — `infra/scripts/acceptance/run1-db-rls.mjs` … `run8-security.mjs`, each
  asserting the doc-03 proof ids from the live DB. `run2` supersedes the old `phase01-proof.mjs`
  (now a thin shim; `smoke:phase01` points at `run2`). `run8` is a **live forged-request probe**
  against the deployed Manager (asserts denial; a 200 is a security failure).
- **Report** — `infra/scripts/acceptance/report.mjs` (`npm run acceptance:report`): runs all 8,
  writes `infra/acceptance/reports/phase01-<ts>.json|md` (gitignored), marks each run
  pass/fail/not-run. Never fabricates a pass.
- **Ops scripts** (named-but-unwritten seams, now implemented): `infra/scripts/number-pool.mjs`
  (10DLC pool audit/sync/top-up; front-door reserved + free buffer), `infra/scripts/healthcheck.mjs`
  (per-employee runtime health), `infra/scripts/repair.mjs` (repair-command dispatcher → Manager
  tools, money commands gated by `--confirm`).
- **Tests** — `tests/unit/forged-requests.test.ts` (in-process, always-on: forged/missing Twilio +
  Stripe signatures rejected at the HTTP boundary; verifiers discriminate valid vs tampered; signed
  tokens reject tamper/wrong-purpose). `tests/integration/security-live.test.ts` (env-gated
  cross-account artifact denial; skips clean without Supabase).
- **Runbooks** — `tests/golden-path/step6-repair-and-event-bus.md`, `step7-security.md` (the two runs
  that lacked runbooks; steps 1–5 already covered runs 2–6).
- **Wiring** — `package.json`: `acceptance:preflight`, `acceptance:report`, `ops:number-pool`,
  `ops:healthcheck`, `ops:repair`. `infra/scripts/README.md` updated.

## Local verification (proof that was actually run)

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run test:unit` | **23 files / 117 tests pass** (was 22 / 110; +`forged-requests.test.ts`) |
| `npm run build` | pass |
| `npm run lint` | pass |
| `npm run test:integration` | **skips cleanly** (4 tests skipped: rls-cross-account + security-live) — no mock pass |
| `npm run acceptance:preflight` (no `.env`) | all 8 runs **BLOCKED** with precise missing vars; exit 1 |
| `npm run acceptance:report` (no `.env`) | 0 pass · 0 fail · **8 not-run**; "NOT yet accepted"; report file written; exit 0 |
| ops scripts (no `.env`) | fail-fast with a clear missing-env message; no raw stack/secrets |

## Status

- Acceptance **harness**: `source-wired` (locally verified, above).
- Phase 1 **gate** (provider/runtime acceptance): `pending` — blocked on live credentials/host.
  No provider proof ids captured. Manually injected provider results are not acceptance.

## What live execution requires (handoff)

1. Copy `.env.example` → `.env`; fill creds. `npm run acceptance:preflight` until all 8 are RUNNABLE.
2. `npm run db:migrate` (0001–0008); `npm run test:integration` for the RLS + cross-account denial.
3. Run the golden-path runbooks `tests/golden-path/step1..7*.md` (some are human-in-the-loop: a real
   customer must reply from a mailbox for Gmail; a real Stripe test-mode invoice/webhook).
4. `npm run acceptance:report` to capture the proof ids; paste the report into the next record and
   flip the relevant statuses to `provider-accepted` / `runtime-accepted`.

Automatable (no human in loop): RLS/cross-account (integration), forged-request denial (unit + run8
probe). Human-in-the-loop: full provision, Gmail real reply, Stripe real invoice, reminder firing —
verified by `run2`–`run6` against the live DB.
