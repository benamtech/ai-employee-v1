# Handoff — Hermes Alignment Corrections (source-verified against NousResearch/hermes-agent)

Date: 2026-07-03 23:52
Status: source-wired; live runtime/provider proof pending
Scope: Fix the four capability/response-shape mismatches in the Hermes client that were written against
guessed field names, now verified against the real `NousResearch/hermes-agent` HTTP API.

## What changed

The prior alignment work ([2026-07-03 20:21](2026-07-03-2021-hermes-capabilities-runs-alignment.md)) wired
the capabilities-first / Runs-first client partly against **guessed** Hermes field names. Reading the real
API server source (`gateway/platforms/api_server.py`, default port 8642) surfaced four concrete mismatches
that would silently break against a real Hermes. All four fixed in `apps/manager/src/lib/hermes-client.ts`:

- **A1 (highest impact) — `supportsSessionKey`:** real Hermes advertises `session_key_header` as a
  **string** (`"X-Hermes-Session-Key"`), not `true`. The old `features[name] === true` probe returned
  `false` → `X-Hermes-Session-Key` was **never sent** → per-account/employee long-term memory scoping died
  silently. Now treats a non-empty string-valued `session_key_header` as support (boolean probes kept).
- **A2 — `textFromJson`:** real session-chat returns `message` as an object `{role,content}`; the old code
  returned `json.message` and the caller did `text?.trim()` → **TypeError** on the Sessions fallback path.
  Now extracts `message.content` when `message` is an object.
- **A3 — `supportsRuns`:** real flags are `run_submission`/`run_status`; old probe used `runs`/`run` and
  matched only by incidental endpoint-substring. Real names added first.
- **A4 — `ensureCanonicalSession`:** real `POST /api/sessions` nests the id under `session`
  (`{session:{id}}`); old code read a top-level `session_id ?? id`. Now reads nested id first (typed as
  `HermesSessionCreateResponse`).
- **A5 — shared types (`packages/shared/src/hermes.ts`):** `HermesCapabilities.features` →
  `Record<string, boolean | string>`; `HermesChatResponse.message` → `string | {role?,content?}`;
  `HermesSessionCreateResponse` gains `session?: { id?: string }`.
- **A6/A7 — tests:** unit fixtures updated to the real capability shape; new cases for string
  `session_key_header`, `run_submission`, `message.content` extraction, and nested `session.id`. Contract
  test (`tests/integration/hermes-contract.integration.test.ts`) updated to the real run probe, a
  string-header session-key check, and assertions that session-chat exposes `message.content` and
  `POST /api/sessions` returns `session.id` (still env-gated on `HERMES_CONTRACT_*`).
- **A8 — docs:** `infra/hermes/RUNBOOK.md` now documents the verified capability flag set and that
  `POST /v1/runs` ignores unknown body fields.

## Why

The 20:21 client was capabilities-first and Runs-first in shape but had never been checked against the
authoritative Hermes schema. A1 in particular is a silent correctness bug: memory scoping would appear to
work in unit tests (which used a boolean fixture) yet never send the header against a real server.

## Current status

- Hermes client alignment: `source-wired`.
- Phase 4 / Phase 6 unchanged (`source-wired`); no schema/migration changes in this pass.
- Provider/runtime acceptance remains `pending` — no live Hermes proof ids were created. The env-gated
  contract test is the gate; run it against a real `NousResearch/hermes-agent` server and record proof ids
  in `wiki/MVP/implementation-records/` before any `runtime-accepted` claim.

## Files / seams touched

- `apps/manager/src/lib/hermes-client.ts` (A1–A4), `packages/shared/src/hermes.ts` (A5),
  `tests/unit/hermes-client.test.ts` (A7), `tests/integration/hermes-contract.integration.test.ts` (A6),
  `infra/hermes/RUNBOOK.md` (A8).

## Carry-forward / next

- **Phase 5** (event delivery/presentation layer) is the next build, and this alignment is its substrate:
  streaming Runs client consuming `GET /v1/runs/{run_id}/events` (SSE: `tool_progress_events`/
  `approval_events`/lifecycle), `POST /v1/runs/{run_id}/stop`, `POST /v1/runs/{run_id}/approval`, detect
  `waiting_for_approval` status; real triage/batching through the `delivery_decisions` seam; live Work
  Surface stream. Gate the SSE/stop/approval calls on capabilities `run_events_sse`/`run_stop`/
  `run_approval_response`, fall back to the current poll loop when absent. Open schema question: reuse
  `delivery_decisions` + descriptors or add a migration (default: reuse).
- Run the env-gated contract test against a real profile before claiming runtime acceptance.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, **38 files / 228 tests** (hermes-client.test.ts now 24 tests, +5).
- `npm run test:integration` — pass, 5 files / 10 tests skipped cleanly without live creds.
- `npm run lint` — pass. `npm run build` — pass.
- Live end-to-end alignment proof (still `pending`): `HERMES_CONTRACT_BASE_URL=... HERMES_CONTRACT_API_TOKEN=... npm run test:integration -- hermes-contract`.
