# Handoff — Hermes Integration Alignment Audit

Date: 2026-07-03 19:52
Status: research checkpoint; no `mvp-build` code changed
Scope: New-session prompt for auditing whether current AMTECH code uses Hermes Agent in the most efficient production-shaped way before Phase 5/6 implementation.

## Handoff prompt

You are starting a new AMTECH `mvp-build` session. Your goal is to identify how the current code lines up with the most efficient way to use Hermes Agent according to the July 3, 2026 research pass, then produce a prioritized review of required fixes or alignment work before Phase 5 and the remaining Phase 6 work.

Start by reading, in order:

1. `../identity.md`
2. `mvp-build/CODEGRAPH.md`
3. `mvp-build/memory/MEMORY.md`
4. `mvp-build/memory/2026-07-03-1952-hermes-integration-alignment-handoff.md`
5. `mvp-build/docs/hermes-agent-authoritative-record.md`
6. The latest two prior handoffs:
   - `mvp-build/memory/2026-07-03-1925-phase-04-completion-and-phase-06-proof-cleanup.md`
   - `mvp-build/memory/2026-07-03-1855-phase-04-hardening-and-phase-06-metering.md`
7. Current Hermes-facing code:
   - `mvp-build/apps/manager/src/lib/hermes-client.ts`
   - `mvp-build/apps/manager/src/lib/runtime.ts`
   - `mvp-build/apps/manager/src/lib/wake.ts`
   - `mvp-build/apps/manager/src/lib/turn-queue.ts`
   - `mvp-build/apps/manager/src/lib/turn-drain.ts`
   - `mvp-build/apps/manager/src/lib/scheduler-runner.ts`
   - `mvp-build/apps/manager/src/lib/employee-events.ts`
   - `mvp-build/apps/manager/src/events/ingress.ts`
   - `mvp-build/packages/shared/src/hermes.ts`
   - `mvp-build/infra/hermes/RUNBOOK.md`
   - `mvp-build/infra/scripts/hermes-jobs-runner.mjs`
   - Unit/integration tests covering Hermes, wake, turn queue, drain, ingress, and run-id chain.

Do not begin Phase 5 feature implementation yet. First produce a code-review-style audit with findings ordered by severity. The review must answer:

- Does the current Manager/Hermes boundary use Hermes' public API Server surface instead of private Python internals?
- Does the current code discover and respect `/v1/capabilities` before using optional surfaces?
- Is `/api/sessions/{id}/chat` still the right current synchronous fallback, and where should `/v1/runs` plus `/v1/runs/{run_id}/events` become the Phase 5 production path?
- Are we wrongly assuming Hermes profiles sandbox filesystem/runtime state?
- Are AMTECH-owned responsibilities still owned by Manager: serialization, identity, tenant/account rules, approval gates, metering, repair, delivery, and product semantics?
- Are Hermes-owned responsibilities kept in Hermes: agent execution, tools, skills, session memory, and profile-local runtime state?
- Are Jobs API assumptions separated from AMTECH scheduler/reminder semantics until a dedicated contract pass exists?
- Does `X-Hermes-Session-Key` need to be introduced for stable employee/account memory scoping?
- Does Phase 4 truly remain complete at source level after this Hermes research, or did the research expose a wrong seam?
- What exactly blocks runtime-accepted status?

Use the acceptance vocabulary from `CODEGRAPH.md`:

- `source-wired`: code exists and local typecheck/unit/build/lint proof exists.
- `provider-accepted`: live provider proof ids exist.
- `runtime-accepted`: live Hermes/runtime/job proof exists.
- `planned`: designed but not implemented.
- `pending`: blocked by missing env/host/credentials or not yet attempted.

Do not mark provider or runtime acceptance without real proof ids.

## Current Hermes baseline

The latest verified upstream target is NousResearch/hermes-agent v0.18.0, released July 1, 2026. The GitHub repo shows it as the latest release, and the repo/docs were checked against the current `main` surface on July 3, 2026. Source: https://github.com/NousResearch/hermes-agent and release listing showing v0.18.0 latest at lines 750-752 in the GitHub page scrape.

