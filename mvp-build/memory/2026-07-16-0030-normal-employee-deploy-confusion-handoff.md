# Normal employee deploy confusion handoff

Date: 2026-07-16 00:30 ET
Status: teardown complete; normal-employee deploy not proven; xAI env compatibility partially source-wired
Scope: Preserve the correct next-session grounding after a confused attempt to deploy a brand-new AMTECH AI employee for a Eugene, Oregon painting/remodeling company.

## What happened

- The requested target was a normal newly onboarded employee, not the existing public estimator employee.
- The session initially drifted into the public-estimator/prod-like scripts. That was the wrong success criterion for this request.
- The correct interactive path for a headed owner web client is still the existing local live-test toolkit:
  - `npm run live:up`
  - `npm run local:onboard` or `npm run local:acceptance:browser-onboard`
  - `npm run live:login -- <employeeId>`
  - then use the opened Chromium/web client manually.
- A bad intermediate idea was to load all of `infra/deploy/.env.production` into the host dev/live toolkit. That is wrong because production env contains host-incompatible values:
  - `NODE_ENV=production`, which makes `/api/dev/login` fail closed.
  - `MANAGER_API_ORIGIN=http://manager:8080`, which is Docker DNS and is not reachable from the host Next dev server.
- The corrected direction is to keep local host/dev invariants from `.env`, and overlay only production provider variables from `infra/deploy/.env.production`, especially xAI/Grok variables.

## Current teardown state

- `npm run live:down -- --employees` was run.
- `npm run prod-like:down -- --employee` was run.
- `npm run live:status` reports:
  - Manager `8080=000000`
  - Web `3000=000000`
  - no employee containers.
- `docker ps -a` returned no containers.
- Latest prod-like teardown proof:
  - `infra/proofs/prod-like-down-2026-07-16T04-27-17-750Z.json`

## Current source changes

Only two tracked files are modified, and both are intended to preserve production-variable compatibility:

- `infra/scripts/local/test/_lib.sh`
  - Restores local `.env` sourcing for the host live toolkit.
  - Selectively overlays xAI/Grok values from `infra/deploy/.env.production`.
  - Explicitly does not import production `NODE_ENV` or Docker-only Manager origins into the host dev stack.
- `infra/scripts/prod-like-public-estimator-up.mjs`
  - Maps `XAI_API_TOKEN` / `XAI_MODEL` and lowercase `xai_api_key` / `xai_model` into the OpenAI-compatible orchestrator settings.
  - Keeps xAI/Grok usable through the existing OpenAI-compatible code path.

Do not revert those two changes unless you intentionally replace them with an equivalent provider-env mapping.

## What was not proven

- No fresh Eugene employee was successfully provisioned.
- No headed live client was opened for a new employee.
- No real employee web-client conversation loop was completed.
- No campaign readiness, provider acceptance, or live employee runtime acceptance should be claimed from this session.

## Important references

- Live headed testing toolkit:
  - `infra/scripts/local/test/README.md`
  - `infra/scripts/local/test/stack-up.sh`
  - `infra/scripts/local/test/status.sh`
  - `infra/scripts/local/test/devlogin.sh`
  - `package.json` scripts: `live:up`, `live:status`, `live:login`, `live:down`
- Real onboarding paths:
  - `infra/scripts/local/onboard.mjs`
  - `infra/scripts/local/acceptance/06-browser-onboard.mjs`
  - `apps/web/app/create-ai-employee/CreateClient.tsx`
  - `apps/web/app/api/front-door/message/route.ts`
  - `apps/web/app/api/front-door/provision/route.ts`
- Dev owner-login gate:
  - `apps/web/app/api/dev/login/route.ts`
  - Requires `DEV_OWNER_LOGIN=1`
  - Fails closed when `NODE_ENV=production`
- Manager/Web local host routing:
  - `apps/web/app/api/_lib/manager.ts`
  - Host dev server needs `MANAGER_API_ORIGIN=http://localhost:8080`
  - Docker compose/prod env uses `http://manager:8080`, which is not valid for host Next dev.
- xAI/Grok provider mapping:
  - `apps/manager/src/lib/orchestrator-model.ts`
  - `infra/deploy/.env.production`
  - `infra/scripts/local/test/_lib.sh`
  - `infra/scripts/prod-like-public-estimator-up.mjs`
- Prior relevant memories:
  - `memory/2026-07-16-0000-xai-orchestrator-alignment-handoff.md`
  - `memory/2026-07-15-0410-xai-grok-estimator-token-efficient-test.md`
  - `memory/2026-07-15-0258-cloudflare-tunnel-and-production-dns-handoff.md`
  - `memory/2026-07-15-0203-prod-like-public-estimator-runtime-proven.md`
  - `memory/2026-07-05-2145-live-test-model-bridge-single-instance-and-owner-session-gap.md`
  - `memory/2026-07-04-1912-local-onboarding-harness-and-twilio-creds.md`

## Next-session prompt

Use this as the grounding prompt for the next session:

