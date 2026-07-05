# Handoff — Connector actions as first-class event-surface work + local observability

Date: 2026-07-05 01:01
Status: source-wired; live runtime/provider proof pending
Branch: `worktree-hermes-alignment-corrections` (worktree of the all-inclusive repo, origin
`github.com/benamtech/ai-employee-v1`)
Plan: `/home/georgej/.claude/plans/get-oriented-but-don-t-sleepy-perlis.md`

## Why (the failure this fixes)

A live local test exposed a real defect: an owner said "connect my gmail," the employee **said** it
was connecting ("Connecting Gmail now...") while nothing happened — `tool_turns=0`, empty
`connector_accounts`, no `connect_email` `tool_invocation`. Two independent root causes plus an
observability gap that let the hallucination pass as success:

1. The employee had **no reliable way to start a connector** — no native/MCP tool bridge (Hermes can
   only reach Manager tools by composing raw curl via its terminal backend), and `connect_email` was
   never even named in the agent template. Owner turns injected **no system prompt and no tools**.
2. Even a successful start was **invisible** — `connect_email` writes `pending_oauth` and returns
   `proof.consent_url`, and the OAuth callback completes server-side, but `consent_url` lived only in
   the tool envelope and connectors rendered as faint footer text (no card, no link).
3. **No observability** could catch a chat-only hallucinated action.

## What changed (all source-wired, local gates green)

Design constraint from the founder: build it through the **event surface + typed interaction
standards first**, general across all connectors — then the button/MCP scaffold on top. Done that way.

- **Part A — connector lifecycle as a typed work event.** New `apps/manager/src/lib/connector-events.ts`
  (`buildConnectorDescriptor`/`emitConnectorEvent`): authors an `external_system_action`
  `WorkEventDescriptor` (refs `{connector_id, provider, status, consent_url?}`, ungated `acknowledge`)
  and delivers it through the **internal door** (`deliverEmployeeEvent`, actor `manager`,
  `deliver_only`). `connect_email` emits `pending_oauth`; `complete_gmail_oauth` emits `connected`
  (the only point allowed to imply connected). Best-effort — never breaks the connector action.
  Renders on web (WorkCard) AND SMS (`renderWorkEventSms`) from one descriptor. Reusable by every
  connector. Documented the convention in `packages/shared/src/work-events.ts`.
- **Part B — the card renders.** `apps/web/.../components/deliverables/index.tsx` gained a real
  `external_system_action` case (was a dead generic block): status chip + a **Connect** link when
  `refs.consent_url` is present and pending. Emoji-free (existing emoji `ICONS` map left as-is, flagged).
- **Part C — two start paths.**
  - C1 (reliable, model-independent): new web route
    `apps/web/app/api/employee/[employeeId]/connector/start/route.ts` + a "Connect Gmail" affordance in
    `AgentClient.tsx` (`startConnector`) that calls `connect_email` and opens the consent URL.
  - C2 (employee-initiated awareness): new `apps/manager/src/lib/owner-turn-prompt.ts`
    (`ownerTurnSystemPrompt`) threaded as `system_message` via `runtime.ts` → `executeHermesTurn`;
    `connect_email` documented in `packages/agent-template/workspace/manager-tools.md`, `AGENTS.md`,
    and a realness note in `SOUL.md`.
- **Part D — observability.** New `npm run local:inspect` (`infra/scripts/local/inspect.mjs`):
  reconciles state-file vs newest-DB vs running-container employee, hits runtime `/health`+
  `/v1/capabilities` with the **sealed bearer** (unseal replicated from `secrets.ts`; never printed),
  dumps recent messages/turns/runs/tools/connectors/events, and prints the load-bearing warning
  **"employee claimed connector work but no connect_email invocation exists."** Fixed
  `infra/scripts/healthcheck.mjs` (was GETing the base URL → false "webchat unreachable"; now
  `/health`+`/v1/capabilities` with bearer, plain-text markers). `onboard.mjs` writes
  `infra/.local/state.json` (gitignored). Env-gated headed Playwright spec
  `tests/e2e/connector.spec.ts` + `playwright.config.ts` (asserts UI/DB state; needs `npm i` + live
  stack).

## MCP finding (the honest native path, deferred with the reason)

Hermes **does** support mounting MCP servers: CLI + ACP adapter read `config.get("mcp_servers")`, there
is `mcp_serve.py`/`discover_mcp_tools`, and the API server initializes the agent with an
`include_default_mcp_servers` flag (`~/.hermes/hermes-agent/gateway/platforms/api_server.py:1585`). So
the correct native/"MCP-app" path is a Manager MCP server exposing `connector.start` (proxying
`connect_email`), listed in the profile's `mcp_servers`. Deferred this pass because wiring it + proving
the API-server honors a **profile's** `mcp_servers` (the template's `.env.tpl` warns "config.yaml keys
are ignored") needs a **live runtime** — it can't be source-proven now, and faking it would violate the
Realness Rule. C1 gives a working, demoable loop today.

## Realness / status

- Everything is `source-wired`. Emitting a consent link is **not** provider acceptance; only the real
  OAuth callback flips `connected`. Provider/runtime acceptance remains `pending` (no live proof ids).
- Known edge (pre-existing, noted not fixed): `connect_email` writes the `pending_oauth` row **before**
  building the consent URL, so if `GOOGLE_OAUTH_CLIENT_ID` is unset it leaves a pending row + returns
  failed and emits no event. The local loop needs `GOOGLE_OAUTH_CLIENT_ID` for a real consent URL.

## Carry-forward / next

- Build the Manager MCP `connector.start` server + wire a profile `mcp_servers` entry; verify the API
  server honors it against a live Hermes; then the employee can start connectors inside the session.
- Run the live loop: `npm run local:onboard` → `npm run local:inspect` → click Connect Gmail → inspect
  again (expect `pending_oauth` row + `connect_email` tool_invocation); reproduce the chat-only case to
  see the warning fire. Capture proof ids before any `provider-accepted`/`runtime-accepted` claim.
- The broader "proactive Hermes-desktop / frontloaded first-conversation harness" is the next pass;
  Parts A–C move the surface toward first-class live session activity as the foundation.

## Verification (this session)

- `npm run typecheck` — pass (all 4 workspaces incl. web TSX).
- `npm run test:unit` — pass, **39 files / 233 tests** (+4 `tests/unit/connector-events.test.ts`).
- `npm run lint` — pass. `npm run build` — pass (new `/api/employee/[employeeId]/connector/start` route
  registered).
- `.mjs` scripts parse; `local:inspect` guard behaves without creds.
- Live end-to-end (still `pending`): needs the running stack + `GOOGLE_OAUTH_CLIENT_ID`.
