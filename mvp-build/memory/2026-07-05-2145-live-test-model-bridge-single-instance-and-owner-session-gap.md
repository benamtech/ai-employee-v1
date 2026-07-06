# 2026-07-05 21:45 — Live headed test: model-bridge single-instance worker, run recipe under Node 26, employee container recovery, and the owner-session + toolset gaps that block tool testing

Status: active handoff

Session goal: (1) make the local no-key model bridge use ONE persistent warm Haiku
instance, then (2) bring up the full local stack + the existing Ferraro employee's
Docker Hermes instance and open a headed browser on its webchat so the founder can
test the Work Surface / MCP-UI / connectors by hand.

## UPDATE (same session) — both blockers FIXED, live-test toolkit shipped, full loop verified

Both blockers below are resolved and the end-to-end loop is proven (owner login →
message → employee → bridge → warm Haiku → reply "Online and ready to work."):

- **Dev owner-login built.** Manager `POST /manager/dev/mint-owner-session`
  (`server.ts`, double-gated: `DEV_OWNER_LOGIN=1` + not production) mints an owner
  session for an employee's account; web `GET /api/dev/login?employeeId=<id>` sets the
  httpOnly `amtech_owner_session` cookie and redirects to `/agent/<id>`. Solves
  `owner_session_invalid` for ANY employee without the Phase-1-stub Supabase login.
- **Two provisioning regressions fixed (were blocking runtime + you-are-the-LLM):**
  (1) `packages/agent-template/.env.tpl` had `API_SERVER_HOST=127.0.0.1` → the
  container bound loopback, unreachable through Docker's port publish → `runtime_
  unreachable`. Changed to `0.0.0.0` (publish is 127.0.0.1-only + bearer key, so still
  safe). (2) The template hardcoded `models.default: claude-opus-4-8` with no bridge
  wiring → employees hit "No inference provider configured." `profile-renderer.ts` now
  renders a `{{MODEL_CONFIG}}` block: when `HERMES_MODEL_PROVIDER` is set it emits the
  custom-provider bridge block (`base_url` → :8091, `default: bridge-agent`) + fills
  `.env.tpl` `OPENAI_API_KEY`/`OPENAI_BASE_URL`; production still ships opus-4-8.
- **"Recreate Sage" done via reprovision** (provision_employee always mints a NEW id):
  working recreated Ferraro employee `emp_pnutiyn47n8g4rdagosl6u` (MCP-wired, bridge
  model, reachable). Old `emp_rz6k8puuv9xu1zzpiwygk0` left exited; its manifest is the
  reprovision source.
- **Live-test toolkit** at `infra/scripts/local/test/` (npm `live:up|down|status|list|
  reprovision|recover|login`) so testing is one command per op, not dozens of shell
  calls. `stack-up.sh` daemonizes via `setsid` (survives the agent shell), forces the
  bridge + `DEV_OWNER_LOGIN` + `HERMES_MODEL_*` overrides at launch. Guide:
  `infra/scripts/local/test/README.md`; new-session prompt: `HANDOFF-PROMPT.md`.
  292 unit tests / typecheck / lint / build green.

## What shipped (committed)

**`6911400` — model-bridge: one persistent warm Haiku instance answers all parked requests.**
`infra/scripts/local/model-bridge-worker.mjs` no longer spawns a fresh `claude -p`
per parked request. It now holds ONE long-lived stream-json session:
`claude --print --verbose --input-format stream-json --output-format stream-json --model claude-haiku-4-5`.
Each parked request is fed as a new user message on stdin; we read stdout events to
that turn's `result` event, extract the completion, write the answer, loop — same
warm process across all inputs, handled sequentially (trivial request/response
matching), child self-restarts on crash, tier still hard-pinned to Haiku 4.5.
Extracted `toStreamJsonInput` / `resultTextFromEvent` pure helpers into
`model-bridge-lib.mjs` with unit coverage (9/9 model-bridge tests). Doc
`infra/local/agent-model-bridge.md` updated to the single-instance description.
Verified end-to-end: one `claude` pid answered ALPHA, BRAVO, and a real onboarding
JSON turn; no per-request spawn, no double-answer.

## Operational recipe learned this session (Node 26 machine)

- **Run the Manager with plain `tsx`, NOT `tsx watch`.** `tsx watch` v4.22.4 crashes
  under Node **v26.2.0** resolving `@amtech/shared` ("does not provide an export
  named getToolSchema"). Single-run `npx tsx apps/manager/src/server.ts` works.
  Recipe: `set -a && source ./.env && set +a && ORCHESTRATOR_API_BASE_URL=http://localhost:8091/v1 ORCHESTRATOR_API_KEY=bridge-local ORCHESTRATOR_MODEL=bridge-agent npx tsx apps/manager/src/server.ts`.