Hermes' architecture is centered on `AIAgent` in `run_agent.py`. Entry points include CLI, Gateway, API Server, ACP, batch runner, and Python library; all converge into the agent loop, provider resolution, prompt assembly, tool dispatch, session storage, and tool backends. Official architecture docs describe this map directly: https://hermes-agent.nousresearch.com/docs/developer-guide/architecture.

The agent loop is turn-based: append user message, build prompt, compress if needed, call provider, execute tool calls if present, loop, then persist final response. Hermes enforces strict message alternation and tool-call ordering. Source: https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop.

## Most important integration conclusion

For AMTECH, the correct production integration should be capabilities-first and API-server-first, not private-Python-internals-first.

Hermes now exposes a stable external surface through:

- `/v1/capabilities`
- `/v1/chat/completions`
- `/v1/responses`
- `/v1/runs`
- `/v1/runs/{run_id}/events`
- `/v1/runs/{run_id}/stop`
- `/v1/runs/{run_id}/approval`
- `/api/sessions`
- `/api/sessions/{id}/chat`
- `/api/sessions/{id}/chat/stream`
- `/api/jobs`
- `/v1/skills`
- `/v1/toolsets`

The API docs explicitly say `/v1/capabilities` should be used so external UIs/control planes can discover streaming, run, cancellation, and session support without depending on private internals. Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server.

## Implications for AMTECH

The current `mvp-build` posture lines up conceptually: Phase 3/3A/4 are `source-wired`, but live Hermes runtime acceptance remains pending. In this repo, `source-wired` means code exists and local typecheck/unit/build/lint proof exists; it does not mean provider/runtime accepted.

The most important Hermes-specific implication is this:

AMTECH should treat Hermes as an external employee runtime with a public HTTP contract. The Manager should own serialization, identity, tenant/account rules, approval gates, metering, repair, and product semantics. Hermes should own agent execution, tools, skills, session memory, and profile-local runtime state.

For Phase 5 and Phase 6 planning:

- Use `/v1/runs` plus `/v1/runs/{run_id}/events` for production-grade long-running employee work and live progress.
- Keep `/api/sessions/{id}/chat` as a synchronous fallback.
- Use `/api/sessions/{id}/chat/stream` only behind capability detection.
- Use `/api/jobs` only after a dedicated contract pass, because jobs overlap with AMTECH scheduler/reminder semantics.
- Use `X-Hermes-Session-Key` deliberately for stable employee/account memory scope.
- Do not assume Hermes profiles sandbox the filesystem. Profiles isolate config, memory, sessions, skills, cron, and state, but workspace/sandbox isolation still needs Docker/backend policy. Source: https://hermes-agent.nousresearch.com/docs/user-guide/profiles.

## Expected audit output

Return findings first, ordered by severity:

- `P0`: current code would break or be unsafe against current Hermes v0.18.0.
- `P1`: current code works locally but is misaligned with the efficient production Hermes path and should be fixed before Phase 5.
- `P2`: improvement, hardening, or contract-test gap.

For each finding include:

- file/line reference;
- what the current code does;
- what Hermes v0.18.0 expects or makes possible;
- the smallest corrective move;
- the tests/contracts needed.

Then include:

- phase status review for Phases 2-4 and Phase 6;
- exact Phase 5 prerequisites;
- recommended Hermes contract-test suite;
- whether any code changes should be made immediately or deferred until the user approves implementation.

## Carry-forward / next

This checkpoint exists so the next session can close the Hermes alignment gap before building Phase 5. After the audit findings are resolved, AMTECH can move into full production Phase 5 implementation, then continue the remaining Phase 6 metering/observability work with the runtime boundary correctly shaped.

## Verification

Documentation-only checkpoint. No tests run for this handoff, and no `mvp-build` code changed.
