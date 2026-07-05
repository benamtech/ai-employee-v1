# Claude Code handoff — live-feedback testing loop

Date: 2026-07-04 18:40 EDT

Status: handoff prompt; live local stack is testable but not MVP-usable

Scope: paste-ready prompt for Claude Code Opus 4.8 to continue the project from the current live-testing posture.

## Paste this into Claude Code Opus 4.8

```text
You are Claude Code running in the AMTECH AI Employee repo. Work from the repo, not memory. Read in order:

1. identity.md
2. CODEGRAPH.md
3. mvp-build/CODEGRAPH.md
4. mvp-build/CLAUDE.md and/or mvp-build/AGENTS.md
5. wiki/MVP/build-plan-current/phases/README.md
6. wiki/MVP/implementation-records/2026-07-04-phase-05-record.md
7. wiki/MVP/implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md
8. mvp-build/memory/2026-07-04-1838-runtime-bind-wizard-skip-phase6-proof.md
9. mvp-build/infra/local/RUNBOOK.md

Current truth:

- The project is finally live-testable locally, but it is not MVP-usable yet.
- Do not graduate phases by assumption. Use Realness Rules: provider/runtime acceptance requires real proof ids/transcripts.
- Phase 5 is source-wired and Supabase-side accepted. The Work Surface stream, batching, MCP-UI iframe, and Hermes run-stream client exist.
- Phase 6 is source-wired and live Supabase accepted. The targeted integration run passed live:
  `npm run test:integration -- tests/integration/new-tables-rls.integration.test.ts tests/integration/turn-claim.integration.test.ts`
  with 2 files / 5 tests.
- Hermes runtime endpoint proof is partial:
  fresh sibling Docker employee `emp_vhz8kw3bhvh67zu292ukgl` answered `/health` 200 and `/v1/capabilities` 200.
  `/health` returned `status:"ok"`, `platform:"hermes-agent"`, `version:"0.18.0"`.
  `/v1/capabilities` advertised `run_events_sse`, `tool_progress_events`, `approval_events`, and `endpoints.run_events`.
- The bind bug is fixed in the rendered profile: `API_SERVER_HOST=0.0.0.0`.
- The Hermes first-run model wizard is now bypassed by provisioning: profiles render `model.provider`, `model.default`, and `model.base_url`.
- The current blocker is provider credentials/funding. `local:chat` now reaches the OpenAI-compatible provider and fails with provider auth, not with `hermes model`.
- There is still no valid `/v1/runs/{id}/events` transcript and no external runtime run id. Do not mark Phase 5 `runtime-accepted` until you capture those.

Operating philosophy for the next work:

Use live-feedback testing aggressively. The local no-SMS stack is now valuable because live provisioned employees return real, unexpected, valid failures. Treat those failures as product signals and immediately adapt the code/docs/tests. Do not only run deterministic unit tests; use the browser, Manager API, local scripts, and live Supabase to discover what the product actually does.

Keep both paths:

- Bypass path: `local:bootstrap`, profile rendering, direct API/chat scripts, and acceptance scripts are necessary for fast core/runtime testing.
- Real user path: browser-based onboarding must also be exercised. Use Playwright or a visible browser as a coding agent would: fill the onboarding form with plausible but non-identical contractor data (painter, landscaper, carpenter, etc.), complete the local no-SMS flow, provision an employee, open `/agent/<employeeId>`, and observe real UI/API behavior. This does not need a full agentic onboarding product yet; it is a live-feedback test discipline.

Immediate priorities:

1. Make the local live-testing suite easier to run and harder to fool.
   - Add or improve scripts that drive browser onboarding end-to-end against local Manager/Web.
   - Preserve the existing bypass scripts for runtime/core testing.
   - Record real state ids and proof outputs, but never print secrets.
   - Make failures actionable: if a live employee says it needs setup, credentials, approval, or a missing route, update the product/test flow immediately.

2. Finish the Phase 5 runtime gate once a funded provider key exists.
   - Start Manager/Web with `.env`.
   - Bootstrap/provision a fresh employee.
   - Run runtime acceptance.
   - Send a setup-aware chat first, not an estimate prompt.
   - Capture `/health`, `/v1/capabilities`, successful `/v1/runs` run id, and `/v1/runs/{id}/events` SSE transcript.
   - Verify Work Surface live SSE shows snapshot -> work_progress/work_event/approval_update, not just polling.
   - Only then update records toward `runtime-accepted`.

3. Continue Phase 7 only after the live-testing harness is strong enough to reveal real regressions.
   - Phase 7 should instrument metering at chokepoints, but do it with live feedback in mind:
     prove the data appears during actual local browser/API flows, not just unit tests.

Suggested command posture:

cd mvp-build
set -a && source .env && set +a
npm run local:check
npm run db:migrate && npm run db:status
npm run manager:dev
npm run web:dev
npm run local:bootstrap
npm run local:acceptance:runtime
npm run local:chat -- "Before pricing anything, tell me what setup step you still need."

For browser testing, prefer Playwright automation where possible, but use a real browser if needed. The test data should stay plausible and varied: contractor business names, owner names, workflows, tools, and services should not be copy-pasted every run. The point is not randomness for its own sake; it is to catch assumptions in onboarding and provisioning while keeping the same AMTECH contractor vibe.

Before ending:

- Update implementation records and memory with exact proof ids/transcripts.
- State clearly what is proven and what is still pending.
- Run focused tests for touched code.
- Commit only intentional changes; do not revert unrelated work.
```

## Why this exists

The project crossed an important line: live local feedback is now more informative than hypothetical
planning. The first real employee failures exposed two true product gaps: container API bind behavior and
Hermes model setup. The next agents should keep using that loop while still keeping deterministic bypasses
for fast core testing.

## Carry-forward

Do not overbuild "agentic onboarding" yet. The useful near-term move is a practical browser onboarding
test harness that coding agents can drive with plausible varied contractor inputs, plus clear scripts that
separate bypass testing from real-user-path testing.
