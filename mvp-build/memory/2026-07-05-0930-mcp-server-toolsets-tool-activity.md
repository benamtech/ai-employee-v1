# 2026-07-05 09:30 — Manager-as-MCP-server + Hermes toolset enablement + ToolActivityDescriptor spike

Status: source-wired (live employee proofs pending a funded model key + Docker/Hermes host)
Author: Opus 4.8 session
Branch: `worktree-mcp-server-toolsets-descriptor` (off `main`) — PR pending.
Plan: `/home/georgej/.claude/plans/figure-out-the-best-serialized-stardust.md`
Prompted by: `2026-07-05-0140-tool-availability-and-materialization-direction.md` (on the codex branch).

## The decision (founder sign-off this session)

Two problems, one architecture:
1. **Verified toolset bug** — provisioned employees fell back to Hermes's tiny default
   (`terminal/file/web`) because the rendered `config.yaml` had no `platform_toolsets.api_server`
   block. Verified in installed source: `~/.hermes/hermes-agent/tools/delegate_tool.py:616`
   (`DEFAULT_TOOLSETS`), `gateway/platforms/api_server.py:1241,1328` (resolves from
   `platform_toolsets.api_server`).
2. **Rendering ceiling** — the Work Surface only renders a few hand-coded `DeliverableType` cards;
   no way to surface an arbitrary tool without bespoke React. Root cause: the tool surface had **no
   runtime JSON Schema** (`tool-contracts.ts` is TS interfaces, erased at runtime).

Founder chose **Manager-as-MCP-server NOW** (I'd recommended deferring the transport; overruled — and
it's the better call given Hermes speaks MCP natively). Fresh branch off `main`; scope **through the
descriptor spike**. Reference UIs studied (`pyrate-llama/hermes-ui`, `EKKOLearnAI/hermes-studio`) are
bespoke-per-type operator consoles; neither uses MCP-UI nor degrades across surfaces — our edge is
zero-bespoke schema-driven materialization + multi-surface degradation + risk-structural gate, for a
non-technical owner.

## What was built (all source-wired, 50 unit files / 283 tests, typecheck/lint/build green)

- **Step 1 — toolset enablement.** `packages/shared/src/platform-toolsets.ts` = the safe-set policy
  (base: web/search/file/skills/todo/memory/session_search; `terminal` only when backend != local;
  `browser`/`vision`/`image_gen`/`tts` only when their provider key is present; `cronjob`/`skills_hub`
  deliberately OFF pending live `/v1/toolsets` proof). Rendered via a new `{{PLATFORM_TOOLSETS}}` token
  in `profile-renderer.ts` into `config.yaml`. `getToolsets()` added to `hermes-client.ts`;
  `infra/scripts/local/inspect.mjs` + `npm run local:inspect` print `/health` + `/v1/capabilities` +
  `/v1/toolsets`. Fixed the stale `.env.tpl` "config.yaml is ignored" note (it's wrong for api_server).
- **Step 2 — schema-first contract.** `packages/shared/src/tool-schemas.ts` = runtime zod schemas
  keyed by `ToolName` (money/customer-facing + approvals + identity/provisioning + spike tools first;
  permissive `.passthrough()` fallback for the long tail). `apps/manager/src/lib/run-tool.ts`
  (`runManagerTool`) is the ONE dispatch path — validates input, blocks scheduler-only tools, reuses the
  existing registry handlers/gates/audit. HTTP `/manager/tools/:name` now routes through it.
- **Step 3 — Manager-as-MCP-server.** `apps/manager/src/lib/mcp-server.ts` — `@modelcontextprotocol/sdk`
  low-level `Server` + `WebStandardStreamableHTTPServerTransport` (stateless, `enableJsonResponse`),
  mounted at `POST/GET/DELETE /manager/mcp` behind the internal-bearer gate. `tools/list` advertises
  each tool's JSON Schema (zod→`zod-to-json-schema`), hides scheduler-only tools; `tools/call`
  dispatches through `runManagerTool` and returns the envelope as `structuredContent` + owner-safe text.
  `config.yaml` now renders `mcp_servers.amtech_manager` (url `{{MANAGER_MCP_URL}}`, bearer header) —
  **enabled mcp_servers auto-attach to the api_server platform's tools** (`hermes_cli/tools_config.py:1644-1658`).
  `manager-tools.md` reduced to behavioral policy (employee calls tools natively now).
- **Step 4 — ToolActivityDescriptor spike.** `work-events.ts` additive: `tool_activity` DeliverableType,
  `ToolActivityDescriptor` carrier, `formViewFromJsonSchema()` (JSON Schema → WorkFormView), validation.
  `deliverables/index.tsx`: reusable `ViewBlock` + a `tool_activity` case rendering a form from the
  tool's schema — precedence preserved in `WorkCard` (`ui_resource` → native money/trust cards →
  generic). SMS degrades via existing `renderWorkEventSms`. `ids.ts` made isomorphic (Web Crypto, not
  `node:crypto`) so `@amtech/shared` is safe to value-import into client bundles. Spike test proves
  image_gen + session_search (native fixtures) + a real Manager tool all materialize through the SAME
  compiler with zero per-tool code.

## Key facts for the next agent

- **The `/v1/toolsets` endpoint omits MCP tools by design** (`api_server.py:1585` passes
  `include_default_mcp_servers=False`). Don't be confused when the Manager MCP tools don't show there —
  the employee still gets them at runtime. Confirm MCP separately (handshake + `tools/list`).
- **Stateless MCP is correct here**: each request gets a fresh Server+transport; the transport disables
  session gating when `sessionIdGenerator` is undefined, and `tools/list`/`tools/call` need only the
  `tools` capability (set in the constructor), not a prior `initialize`.
- **Gates are reused, not reimplemented** — they live inside the tool handlers; both HTTP and MCP go
  through `runManagerTool`, so money/customer-facing actions still hit the approval gate on either
  transport.

## Pending (Realness — NOT accepted)

- Live `/v1/toolsets` capture from a booted employee (needs Docker/Hermes host + the same funded model
  key that still gates the whole live loop — see `2026-07-04-1912` handoff).
- Live MCP handshake + `tools/list` + one gated `tools/call` against a real employee.
- The **live Hermes→Work native-schema pipeline** (Runs/SSE tool-progress → `tool_activity`
  descriptors) is the deliberate FOLLOW-ON — the spike used labeled native-schema fixtures.

## Next steps

1. Boot an employee with a funded model key → `npm run local:inspect` → capture `/v1/toolsets`.
2. MCP handshake proof against `/manager/mcp` on a live employee.
3. Build the Hermes→Work adapter (out-of-scope here) to feed live tool activity into `tool_activity`.
4. Fold this into the build-plan phases (reshape Phase 5 to include generic tool materialization; add a
   "toolset enablement + MCP transport" module). Consider proactive suggestion enrichment (Janie flow).

Records: `wiki/MVP/implementation-records/2026-07-05-mcp-server-toolsets-tool-activity-record.md`.
