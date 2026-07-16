# Local live headed testing toolkit

Status: active

> **Launch-run warning:** This toolkit is for local development and fast
> diagnosis. It is **not** the default path for production-level normal employee
> onboarding proof. For launch work, start with
> [`../../../../docs/production-normal-employee-live-deploy-runbook.md`](../../../../docs/production-normal-employee-live-deploy-runbook.md)
> and use public DNS/Cloudflare Tunnel -> Caddy -> real `/create-ai-employee` ->
> Twilio Verify -> account creation -> Start Employee -> live owner web client.
> Do not count `live:login`, `/api/dev/login`, fixture mode, or this toolkit as
> normal-employee launch proof.

Bring up the local live stack + a real employee's Docker Hermes runtime and drive it
from a headed browser using the normal provider path. The toolkit loads local host
invariants from `.env`, then selectively overlays xAI/Grok OpenAI-compatible provider
values from `infra/deploy/.env.production`; it does **not** source production
`NODE_ENV` or Docker-only origins into the host stack.

The legacy `LOCAL_MODEL_BRIDGE=1` bridge/Haiku path still exists as a dev shim, but
it is not acceptance proof and should not be used for the normal live deploy path.

The point of this toolkit is token efficiency: one command per operation instead of
dozens of `curl`/`docker`/`pkill` calls. Prefer `npm run live:status` over ad-hoc probing.

## Commands (npm alias → script)

| Command | What it does |
|---|---|
| `npm run live:up` | Build `@amtech/shared` if stale, then start (detached, idempotent): provider env, **manager** :8080 (plain `tsx`, not `tsx watch`), **web** :3000. If `LOCAL_MODEL_BRIDGE=1`, also starts bridge/worker. Ends by printing status. |
| `npm run live:status` | **One compact block**: provider/model, service codes, employee containers + whether each has the Manager MCP tools wired. Your default health check. |
| `npm run live:list` | List all employees (id, name, business, container status). |
| `npm run live:reprovision -- <sourceEmployeeId>` | Provision a FRESH employee (new id) reusing an existing one's manifest + account. The new profile renders with the current template → MCP tools + bridge model + `0.0.0.0` bind. Prints the new id + dev-login URL. |
| `npm run live:login -- <employeeId>` | Print + open a headed browser at the dev-login URL (mints an owner session, sets the cookie, lands on `/agent/<id>`). Add `--print` to only print. |
| `npm run live:recover -- <employeeId>` | Recover a crashed/stale employee container (fixes the stale-`gateway_state` dual-gateway crash), re-run cleanly. |
| `npm run live:down` | Stop the four shells. `-- --employees` also stops all employee containers; `-- --employee <id>` one. |

Scripts live in `infra/scripts/local/test/`: `stack-up.sh`, `status.sh`, `stack-down.sh`,
`reprovision.mjs`, `devlogin.sh`, `employee-recover.sh`, shared `_lib.sh`. Logs:
`infra/.local/test/logs/<svc>.log`. All read the gitignored `.env`, force
`DEV_OWNER_LOGIN=1`, and keep host origins local.

## Fill-in-the-blanks: run a scenario

Replace the ⟨…⟩ placeholders with your scenario.

1. **Bring the stack up** (idempotent — safe to re-run):
   ```
   npm run live:up
   ```
   Expect `provider=openai_compatible model=<grok model> manager:8080=200 web:3000=200`.

2. **Pick / create the employee.** List existing: `npm run live:list`.
   - An employee showing `tools:NONE(reprovision needed)` in `live:status` was
     provisioned before the MCP-tools fix and **cannot call tools** — recreate it:
     ```
     npm run live:reprovision -- ⟨sourceEmployeeId⟩
     ```
     Use the printed **new** id from here on. (Its container is started for you.)
   - Confirm `live:status` shows the new id `[Up ...]` and `tools:MCP-wired`.

3. **Log in + open the webchat** (headed browser):
   ```
   npm run live:login -- ⟨employeeId⟩
   ```
   You land on `/agent/⟨employeeId⟩`, authenticated.

4. **Drive the scenario in the browser.** Type ⟨your message⟩ in "Talk to your
   employee". To exercise ⟨the tool/connector under test⟩, ask for it in plain
   language — e.g. "draft an estimate for a 3-room interior repaint" (estimate →
   PDF → signed link), "email that to the customer" (draft, then approve to send),
   "remind me tomorrow to follow up" (reminder). Tool activity, approvals, and
   generative UI render on the Work Surface; you approve gated actions inline.

5. **Optional headless proof of one turn** (no browser), to confirm the model path
   before handing over — mint a session, send a message, expect a reply:
   ```
   EMP=⟨employeeId⟩
   TOKEN=$(curl -si "http://localhost:3000/api/dev/login?employeeId=$EMP" | grep -io 'amtech_owner_session=[^;]*' | head -1 | cut -d= -f2)
   curl -s "http://localhost:3000/api/employee/$EMP/message" -H 'Content-Type: application/json' \
     -H "Cookie: amtech_owner_session=$TOKEN" -d '{"message":"⟨your test message⟩"}'
   ```
   A real employee reply means the full loop works. If xAI auth/credit blocks the
   turn, record it as `provider-gated`, not as a Hermes/runtime outage.

## Token-efficient health checking

- **One call:** `npm run live:status`. Read the single block; don't probe ports
  individually. `200`=healthy, `000`=down; provider/model should show the intended
  OpenAI-compatible Grok path unless you intentionally opted into `LOCAL_MODEL_BRIDGE=1`.
- **A turn failed?** Map the error, don't spelunk:
  - `owner_session_invalid` → not logged in for that employee → `npm run live:login -- <id>`.
  - `runtime_unreachable` → the employee container isn't reachable → `live:status`; if
    `[Exited]` or missing, `npm run live:recover -- <id>` (or reprovision).
  - `No inference provider configured` → provider env/rendering mismatch; check
    `live:status`, selective xAI overlay, and whether the employee was provisioned
    after the current profile-renderer changes.
- Only then read a specific log: `infra/.local/test/logs/<svc>.log` or
  `docker logs amtech-hermes-<id>`.

## What you can test, and what needs setup

- **No external setup:** business-brain facts, estimate → PDF → signed link,
  `request_approval`/approve/reject (the gate + ApprovalCard), email **draft** (no
  send), reminders, "just so you know" work events, and MCP-UI generative views.
- **Needs setup:** **Gmail** — `connect_email` returns a Google consent URL; requires
  `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` and the callback `MANAGER_API_ORIGIN/webhooks/gmail/oauth/callback`;
  then send is approval-gated. **Stripe** — needs test keys.

## Gotchas (already handled by the toolkit — know them anyway)

- **Node 26:** the Manager runs on plain `tsx`, not `tsx watch` (v4.22.4 crashes on
  Node 26 resolving `@amtech/shared`). `live:up` also rebuilds a stale `@amtech/shared` dist.
- **Provider before proof:** a funded/authenticated provider-backed reply is required
  for acceptance. The legacy bridge is a dev shim only.
- **Old employees have no tools:** anything provisioned before the MCP-tools fix shows
  `tools:NONE` — reprovision to get a tool-capable employee.
- **`.env` untouched:** overrides (dev-login, selective provider overlay, optional
  bridge mode) are applied at launch by the scripts, not written to your `.env`.
