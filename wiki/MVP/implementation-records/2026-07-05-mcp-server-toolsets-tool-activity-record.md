# 2026-07-05 — Manager-as-MCP-server, Hermes toolset enablement, ToolActivityDescriptor spike

Status: source-wired (live employee proofs pending)
Branch: `worktree-mcp-server-toolsets-descriptor` (off `main`)

Factual code-state record. Narrative + decisions: `../../../mvp-build/memory/2026-07-05-0930-mcp-server-toolsets-tool-activity.md`.

## What changed

### Hermes toolset enablement (fixes a verified bug)
- Provisioned employees fell back to Hermes's default toolset (`terminal/file/web`) because the rendered
  `packages/agent-template/config.yaml` had no `platform_toolsets.api_server` block. Verified in installed
  source `~/.hermes/hermes-agent` (`tools/delegate_tool.py:616`, `gateway/platforms/api_server.py:1241,1328`).
- New `packages/shared/src/platform-toolsets.ts` — safe-set policy tied to runtime-backend blast radius +
  provider-key availability. Rendered via a new `{{PLATFORM_TOOLSETS}}` token in
  `apps/manager/src/lib/profile-renderer.ts` into `config.yaml`.
- `apps/manager/src/lib/hermes-client.ts` — `getToolsets()` (GET `/v1/toolsets`).
- `infra/scripts/local/inspect.mjs` + `npm run local:inspect` — prints `/health`, `/v1/capabilities`,
  `/v1/toolsets` for a live employee.
- `packages/agent-template/.env.tpl` — corrected the stale "config.yaml keys are ignored" note.

### Schema-first Manager tool contract
- New `packages/shared/src/tool-schemas.ts` — runtime zod schemas keyed by `ToolName` (money/customer-facing
  + approvals + identity/provisioning + spike tools; permissive passthrough fallback for the long tail).
- New `apps/manager/src/lib/run-tool.ts` (`runManagerTool`) — single dispatch path: validates input, blocks
  scheduler-only tools, reuses existing registry handlers/gates/audit. `server.ts` HTTP tool route now uses it.

### Manager-as-MCP-server
- New `apps/manager/src/lib/mcp-server.ts` — `@modelcontextprotocol/sdk` low-level `Server` +
  `WebStandardStreamableHTTPServerTransport` (stateless, `enableJsonResponse`). `tools/list` advertises each
  tool's JSON Schema (zod → `zod-to-json-schema`), hides scheduler-only tools; `tools/call` dispatches through
  `runManagerTool`, returns the envelope as `structuredContent` + owner-safe text.
- `server.ts` — `POST/GET/DELETE /manager/mcp` behind the internal-bearer gate.
- `config.yaml` — renders `mcp_servers.amtech_manager` (url `{{MANAGER_MCP_URL}}`, bearer header). Enabled
  mcp_servers auto-attach to the api_server platform (`hermes_cli/tools_config.py:1644-1658`).
- `packages/agent-template/workspace/manager-tools.md` — reduced to behavioral policy (native MCP calls now).

### ToolActivityDescriptor + generic schema renderer (spike)
- `packages/shared/src/work-events.ts` (additive) — `tool_activity` DeliverableType, `ToolActivityDescriptor`
  carrier, `formViewFromJsonSchema()` (JSON Schema → WorkFormView), validation requiring `tool.name`.
- `apps/web/app/agent/[employeeId]/components/deliverables/index.tsx` — reusable `ViewBlock` + `tool_activity`
  case (form from schema). Precedence in `WorkCard`: `ui_resource` → native cards → generic renderer. SMS
  degrades via `renderWorkEventSms`.
- `packages/shared/src/ids.ts` — isomorphic (Web Crypto, not `node:crypto`) so `@amtech/shared` is safe to
  value-import into client bundles.

## Local verification (passed)
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run build` — pass (Next.js compiled).
- `npm run test:unit` — **50 files / 283 tests pass** (new: platform-toolsets, run-tool, mcp-server,
  tool-activity). `npm run test:integration` — 5 files / 10 tests skip cleanly (env-gated).
- Rendered `config.yaml` (tokens substituted) parses as valid YAML: `platform_toolsets.api_server` is a list;
  `mcp_servers.amtech_manager` carries url + bearer header.

## Not accepted (Realness — pending)
- Live `/v1/toolsets` capture from a booted employee (needs Docker/Hermes host + a funded model key).
- Live MCP handshake + `tools/list` + one gated `tools/call` against a real employee.
- Live Hermes→Work native-schema pipeline (Runs/SSE tool-progress → `tool_activity`) — deliberate follow-on;
  the spike used labeled native-schema fixtures.

## Inheritance for the next phase
- Fold into build-plan phases: reshape Phase 5 to include generic tool materialization; add a "toolset
  enablement + MCP transport" module. Then the Hermes→Work adapter and proactive suggestion enrichment.