> You are taking over AMTECH in `/home/georgej/AMTECH/GTM-RESEARCH/mvp-build`.
>
> Goal: perform the first live deploy of a brand-new normal AMTECH AI employee for a Eugene, Oregon painting/remodeling company, as close to production as practical while preserving the existing headed browser flow so the user can interact with the employee live.
>
> Read first:
>
> 1. `memory/2026-07-16-0030-normal-employee-deploy-confusion-handoff.md`
> 2. `memory/2026-07-16-0000-xai-orchestrator-alignment-handoff.md`
> 3. `memory/2026-07-05-2145-live-test-model-bridge-single-instance-and-owner-session-gap.md`
> 4. `memory/2026-07-04-1912-local-onboarding-harness-and-twilio-creds.md`
> 5. `infra/scripts/local/test/README.md`
> 6. `README.md`
> 7. `CODEGRAPH.md`
>
> Critical correction from the failed prior session:
>
> - Do not use `prod-like:public-estimator:*` as the success path. That is for the public estimator employee, not this normal new employee.
> - Do not load the entire `infra/deploy/.env.production` into the host live-test stack. It contains `NODE_ENV=production` and Docker-only `MANAGER_API_ORIGIN=http://manager:8080`, which break `/api/dev/login` and host Next-to-Manager proxying.
> - Use the normal live toolkit (`npm run live:up`, `npm run local:onboard` or `npm run local:acceptance:browser-onboard`, then `npm run live:login -- <employeeId>`) and preserve its headed Chromium behavior.
> - Use xAI/Grok semantics through OpenAI-compatible env only by selectively overlaying provider variables from `infra/deploy/.env.production`: `XAI_API_TOKEN` / `xai_api_key`, `XAI_MODEL` / `xai_model`, `ORCHESTRATOR_PROVIDER=openai_compatible`, `ORCHESTRATOR_API_BASE_URL=https://api.x.ai/v1`, `ORCHESTRATOR_MODEL=<grok model>`, `HERMES_MODEL_PROVIDER=openai_compatible`, `HERMES_MODEL_DEFAULT=<grok model>`.
> - Keep local host invariants from `.env`: `NODE_ENV=development`, `MANAGER_API_ORIGIN=http://localhost:8080`, `PUBLIC_WEB_ORIGIN=http://localhost:3000`, and `DEV_OWNER_LOGIN=1` from the toolkit.
>
> Start clean:
>
> ```bash
> npm run live:down -- --employees
> npm run prod-like:down -- --employee
> docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
> npm run live:status
> ```
>
> Expected clean baseline:
>
> - Manager `000000`
> - Web `000000`
> - no `amtech-hermes-*` containers.
>
> Then:
>
> 1. Run `npm run live:up`.
> 2. Confirm status says `provider=openai_compatible model=grok-4.3`, Manager `200`, Web `200`, no employee containers yet.
> 3. Run the real onboarding path for a Eugene painting/remodeling company. Prefer the existing headed browser harness if possible: `LOCAL_BROWSER_HEADLESS=0 npm run local:acceptance:browser-onboard`. If using `npm run local:onboard`, make sure the fixture/input is Eugene/Pacific/painting-and-remodeling.
> 4. Capture `session_id`, `account_id`, `employee_id`, owner email, proof JSON path, and any runtime/container id.
> 5. Open the headed authenticated owner client with `npm run live:login -- <employeeId>`. This is the browser the user wants to interact with.
> 6. Let the user talk to the employee in the opened headed web client.
> 7. Confirm the conversation loop only after a real provider-backed employee reply appears. If xAI auth/credit fails, record it as provider-gated, not as a runtime/Hermes outage.
> 8. Update memory with exact commands, proof paths, ids, what was source-wired, what was runtime-proven, and what remains gated.
>
> Company to onboard:
>
> - Painting and remodeling company
> - Location: Eugene, Oregon
> - Suggested business identity: Willamette Valley Paint & Remodel
> - Suggested employee name: Jordan
> - Timezone: `America/Los_Angeles`
> - Owner story: owner-led small team doing interior/exterior painting, drywall/trim repair, cabinet refreshes, and small remodels; needs estimate walkthroughs, change-order follow-up, scheduling reminders, and clean customer follow-up.
>
> Constraints:
>
> - Do not claim campaign readiness.
> - Do not use the old public estimator employee as success.
> - Do not print secrets.
> - Keep user-facing errors free of internal Hermes/MCP/provider/database vocabulary.
> - Do not reuse owner sessions for anonymous visitor flows.
> - If provider credit/auth blocks the turn, call it provider-gated.

## Verification from this handoff session

- `npm run live:down -- --employees`: completed, shells down.
- `npm run prod-like:down -- --employee`: completed, proof written.
- `docker ps -a`: no containers.
- `npm run live:status`: Manager/Web down, no employee containers.
- `git diff --stat`: only `_lib.sh` and `prod-like-public-estimator-up.mjs` remain modified for xAI/prod-variable compatibility.
