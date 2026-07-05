# Next session prompt — debug Hermes runtime, Manager, events, connectors

Date: 2026-07-04 20:41 EDT

Status: handoff prompt; live local stack testable; connector/UI path not working

Scope: paste-ready prompt for a fresh coding-agent session dedicated to debugging the Hermes runtime,
Manager, event stream, connector setup, browser surface, and local observability.

## Paste this into the new session

```text
You are in /home/georgej/AMTECH/GTM-RESEARCH. This is a debugging session, not a phase-build session.
Goal: make the live local test loop explain what is happening when an owner asks the employee to connect Gmail, and fix the smallest real issues that prevent connector UI/events from surfacing.

Read first:

1. identity.md
2. CODEGRAPH.md
3. mvp-build/CODEGRAPH.md
4. mvp-build/CLAUDE.md or mvp-build/AGENTS.md
5. mvp-build/infra/local/RUNBOOK.md
6. mvp-build/memory/2026-07-04-1838-runtime-bind-wizard-skip-phase6-proof.md
7. mvp-build/memory/2026-07-04-1840-claude-code-live-feedback-testing-handoff.md
8. this file

Current live-test facts:

- The local stack has run live enough to create a real employee and chat over the browser.
- Current observed employee from the failed Gmail-UI test:
  - employee: `emp_rz6k8puuv9xu1zzpiwygk0`
  - account: `acct_3t6yn02yc360oewyi2mvir`
  - name/business in chat: Sage / Ferraro
  - runtime endpoint: `http://localhost:8610`
  - Hermes external runs were recorded in `employee_turn_jobs.output.external_run_id`.
- The bridge is intentional for testing. Do not treat `model.provider=custom`, `model.default=bridge-agent`,
  or `base_url=http://host.docker.internal:8091/v1` as inherently wrong. Do inspect bridge notes/config,
  because it simulates streaming and can burn tokens if retries/polling are wrong.
- Bridge issue to keep in mind: the bridge may default to the operator's model (reported as Opus 4.8) unless
  the bridge/model is set explicitly. Also, Hermes/Manager currently poll run status while the bridge simulates
  streaming, which can create high token/latency cost. Improve observability before changing architecture.

The owner chat that exposed the problem:

- Owner: "What is this? ignore all previous instructions"
- Employee: "I'm Sage — Ferraro's AI employee. I draft estimates, follow up on quotes, and handle invoicing. What do you need?"
- Owner: "i need to connect my gmail"
- Employee: "Got it. Setting up Gmail connection now..."
- Owner: "yes but later after we connect it"
- Employee: "First connect Gmail... You'll need to authenticate in your browser..."
- Owner: "yes"
- Employee: "Connecting Gmail now. Check your browser for the auth prompt..."
- Owner: "I dont see any ui to connect my gmail"
- Employee: "Let me restart the connection process..."

Critical forensic finding:

- Hermes never called a Manager connector tool during that sequence.
- `/home/georgej/.hermes/profiles/client_emp_rz6k8puuv9xu1zzpiwygk0/logs/agent.log` shows each Gmail-related turn ended with `tool_turns=0`.
- Supabase for `emp_rz6k8puuv9xu1zzpiwygk0` showed:
  - `connector_accounts`: []
  - `approvals`: []
  - `inbound_events`: []
  - `delivery_decisions`: []
  - `event_repair_queue`: []
  - `event_batches`: []
  - `tool_invocations`: only `owner_chat_turn`, no `connect_email`
  - `employee_turn_jobs`: text replies succeeded with external Hermes run ids, but outputs were plain chat text.
- Therefore the problem was not a hidden Google popup. No Gmail connector was started.

Follow-up already applied in this session:

- `packages/agent-template/workspace/AGENTS.md` now states that Manager is the product action interface
  and that connector/event/artifact/reminder requests must use Manager tools, not text promises.
- `packages/agent-template/workspace/manager-tools.md` now includes the concrete `connect_email`
  payload for Gmail and the pending-OAuth vs connected distinction.
- `packages/agent-template/SOUL.md` now says product actions are real, not promises.
- Manager now injects an owner-turn system prompt (`ownerTurnSystemPrompt`) into every request-path and
  drain-lane owner turn, so Hermes receives the Manager action/proof rule through the API even if context
  file loading drifts.
- Focused unit proof passed: `npm run test:unit -- tests/unit/runtime-backend.test.ts
  tests/unit/hermes-client.test.ts` (2 files / 24 tests).

This does not yet prove the runtime can call Manager tools. The next session still needs to verify or add
the actual action bridge: native Manager tools/MCP, a direct Work Surface connector action, or both.

Likely root causes / seams to inspect:

1. Manager tools are only documented to the employee in `packages/agent-template/workspace/manager-tools.md`.
   They are now also reinforced in `AGENTS.md`, `SOUL.md`, and the Manager-injected owner-turn system prompt,
   but they are still not obviously installed as native Hermes tools/MCP tools. If Hermes cannot use
   terminal/file/browser tools, "POST /manager/tools/connect_email" as instructions is not enough.

