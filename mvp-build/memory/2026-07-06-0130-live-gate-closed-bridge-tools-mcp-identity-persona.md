# 2026-07-06 01:30 — Live gate CLOSED: employee calls Manager tools end-to-end (+ bridge tool-forwarding, MCP identity injection, persona un-gating)

Status: runtime-accepted (local, you-are-the-LLM bridge) — a reprovisioned employee calls
`create_estimate_artifact` and a real artifact is created. Not committed.

Follow-up to [[2026-07-06-0010-container-manager-networking-and-terminal-backend-fix]]. That fix
(MCP url -> host.docker.internal, terminal.backend -> local) landed; this session ran the live gate,
which surfaced THREE more real gaps that all had to be fixed before an employee could actually use a
tool. All now fixed and verified live.

## The live run (newest employee emp_awzfhrurbacb1w4rf4cxqz, Ferraro landscaping)
- Container logs: `MCP: registered 42 tool(s) from 1 server(s)` (was 0) — networking fix confirmed.
- Owner turn "create an estimate ... just build it" -> `audit_log`:
  `actor=employee  tool:create_estimate_artifact  art_qcvy7g8m00ck1gugg34mld  [ok]`. The model
  genuinely called the Manager tool and created a real estimate artifact.
- Direct MCP proof (no model): POST /manager/mcp tools/call create_estimate_artifact with identity
  ONLY in headers (no ids in args) -> `status:ok`, artifact `art_jx7u55...`, ids injected from headers.

## GOTCHA that cost me an hour — check the RIGHT table
`tool_invocations` records **owner_chat_turn** rows (the turn envelope), NOT Manager tool calls.
Manager tool calls (create_estimate_artifact, etc.) are recorded in **`audit_log`** as
`actor=employee tool:<name> <resource> [ok]`. I repeatedly misread "only owner_chat_turn in
tool_invocations" as "the model never called a tool" — it HAD. Always verify employee tool calls in
`audit_log`, not `tool_invocations`. Also: psql is NOT installed on this box; query via `node -e` + pg.

## The three additional fixes (all required for a usable tool loop)
1. **Model bridge dropped `tools`.** `infra/scripts/local/model-bridge-lib.mjs` `buildWorkerPrompt`
   serialized only messages + response_format — the OpenAI `tools` array (Hermes's 42 tool defs) was
   never shown to the warm-Haiku worker, so it structurally COULD NOT emit a tool call (every turn
   `tool_turns=0`). Now it lists the offered tools + teaches the exact `{"tool_calls":[{... "arguments":
   "<json string>"}]}` protocol (the bridge's return path already set `finish_reason:"tool_calls"` and
   parses it via `toMessage`), honors `tool_choice` (forced fn / required / none), and surfaces prior
   `tool_calls` so it can chain. After this, `tool_turns` went 0 -> 1 and real tool calls fired.
   Restart the WORKER (`local:model-bridge-worker`) to pick up lib changes.
2. **MCP server didn't bind employee identity.** `apps/manager/src/lib/mcp-server.ts` passed the model's
   args straight to `runManagerTool` — the shared internal bearer can't say WHICH employee is calling,
   so `account_id`/`employee_id` (required ownerCtx) had to come from the model, which doesn't know
   them (it asked the owner!). Fix = bind identity to the employee's baked MCP config: renderer emits
   `X-AMTECH-Account-Id`/`X-AMTECH-Employee-Id` headers in `mcp_servers.amtech_manager.headers`
   (config.yaml); `/manager/mcp` route reads them; `buildManagerMcpServer(identity)` injects/overrides
   them into every call; and `inputSchemaFor` STRIPS those two fields from the advertised schema so the
   model never sees or supplies them. Model-controlled args can't spoof identity (headers are
   render-time). Removed the now-wrong "pass your identity" section from
   `workspace/manager-tools.md` ("your identity is automatic").
3. **Persona baked in refusals.** Per founder ("let the agent and the model breathe"), softened
   `SOUL.md` (dropped "not a chatbot/not a writing assistant"; added "Default to helping … don't police
   scope … decline only when genuinely unsafe/impossible") and `workspace/AGENTS.md` (assume+flag
   missing info, don't gatekeep). The money/outbound **confirmation gate is intentionally kept** — it's
   confirm-and-proceed, not a refusal. See parent-repo memory `let-the-agent-and-model-breathe`.

## Local-model caveat (matters for UI testing)
The local "LLM" is ONE warm Claude Code **Haiku** via the you-are-the-LLM bridge. It now DOES call
tools, but is inconsistent at completing multi-step chains (estimate -> render pdf -> signed link) and
occasionally needs a nudge ("use the create_estimate_artifact tool"). Production Opus 4.8 will be far
more reliable. MCP-UI views only render when a tool actually fires, so local UI testing may need a retry
or an explicit "use the tool" nudge.

## Ops notes learned this session
- Don't `pkill -f '<pattern>'` when the pattern also matches your own invoking shell — it SIGTERMs your
  command (exit 143/144). Kill by explicit PID (`ps -eo pid,args | grep … | awk '{print $1}'`), SIGKILL
  the tsx/npm tree if SIGTERM is swallowed.
- Never run `npm run build` while the web dev server is up: `next build` and `next dev` share
  `apps/web/.next` and `next build` corrupts it (routes-manifest.json / chunk 383.js vanish -> :3000
  500s). Recovery: kill next procs, `rm -rf apps/web/.next`, restart `web:dev` (first compile ~15s).
- Restart order after code edits: WORKER for bridge-lib; MANAGER for mcp-server/server/renderer;
  reprovision for template (config.yaml / SOUL / AGENTS / manager-tools) changes.

## Baseline
typecheck + lint green; unit **304 tests** pass (added coverage: bridge tool-protocol,
mcp-server identity injection + schema stripping, container-facing origin + terminal backend).
`npm run build` NOT clean-verifiable while web dev server runs (see ops note); web `tsc --noEmit` passes.

Related: [[2026-07-06-0010-container-manager-networking-and-terminal-backend-fix]],
[[2026-07-05-2343-manager-centrality-and-container-networking-handoff]],
[[agent-inbox-and-channel-architecture]].