- **Rebuild `@amtech/shared` first** — its `dist/` was stale on this branch and both
  the manager crash and the pre-existing `computeApiServerToolsets`/`getToolSchema`
  unit failures were just stale dist. `npm run build --workspace @amtech/shared`.
- **Bridge repoint is a launch override, not an .env edit.** `.env` is already the
  local.example profile (Supabase filled, no-SMS, verify-bypass) but points
  ORCHESTRATOR at OpenAI with an empty key; override to the bridge at launch.
- **`.claude/settings.json`** created with `worktree.bgIsolation: none` so this bg
  job edits the main checkout in place (founder wants main repo, no worktree). Gitignored.

## Existing Ferraro employee + container recovery

- Employee **`emp_rz6k8puuv9xu1zzpiwygk0`** — name **"Sage"**, business **"Ferraro
  Grounds & Gardens"** (landscaping; the founder called it "Ferraro Painting" but this
  is the only Ferraro instance). account `acct_3t6yn02yc360oewyi2mvir`, owner user
  `user_v2hcueqlfgcroe92han71a`. Container `amtech-hermes-emp_rz6k8puuv9xu1zzpiwygk0`,
  gateway port **8610**, wired to the bridge (`OPENAI_BASE_URL=http://host.docker.internal:8091/v1`,
  model `bridge-agent`). Profile dir `/home/georgej/.hermes/profiles/client_emp_rz6k8puuv9xu1zzpiwygk0`.
- **Two failure modes hit + fixed:** (1) it had crashed 15h earlier with
  `bridge_answer_timeout` because it made a model call while NO worker was running —
  **keep the worker up whenever the employee is live.** (2) On `docker start` it hit a
  stale-state conflict: `gateway_state.json` said `running`, so the container's
  reconcile cont-init started a *second supervised* gateway that collided with the
  foreground `gateway run` (kanban-DB corruption guard → main-hermes stops → exit).
  Recovery: `docker rm -f`, set `gateway_state.json` gateway_state=stopped (backup at
  `gateway_state.json.stale-bak`), re-run via `infra/scripts/local/start-hermes-container.sh <profile_dir>`
  (which does rm -f + fresh `docker run ... gateway run --no-supervise --replace`).
  Reconcile then shows `prior_state=stopped action=registered` and 8610 comes up
  (authenticated `/v1/capabilities` returns server_agent caps).

## BLOCKER 1 — owner web session (why the webchat shows `owner_session_invalid`)

The webchat under `/agent/<id>` sends the httpOnly cookie `amtech_owner_session` →
Next `/api/employee/[id]/*` routes → Manager, which validates via
`requireOwnerSession` (`owner_web_sessions.token_hash = HMAC-SHA256(SIGNING_SECRET, token)`).
This browser has no valid cookie for Ferraro → 401 `owner_session_invalid`.
- **`/login` is a Phase 1 STUB** (no Supabase Auth wired). The cookie is ONLY ever set
  by the onboarding `create-account` route (`apps/web/app/api/front-door/create-account/route.ts`).
