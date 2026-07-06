# Live headed testing toolkit

Status: active

Bring up the whole local stack + a real employee's Docker Hermes runtime and drive
it from a headed browser — **without a funded model key**. The "model" is a single
persistent Claude Code **Haiku** instance behind the agent-in-the-loop bridge (the
"you-are-the-LLM" design, [`../../../local/agent-model-bridge.md`](../../local/agent-model-bridge.md)):
the bridge parks each `/v1/chat/completions` call and the ONE warm worker answers it.
Onboarding AND every live employee turn route through it, so **the worker must be up
for any model call.**

The point of this toolkit is token efficiency: one command per operation instead of
dozens of `curl`/`docker`/`pkill` calls. Prefer `npm run live:status` over ad-hoc probing.

## Commands (npm alias → script)

| Command | What it does |
|---|---|
| `npm run live:up` | Build `@amtech/shared` if stale, then start (detached, idempotent): **bridge** :8091, **worker** (1 warm Haiku = the LLM), **manager** :8080 (plain `tsx`, not `tsx watch`), **web** :3000. Ends by printing status. |
| `npm run live:status` | **One compact block**: service codes, warm-Haiku count, employee containers + whether each has the Manager MCP tools wired. Your default health check. |
| `npm run live:list` | List all employees (id, name, business, container status). |
| `npm run live:reprovision -- <sourceEmployeeId>` | Provision a FRESH employee (new id) reusing an existing one's manifest + account. The new profile renders with the current template → MCP tools + bridge model + `0.0.0.0` bind. Prints the new id + dev-login URL. |
| `npm run live:login -- <employeeId>` | Print + open a headed browser at the dev-login URL (mints an owner session, sets the cookie, lands on `/agent/<id>`). Add `--print` to only print. |
| `npm run live:recover -- <employeeId>` | Recover a crashed/stale employee container (fixes the stale-`gateway_state` dual-gateway crash), re-run cleanly. |
| `npm run live:down` | Stop the four shells. `-- --employees` also stops all employee containers; `-- --employee <id>` one. |

Scripts live in `infra/scripts/local/test/`: `stack-up.sh`, `status.sh`, `stack-down.sh`,
`reprovision.mjs`, `devlogin.sh`, `employee-recover.sh`, shared `_lib.sh`. Logs:
`infra/.local/test/logs/<svc>.log`. All read the gitignored `.env` and force the
local-test overrides (bridge + `DEV_OWNER_LOGIN=1` + `HERMES_MODEL_*`).

## Fill-in-the-blanks: run a scenario

Replace the ⟨…⟩ placeholders with your scenario.

1. **Bring the stack up** (idempotent — safe to re-run):
   ```
   npm run live:up
   ```
   Expect `bridge:8091=200 worker=1xHaiku manager:8080=200 web:3000=200`.

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
   `{"reply":"…","...":"ok"}` = the full loop works (session + employee + bridge + Haiku).

## Token-efficient health checking

- **One call:** `npm run live:status`. Read the single block; don't probe ports
  individually. `200`=healthy, `000`=down; `worker=1xHaiku` must be ≥1 (it is the LLM).
- **A turn failed?** Map the error, don't spelunk:
  - `owner_session_invalid` → not logged in for that employee → `npm run live:login -- <id>`.
  - `runtime_unreachable` → the employee container isn't reachable → `live:status`; if
    `[Exited]` or missing, `npm run live:recover -- <id>` (or reprovision).
  - `No inference provider configured` → the employee wasn't rendered for the bridge
    (old profile) → `npm run live:reprovision -- <id>` and use the new id.
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
- **Worker before employee:** if the warm Haiku worker is down when an employee makes
  a model call, its container times out and crashes. Keep the stack up while testing.
- **Old employees have no tools:** anything provisioned before the MCP-tools fix shows
  `tools:NONE` — reprovision to get a tool-capable employee.
- **`.env` untouched:** overrides (bridge, dev-login, `HERMES_MODEL_*`) are applied at
  launch by the scripts, not written to your `.env`.
