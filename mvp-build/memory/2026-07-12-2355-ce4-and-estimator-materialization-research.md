# CE-4 connector/operator policy + estimator materialization research

Date: 2026-07-12 23:55 EDT
Status: source-wired; live Hermes/direct-MCP/runtime/provider proof still pending
Scope: finished CE-4 and wrote the conversational website estimator materialization research doc

## What changed

- Finished CE-4 connector/custody source wiring:
  - `packages/shared/src/connector-registry.ts` is the declarative metadata/custody source. Custody is derived from `writes` / `money` / `customer_facing`; read-only goes `direct_mcp`, everything else stays `manager_mediated`.
  - `apps/manager/src/lib/capability-registry.ts` now routes connector-backed tool status by connector category/metadata instead of tool-name substring branches, and projects direct read-only MCP connector nodes generically.
  - `apps/manager/src/lib/employee-stream.ts` uses the same custody registry for Connected-surface copy, so read-only direct MCP is described as directly queryable while custom write-risk systems stay Manager-mediated.
  - `apps/manager/src/lib/profile-renderer.ts` renders `direct_mcp_connectors` into `config.yaml` only after `renderableDirectMcpConnectors` filters them. Write/money/customer-facing direct-MCP requests are dropped.
- Added the operator/business policy seam:
  - `ContextPolicy` / `resolveContextPolicy` live in the shared connector registry module.
  - `buildAgentContext` accepts an optional policy emphasis line and always states custody framing.
  - `rotateSessionIfNeeded` accepts an optional `rotate_ratio` override; absent means the existing CE-3 default.
- Added focused CE-4 tests:
  - connector registry custody/default-deny/read-only direct MCP filtering;
  - profile renderer direct-MCP allow/refuse behavior;
  - direct read-only connector capability projection;
  - Connected-surface direct-vs-Manager copy;
  - policy-varied primer/rotation seam.
- Fixed the pre-existing full-suite `gmail-pubsub.test.ts` flake by giving the full-app dynamic-import route test a 15s timeout. The test already passed alone; under the whole parallel suite it could exceed Vitest's 5s default before assertions.
- Wrote `second-half-plan/estimator-product-limits-research.md`: a source-cited research doc for the conversational website estimator materialization. Core verdict: current AMTECH can support the local probe with a small visitor-session adapter; the reusable pieces exist, while visitor-session isolation and deterministic HTML-to-PDF are the two main missing primitives.
- Updated `mvp-build/CODEGRAPH.md`, `second-half-plan/context-engineering/README.md`, and the CE-4 phase doc.

## Why

CE-4's job was not to build roles or a new connector platform. It was to make the capability/custody layer data-driven enough that a read-only MCP source can become direct-MCP without weakening the Manager approval gate for money, write, or customer-facing actions.

The estimator research reframed the "form" correctly: the form is the conversation. The probe is about whether one generated AMTECH/Hermes employee can materialize as a website estimator chat, not about a separate form builder.

## Current status

- CE-1/CE-2/CE-3/CE-4 are `source-wired`.
- Migrations `0029`/`0030` remain the only CE migrations applied+verified live from the prior CE-2/CE-3 work.
- Live Hermes hook/compression/rotation behavior, reprovisioning existing employees, and live direct-MCP connector proof remain `pending`.
- Estimator materialization is research/plan-only; no local website/API/runtime proof was claimed in this pass.

## Files / seams touched

Representative files:

- `packages/shared/src/connector-registry.ts`
- `apps/manager/src/lib/capability-registry.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/agent-context.ts`
- `apps/manager/src/lib/session-rotation.ts`
- `packages/agent-template/config.yaml`
- `second-half-plan/estimator-product-limits-research.md`

Tests touched:

- `tests/unit/connector-registry.test.ts`
- `tests/unit/ce4-operator-policy.test.ts`
- `tests/unit/runtime-backend.test.ts`
- `tests/unit/materialization.test.ts`
- `tests/unit/employee-stream.test.ts`
- `tests/unit/gmail-pubsub.test.ts`

## Carry-forward / next

- Do not claim live direct-MCP connector support until an actual read-only MCP connector is rendered into a profile and proven in a running Hermes employee.
- The estimator probe's next build step is a local visitor-session adapter: one generated estimator employee, many visitor transcript ids, a local multimodal chat page, artifact-backed image references, and estimate artifact HTML/PDF output.
- The visitor-session primitive should not be confused with owner sessions. Today's owner web/SMS paths are account-owner authenticated and per-employee serialized; the website estimator needs separate anonymous visitor conversation scope.
- PDF remains a materialization gap: HTML fallback exists today; stored PDF exists today; deterministic HTML-to-PDF is not yet Manager-owned.

## Verification

Focused CE-4 run:

- `npm run test:unit -- connector-registry ce4-operator-policy runtime-backend profile-renderer-security materialization employee-stream agent-context session-rotation`
- Result: 9 files / 65 tests passed.

Full baseline:

- `npm run typecheck && npm run test:unit && npm run build && npm run lint && npm run plugins:test`
- Result: passed.
- Unit proof: 89 files / 558 tests passed.
- Plugin proof: 10/10 `amtech-hygiene` tests passed.
