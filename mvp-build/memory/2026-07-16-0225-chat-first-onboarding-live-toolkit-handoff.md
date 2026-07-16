# Chat-first onboarding repair + live toolkit handoff

Status: source-wired; static gates green; clean teardown complete; live headed proof pending

## What changed

- Repaired normal employee onboarding after the live "Manifest is invalid" failure.
- `/create-ai-employee` is now chat-first from the first screen. Phone verification, code entry, account creation, password entry, and Start Employee are secure controls inside the chat.
- Passwords and verification codes are not sent as normal chat text and are not printed in the visible status log.
- Phone verification and account creation now write canonical milestones and manifest facts back to `onboarding_sessions`.
- Start Employee now calls a Manager `provision-from-session` path. The browser no longer assembles the final employee manifest.
- Manager compiles the final `OnboardingManifest` from server-side session state, then reuses strict `provision_employee` validation.
- The front-door orchestrator prompt now explicitly avoids asking for passwords, OTPs, API keys, OAuth tokens, or secrets in normal chat and stops intake once minimum business facts are captured.
- Added append-only research/security notes in `llm-security/initial-research.md`, including the onboarding-only scope, secret-boundary standard, and a holographic/ephemeral-machine agentic UI research note.

## Live toolkit fix

Critical bug fixed:
- `npm run live:status` previously sourced `_lib.sh` but did not call `load_env`, so it printed `provider=default model=claude-opus-4-8` from a clean shell even though the intended xAI/Grok overlay existed.
- `infra/scripts/local/test/status.sh` now calls `load_env`.
- Verified after fix:
  `STACK  provider=openai_compatible model=grok-4.3  manager:8080=000000  web:3000=000000`

Active live toolkit docs updated:
- `infra/scripts/local/test/README.md`
- `infra/scripts/local/test/HANDOFF-PROMPT.md`
- `infra/scripts/local/test/_lib.sh`
- `infra/scripts/local/test/stack-up.sh`
- `infra/scripts/local/test/status.sh`

The normal path is real provider env, not the legacy local model bridge. The bridge remains an optional `LOCAL_MODEL_BRIDGE=1` dev shim and is not acceptance proof.

## Documentation pointers updated

Added brief out-of-date warnings and current pointers to:
- root `README.md`
- root `CODEGRAPH.md`
- `wiki/README.md`
- `mvp-build/README.md`
- `mvp-build/CODEGRAPH.md`

The wiki was not otherwise refreshed. There is no separate `wiki/CODEGRAPH.md`; root `CODEGRAPH.md` is the wiki/workspace graph.

## Verification run this session

- `npm run typecheck` passed after onboarding/toolkit/doc updates.
- Earlier in the same session:
  - focused onboarding readiness/compiler unit tests passed.
  - full `npm run test:unit` passed: 96 files / 593 tests.
- `npm run live:status` after status fix confirmed xAI/Grok provider path.

## Teardown / baseline

Commands run:

```bash
npm run live:down -- --employees
npm run prod-like:down -- --employee
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
npm run live:status
```

Result:
- No Docker containers listed.
- Manager 000000.
- Web 000000.
- No employee containers.
- Latest prod-like teardown proof: `infra/proofs/prod-like-down-2026-07-16T06-21-19-022Z.json`.

## Dirty working tree notes

Expected dirty areas include:
- chat-first onboarding/session-backed provisioning:
  - `apps/web/app/create-ai-employee/CreateClient.tsx`
  - `apps/manager/src/orchestrator.ts`
  - `apps/manager/src/server.ts`
  - `apps/manager/src/tools/identity.stub.ts`
  - `apps/web/app/api/front-door/provision/route.ts`
  - `packages/shared/src/tool-contracts.ts`
  - `packages/shared/src/tool-schemas.ts`
  - `tests/unit/onboarding-compile.test.ts`
  - `tests/unit/orchestrator-readiness.test.ts`
- live/prod-like normal deploy and tunnel helpers from the previous pass:
  - `infra/scripts/prod-like-normal-employee-up.mjs`
  - `infra/scripts/prod-like-normal-employee-down.mjs`
  - `infra/deploy/docker-compose.tunnel.yml`
  - `infra/caddy/tunnel.Caddyfile`
  - `package.json`
- live toolkit docs/fixes:
  - `infra/scripts/local/test/*`
- research:
  - `llm-security/initial-research.md`
- orientation docs:
  - root `README.md`, root `CODEGRAPH.md`, `wiki/README.md`, `mvp-build/README.md`, `mvp-build/CODEGRAPH.md`

Do not revert unrelated dirty files without explicit user instruction.

## Next session target

Run the first repaired normal employee live onboarding proof for a contractor business using the headed chat-first flow.

Use real xAI/Grok OpenAI-compatible env through the normal live toolkit. Do not source the full production env into the host stack. Do not use `prod-like:public-estimator:*` as success for this normal employee.

Recommended command sequence:

```bash
npm run live:status
npm run live:up
npm run live:status
LOCAL_BROWSER_HEADLESS=0 npm run local:acceptance:browser-onboard
npm run live:login -- <employeeId>
```

Expected after `live:up`:
- `provider=openai_compatible model=grok-4.3`
- Manager 200
- Web 200
- no employee containers until onboarding/provisioning creates one

Business fixture/story to use unless user changes it:
- Suggested business: Willamette Valley Paint & Remodel or Pocono Painting and Remodeling
- Work: painting/remodeling, gutter/soffit, luxury wallpaper/finishing, estimates, invoicing, social content, employee hours, material costs, scheduling, customer follow-up
- Employee name: Jordan
- Timezone: preserve what user provides; clarify mismatch rather than silently guessing

Success criteria:
- Chat-first onboarding captures business facts without repeated known-fact loops.
- Phone verification succeeds.
- Account creation advances state.
- Start Employee provisions from server-side compiled session manifest.
- Capture `session_id`, `account_id`, `employee_id`, owner email, proof JSON path, and runtime/container id.
- Open the headed owner client with `npm run live:login -- <employeeId>`.
- Confirm the conversation loop only after a real provider-backed employee reply appears.
- If xAI auth/credit blocks the turn, record it as `provider-gated`, not a runtime/Hermes outage.

## Copy-ready next-session prompt

Read:
1. `mvp-build/memory/2026-07-16-0225-chat-first-onboarding-live-toolkit-handoff.md`
2. `mvp-build/memory/2026-07-16-0030-normal-employee-deploy-confusion-handoff.md`
3. `mvp-build/memory/2026-07-16-0000-xai-orchestrator-alignment-handoff.md`
4. `mvp-build/infra/scripts/local/test/README.md`
5. `mvp-build/README.md`
6. `mvp-build/CODEGRAPH.md`
7. root `README.md`, root `CODEGRAPH.md`, and `wiki/README.md` only for orientation warnings/current pointers

Goal: run the repaired chat-first normal employee onboarding/live deploy proof. Use the normal live toolkit (`live:up`, headed `local:acceptance:browser-onboard`, `live:login`). Preserve headed Chromium. Keep host `.env` invariants and the selective xAI/Grok overlay; do not source the full production env. Do not use the public estimator path as success. Do not print secrets. Keep user-facing errors free of internal runtime/provider/database vocabulary. Record provider auth/credit failures as provider-gated.
