# Handoff Prompt: Live Anthropic Full Onboarding Test

You are working in `/home/georgej/AMTECH/GTM-RESEARCH/.claude/worktrees/ce2-ce3-production`, branch `worktree-ce2-ce3-production`.

Goal: run a production-like local proof from the normal AMTECH business onboarding path through live Hermes employee chat using Anthropic, not the local model bridge. This is a normal business-owner AI employee test for a contractor-style SMB, not the website-estimator materialization probe.

Context already implemented in this worktree:
- Gitignored `mvp-build/.env` has a live Anthropic key and these non-secret model settings:
  - `ORCHESTRATOR_PROVIDER=anthropic`
  - `ORCHESTRATOR_API_BASE_URL=https://api.anthropic.com/v1`
  - `ORCHESTRATOR_MODEL=claude-haiku-4-5-20251001`
  - `ORCHESTRATOR_RESPONSE_FORMAT=none`
  - `HERMES_MODEL_PROVIDER=anthropic`
  - `HERMES_MODEL_DEFAULT=claude-haiku-4-5-20251001`
- `apps/manager/src/lib/orchestrator-model.ts` supports Anthropic Messages API for the front-door onboarding orchestrator.
- `apps/manager/src/lib/profile-renderer.ts` renders live Anthropic employee model config and passes `ANTHROPIC_API_KEY` into employee `.env`.
- `infra/scripts/local/test/stack-up.sh` no longer starts or forces the old model bridge unless `LOCAL_MODEL_BRIDGE=1`.
- `infra/scripts/local/contractor-fixtures.mjs` has deterministic fixture `ONBOARD_FIXTURE=binghamton_painting` for a Binghamton, NY painting contractor: Southern Tier Precision Painting, owner Nate Barone, new employee Avery. The fixture is normal owner office work: estimate write-ups, quote follow-up, QuickBooks/bookkeeping reminders, and job-admin reminders.
- Keep the separate website-estimator/profile-generator tests as their own research thread; do not use them for this proof.
- Do not use or count the local model bridge as proof.

Start by reading:
1. `identity.md`
2. `mvp-build/CODEGRAPH.md`
3. `mvp-build/CLAUDE.md`
4. `mvp-build/memory/2026-07-12-2359-profile-generator-first-estimator-probe.md`
5. `mvp-build/infra/scripts/local/test/README.md`
6. `mvp-build/infra/scripts/local/onboard.mjs`
7. `mvp-build/infra/scripts/local/contractor-fixtures.mjs`

Run the proof from `mvp-build`:

```bash
set -a
source .env
set +a

npm run live:down -- --employees
npm run live:up
npm run live:status
```

Expected stack status: Manager `:8080=200`, Web `:3000=200`, provider shown as `anthropic`, model `claude-haiku-4-5-20251001`. Bridge/worker should not be required.

Then run the normal business-case onboarding script against the real web/front-door endpoints. Let the front-door orchestrator build the manifest from owner-like messages; do not inject a website-employee profile or purpose package.

```bash
ONBOARD_FIXTURE=binghamton_painting npm run local:onboard
```

This should drive:
1. `/api/front-door/message` -> Anthropic orchestrator builds the manifest from owner words.
2. `/api/front-door/send-code` and `/check-code` through the local dev phone bypass.
3. `/api/front-door/create-account`.
4. `/api/front-door/provision` -> existing `provision_employee` -> render profile -> Caddy snippet -> Docker Hermes runtime.

After onboarding, verify:

```bash
npm run live:status
npm run local:acceptance:runtime
```

Then open the headed web client for the new employee id printed by `local:onboard`:

```bash
npm run live:login -- <employee_id>
```

In the headed Work Surface, send a real owner-to-employee test message:

> Hi Avery. I just walked a two-bedroom interior repaint in Binghamton. Walls only: one room is 12x14, the other is 10x12, both with 8-foot ceilings. Help me turn this into a clean estimate draft, note any assumptions, and remind me what bookkeeping or follow-up details I should capture.

Proof gates:
- The employee row is `live`.
- `runtime_endpoints` has a Docker endpoint for the new employee.
- `live:status` shows the employee container up and `tools:MCP-wired`.
- The headed web client receives a response from the live Anthropic-backed Hermes employee.
- If the employee uses Manager MCP tools or creates an estimate artifact, record the audit/artifact ids and inspect generic HTML rendering.
- The employee should behave like a normal owner-facing contractor assistant, not a website visitor chat agent.

Do not claim:
- local model-bridge proof;
- website-estimator materialization proof for this run;
- multimodal/image proof unless a real image is processed by the live model/runtime;
- PDF proof unless real PDF bytes are generated/stored;
- customer-facing send/write/money actions unless Manager approval gates are exercised.

Useful fallback diagnostics:
- `docker logs --tail 160 amtech-hermes-<employee_id>`
- `npm run live:status`
- DB query via `node --input-type=module` + `pg` against `employee_profile_builds`, `runtime_endpoints`, `employees`, and `provisioning_jobs`.
- If Manager was already running before env changes, restart with `npm run live:down -- --employees` then `npm run live:up`.

Keep the final report concise: commands run, employee id/account id, runtime endpoint, web-client result, artifact ids if any, and any remaining blocker.
