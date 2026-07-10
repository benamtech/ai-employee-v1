# Agent trust-boundary hardening

Date: 2026-07-10 01:16
Status: source-wired local/static proof only
Scope: pre-tenant A1/B2/A3 hardening from `architecture-and-security-review-2026-07.md`

## What changed

- Replaced the employee-container shared Manager bearer path with scoped per-employee MCP credentials:
  - migration `packages/db/migrations/0023_agent_boundary_hardening.sql` adds Manager-only `employee_mcp_credentials`;
  - `apps/manager/src/lib/mcp-auth.ts` mints/verifies/revokes hashed `mcp_...` credentials;
  - provisioning mints one credential per employee and passes the raw token only through `ProvisionerRequest.render_secrets`.
- Removed `MANAGER_INTERNAL_TOKEN` from `packages/agent-template/.env.tpl` and from the MCP server headers in `config.yaml`; Manager now derives MCP identity from the credential row, not `X-AMTECH-*` headers.
- Split `/manager/mcp` auth from `denyInternal`: MCP accepts only scoped employee credentials; the global internal bearer remains for non-employee control-plane routes and is rejected by `/manager/mcp`.
- Blocked employee self-resolution of high-risk approvals in `estimate.stub.ts`; owner signed-preview/web paths still resolve as actor `owner`.
- Added immediate Docker launch hardening in `infra/scripts/local/start-hermes-container.sh`: capability drop, no-new-privileges, PID/memory/CPU limits with env overrides.

## Why

The architecture/security review identified A1 as the pre-tenant critical issue: the most-exposed component, a prompt-injectable agent with terminal access, held the global Manager bearer. This pass makes a leaked employee credential tenant/employee-scoped and removes the ability for the employee to satisfy high-risk approval gates by itself.

## Current status

`source-wired`. Do not claim provider/runtime acceptance from this pass.

Live gaps still open:

- Apply migration `0023` to live Supabase and run advisor/privilege checks.
- Reprovision at least one employee and prove Hermes executes MCP tools using a scoped `mcp_...` token.
- Run an in-container exfiltration probe proving `MANAGER_INTERNAL_TOKEN` is absent from rendered profile env/config.
- Implement the separate egress-control requirement before any real tenant; Docker hardening alone does not break the lethal-trifecta external-communication leg.

## Files / seams touched

- DB/auth: `0023_agent_boundary_hardening.sql`, `mcp-auth.ts`, `server.ts`.
- Provision/render: `profile-package.ts`, `profile-renderer.ts`, `provisioning.stub.ts`, agent template `.env.tpl`/`config.yaml`.
- Approval gate: `estimate.stub.ts`.
- Runtime hardening: `start-hermes-container.sh`.
- Tests: `mcp-auth`, `mcp-route-auth`, `profile-renderer-security`, `estimate-tools`, `forged-requests`, `runtime-backend`, `hermes-container-script`.

## Carry-forward / next

1. Apply `0023` live and run Supabase advisors/privilege checks.
2. Reprovision a fresh employee; old rendered profiles still contain the legacy token until replaced.
3. Close the real Hermes tool-execution gate with the scoped credential path.
4. Add deny-by-default egress or an allowlisted proxy before any real tenant.

## Verification

- `npm run typecheck` — passed.
- `npm run test:unit` — passed, 65 files / 383 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run test:integration` — ran; 5 integration files / 10 tests skipped by env gates.
