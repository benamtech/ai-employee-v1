# Owner resource safety + xAI runtime proof

Date: 2026-07-16 08:12 EDT
Status: source-wired; live core rebuilt; current employee provider-backed web turn accepted
Scope: Hermes xAI custom provider rendering, owner resource payload safety, web heartbeat/resource polling, and live normal employee proof

## What changed

- Fixed owner resource projection in `apps/manager/src/lib/employee-stream.ts`.
  - Browser snapshots now project capabilities from owner-safe abilities/connectors/runtime/policy nodes instead of exposing raw `manager_tool:*` nodes.
  - Work event rows are explicitly shaped as `WorkEventRow` instead of spreading raw `inbound_events`, preventing `normalized_payload` leaks.
  - Tool activity deliverables are downgraded to owner-safe recommendations, keeping only approved business refs and dropping tool carriers, input schemas, and compiled `ui_resource`.
  - Surface envelopes redact Manager MCP trust details.
- Fixed web resource refresh behavior in `apps/web/app/agent/[employeeId]/AgentClient.tsx`.
  - Removed unconditional 20s full `/resources` polling from the SSE effect.
  - Heartbeat remains presence-only; initial load, SSE snapshots/deltas, and explicit send/approval refreshes remain.
- Fixed Hermes xAI/OpenAI-compatible rendering.
  - Earlier commit `f281579` rendered Docker runtime URLs, self-healed stale localhost runtime endpoints, and mapped `HERMES_MODEL_PROVIDER=openai_compatible` to Hermes `custom` with `base_url: https://api.x.ai/v1`.
  - Follow-up commit `f1a30d3` renders `model.api_key` into `config.yaml`; Hermes supervised gateway did not inherit `/opt/data/.env` for the provider call, even though Manager and the file had the same valid xAI key.
- Added regression coverage.
  - `tests/unit/employee-stream.test.ts` asserts the full serialized owner snapshot contains no `create_account`, `provision_employee`, `manager_tool:`, `manager_mcp`, `input_schema`, raw tool `input`, `ui_resource`, or owner email from a tool payload.
  - `tests/unit/runtime-backend.test.ts` asserts the xAI custom-provider model block includes `api_key`.

## Why

The owner browser resource payload was exposing Manager account/MCP/tool internals that are not part of the public interaction contract. The browser should see business abilities, connection state, work objects, approvals, proof, and safe summaries, not internal tool names or schemas.

The web client was also fetching full resources on a timer while heartbeat was running, making heartbeats appear to trigger full resource payloads. SSE already carries snapshots and deltas; heartbeat should only stamp presence.

The live employee bad gateway after the provider/base URL fixes was not a bad model (`grok-4.3` is valid) and not a bad xAI key. Direct Manager-container probes to xAI `/v1/models` and `/v1/chat/completions` succeeded with the configured key/model. Hermes failed because the custom provider key was only in `.env`, while the supervised gateway provider call required the key in the model config.

## Current status

- Source status: `source-wired`.
- Live core status: rebuilt and healthy from commit `f281579` using:
  - `infra/proofs/prod-like-normal-up-2026-07-16T12-03-48-303Z.json`
- Follow-up source status: commit `f1a30d3` is committed after the rebuild. Rebuild before provisioning the next employee so future rendered profiles include `model.api_key` without manual patching.
- Current employee runtime status:
  - `emp_lzh98ecdp30jjfknz33j7j`
  - container `amtech-hermes-emp_lzh98ecdp30jjfknz33j7j`
  - port `127.0.0.1:8975`
  - live `config.yaml` manually patched with `model.api_key` and container restarted.
- Provider-backed proof:
  - Direct Manager message returned HTTP 200.
  - `turn_job_id`: `turn_4hoq2m3kuu3fz3bkjf2ff7`
  - reply: `Yes, I can see the owner web message.`
- Owner resource safety proof:
  - Direct Manager resources request returned HTTP 200.
  - Serialized payload length: `16203`.
  - Forbidden strings found: `[]`.

## Files / seams touched

- `apps/manager/src/lib/employee-stream.ts`
- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/provisioner.ts`
- `tests/unit/employee-stream.test.ts`
- `tests/unit/runtime-backend.test.ts`
- `tests/unit/provisioner-options.test.ts`
- `tests/unit/hermes-client.test.ts`

Seams:

- Manager read model -> owner browser resource contract.
- Inbound work event descriptors -> materialized work surface.
- Web heartbeat/SSE/resource refresh behavior.
- Profile render -> Hermes custom provider config.
- Manager runtime endpoint -> Hermes API server -> xAI provider.

## Carry-forward / next

1. Rebuild/restart the production-like stack again before creating another employee so commit `f1a30d3` is live in Manager.
2. Continue the public onboarding acceptance path from the live browser:
   - verify the web UI no longer receives full `/resources` payloads after heartbeat-only requests;
   - send an owner web message through the browser surface and confirm it returns instead of bad gateway;
   - capture browser/network proof if needed.
3. Continue modifiers:
   - create a second employee under `acct_sao3tojdjw3gz9d1jqpp9r`;
   - create another close-to-prod account with the founder phone after real Verify;
   - verify SMS webhook routing remains employee-specific.
4. Investigate Hermes MCP reconnect warnings separately if tool-call proof is required next. The provider-backed chat turn is accepted, but logs still showed `amtech_manager` MCP reconnect failures during startup.

## Verification

Passed:

```bash
npm run test:unit -- tests/unit/employee-stream.test.ts tests/unit/runtime-backend.test.ts tests/unit/provisioner-options.test.ts tests/unit/hermes-client.test.ts
npm run typecheck --workspace @amtech/manager
npm run typecheck --workspace @amtech/web
npm run prod-like:normal:up -- --down-first --require-tunnel
curl -sS http://127.0.0.1:8080/health
curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee
docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Live proof:

```text
Manager health: {"status":"ok","tools":65,"expected":65}
Public route: HTTP/2 200, server cloudflare, via 1.1 Caddy
Direct message: HTTP 200, turn_4hoq2m3kuu3fz3bkjf2ff7
Resource leak check: HTTP 200, forbidden []
```