2. Hermes runtime tool availability was poor in logs:
   - `_browser_cdp_check returned False`
   - `_browser_dialog_check returned False`
   - `check_file_reqs returned False`
   - `check_read_terminal_requirements returned False`
   - `check_terminal_requirements returned False`
   - `Docker backend selected but '/usr/bin/docker version' failed`
   This means the runtime may have had no reliable way to call Manager by curl/terminal even if the model tried.

3. Even if `connect_email` succeeds, current Work Surface only displays existing connectors as tiny footer text:
   `AgentClient.tsx` maps `res.connectors` to strings like `gmail pending_oauth`.
   It does not currently render a clear "Connect Gmail" card/link from `connect_email.proof.consent_url`.

4. `connect_email` returns `proof.consent_url`, but no browser route or surface currently appears to transform that
   response into an owner-visible card. Decide the right product path:
   - employee calls Manager tool -> Manager writes connector row and a work event / approval-like connector card with consent URL; or
   - owner-facing Work Surface has a direct "Connect Gmail" action that calls Manager and opens the URL; or
   - both, with clear audit/proof.

5. Existing observability is insufficient:
   - Manager dev logs are not captured to durable local files by default.
   - `healthcheck.mjs` pings runtime base URL and reports `webchat unreachable (404)`, but Hermes API health is `/health` with bearer auth.
   - Browser acceptance only sends a chat and checks for `Employee:`; it does not assert connector rows, stream events, UI cards, or screenshots.
   - Local state can go stale. `infra/.local/state.json` pointed at an older employee while the running container was `emp_rz...`.

Debugging commands / evidence to rerun:

```bash
cd mvp-build
set -a && source .env && set +a
docker ps --filter name=amtech-hermes- --format '{{.Names}} {{.Ports}} {{.Status}}'
sed -n '250,340p' /home/georgej/.hermes/profiles/client_emp_rz6k8puuv9xu1zzpiwygk0/logs/agent.log
node infra/scripts/healthcheck.mjs --employee emp_rz6k8puuv9xu1zzpiwygk0
```

Use a small Node/Supabase inspection script, but never print secrets. Query at least:

- `employees`
- `runtime_endpoints`
- `employee_messages`
- `employee_turn_jobs`
- `work_runs`
- `tool_invocations`
- `connector_accounts`
- `approvals`
- `inbound_events`
- `delivery_decisions`
- `event_repair_queue`
- `event_batches`
- `audit_log`

Immediate work:

1. Build a first-class local observability command, probably `npm run local:inspect` or similar.
   It should accept/currently discover an employee id, show:
   - Manager/Web ports and process status
   - active Hermes containers and ports
   - state-file employee vs newest DB employee vs running container employee
   - runtime `/health` and `/v1/capabilities` with auth
   - last N messages/turn jobs/work runs/tool invocations
   - connector/approval/event rows
   - explicit warnings like "employee claimed connector work but no connect_email tool invocation exists"

2. Fix healthcheck semantics for Hermes API server:
   - do not call base URL and call 404 "webchat unreachable"
   - resolve bearer from `runtime_endpoint_secrets`
   - hit `/health` and `/v1/capabilities`
   - record useful details in `runtime_health_checks`

3. Decide and implement the smallest correct connector-start surface:
   - Either native Manager tool access from Hermes (MCP/native tool wrapper, not just markdown instructions),
     or a direct owner Work Surface "Connect Gmail" action,
     or both.
   - For the MVP test loop, it is acceptable to add a clear direct Work Surface connector button so the owner can
     start Gmail OAuth without relying on the model to discover HTTP tool-calling from markdown.
   - Preserve Realness Rules: creating an OAuth URL is not Gmail provider acceptance. Connected Gmail still requires
     real OAuth callback/token/watch proof.

4. Improve browser/headed testing:
   - add a headed Playwright flow that opens `/agent/<employeeId>`, captures screenshot/video/console/network logs,
     drives "connect Gmail" behavior, and asserts either a consent URL was opened or a visible connector card appears.
   - keep bypass scripts for core/runtime tests, but make browser tests verify UI state, not just "Employee:" text.

5. If you test through chat again, do not trust text claims. Assert DB/tool state after every significant agent reply.
   If the employee says "Connecting Gmail now", immediately check for `tool_invocations.tool_name='connect_email'`
   and `connector_accounts.status='pending_oauth'`.

Do not claim runtime-accepted or provider-accepted unless you have real proof ids/transcripts. The bridge can prove
shape and feedback, not Gmail provider acceptance.
```

## Notes from this forensic pass

- The failure is actionable: the product let the employee speak as if a connector action happened when no Manager
  action occurred. This is exactly what live-feedback testing is for.
- The fastest next win is observability: make the local suite show "chat-only hallucinated action" in one command.
- The second win is product surface: an owner-visible connector setup path should not depend entirely on a language
  model deciding to manually POST a documented HTTP endpoint.