- A **non-expired session ROW already exists** for Ferraro (expires 2026-07-18) but we
  only have its `token_hash`, not the raw `ow_...` token — unusable.
- We CAN mint a fresh one (have account_id + user_id + SIGNING_SECRET;
  `mintOwnerSession` in `apps/manager/src/lib/owner-session.ts`). Needed: a dev login.
  Options: (a) dev-only Next route `/api/dev/login?employeeId=...` that mints + sets the
  httpOnly cookie, gated like `TWILIO_VERIFY_DEV_BYPASS`; (b) one-off: mint token via
  script + paste into DevTools → Application → Cookies as `amtech_owner_session`.

## BLOCKER 2 — Sage can't call ANY Manager tools yet (blocks tool/connector testing)

Sage's rendered `config.yaml` (provisioned 2026-07-04 19:49, `_config_version: 33`)
has **no `platform_toolsets.api_server` and no `mcp_servers.amtech_manager`** — it was
provisioned BEFORE the MCP-server/toolset fix (see handoff `2026-07-05-0930`). So Sage
runs on terminal/file/web only and cannot invoke create_estimate / request_approval /
gmail connectors etc. The current template (`packages/agent-template/config.yaml` +
`profile-renderer.ts`) DOES render both (`{{PLATFORM_TOOLSETS}}`, `mcp_servers.amtech_manager`
→ Manager `/manager/mcp`). **To test tools, either re-provision Sage (re-render its
profile on this branch) or provision a fresh employee — reusing the stale Sage profile
will show zero tools.**

## How tool usage + connectors display (the overview the founder asked for)

- Owner just **chats** in the Work Surface "Talk to your employee" box → the employee
  (Hermes) decides to call Manager tools **natively over MCP** (`mcp-server.ts` is a
  transport over the tool registry; `tools/call` → `runManagerTool`, gates/audit/approval
  reused). Nothing renders raw tool names/JSON.
- Live via SSE `/api/employee/[id]/events`: `snapshot`, `work_event`, `work_progress`
  ("<verb>…"), `approval_update`. Sections in `AgentClient.tsx`: **Needs you**
  (approvals + non-notify WorkCards), **Your jobs** (JobFolder), **Handled — just so
  you know** (notify), plus chat. Components: WorkCard, ApprovalCard, JobFolder,
  Receipt, DailyBrief, **McpUiResource** (generative UI via MCP-UI `ui://` rawHtml in a
  sandboxed iframe; postMessage intents route through the approval gate).
- **Tools testable with NO external setup:** save_business_brain_fact / get_business_brain,
  create_estimate_artifact → render_estimate_pdf → create_signed_artifact_link,
  request_approval / resolve_approval / get_approval_status (exercises the gate +
  ApprovalCard), create_email_draft (draft only), set_internal_reminder / get_reminders,
  send_employee_event, MCP-UI `view`.
- **Gmail (needs setup):** connect_email → Google consent URL (needs
  `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` + redirect `MANAGER_API_ORIGIN/webhooks/gmail/oauth/callback`),
  complete_gmail_oauth writes `connector_accounts`, then create_email_draft →
  send_email_draft (approval-gated). Stripe similarly needs test keys.

## Current state at handoff

Everything torn down cleanly: bridge/worker/manager/web stopped; Haiku model stopped;
container `amtech-hermes-emp_rz6k8puuv9xu1zzpiwygk0` cleanly `Exited (0)`. Git clean;
only commit this session is `6911400` (not pushed). Next: decide dev-login approach +
re-provision (or patch) Sage's profile so tools attach, then re-run the stack and test.

Related: [[2026-07-05-0930-mcp-server-toolsets-tool-activity]] (the toolset/MCP fix Sage
predates), [[2026-07-04-1912-local-onboarding-harness-and-twilio-creds]] (env + bypass).
