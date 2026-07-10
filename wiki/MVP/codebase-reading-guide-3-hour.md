# AMTECH AI Employee Codebase Reading Guide (3 Hours)

Status: active
Audience: junior developer onboarding to the AMTECH AI Employee MVP
Goal: understand the product, codebase, customer journey, security model, and the research behind the architecture well enough to make safe changes.

This guide assumes you have about 3 hours total, including the referenced files. Do not try to read every line of the repo. Read the files below in order and use the scenarios as the map.

## 0. Mental Model First (15 Minutes)

Start with these documents before touching source:

1. [`../../identity.md`](../../identity.md)
   - Why: sets the operating voice and product standard. It explains why speed-to-revenue and trust matter more than abstract platform elegance.
2. [`../../CODEGRAPH.md`](../../CODEGRAPH.md)
   - Why: the whole workspace map. Read the canonical facts table and the MVP source-of-truth notes.
3. [`../../mvp-build/CODEGRAPH.md`](../../mvp-build/CODEGRAPH.md)
   - Why: the codebase map. Treat this as the table of contents for the implementation.
4. [`../../mvp-build/architecture-and-security-review-2026-07.md`](../../mvp-build/architecture-and-security-review-2026-07.md)
   - Why: explains the current strongest and weakest parts of the system. Pay special attention to the agent-trust boundary findings.
5. [`../../mvp-build/memory/2026-07-10-0116-agent-trust-boundary-hardening.md`](../../mvp-build/memory/2026-07-10-0116-agent-trust-boundary-hardening.md)
   - Why: latest security hardening context. It explains why scoped MCP credentials replaced the old shared Manager token.

One-sentence architecture:

The owner talks to one AI Employee; Hermes runs the employee; Manager is the invisible control plane that owns identity, tenancy, tools, approvals, provider connectors, artifacts, event routing, and materialized work surfaces.

Key invariant:

The browser and the employee should not hold global authority. The Manager does.

## 1. The Repo Shape (15 Minutes)

Read these files quickly:

- [`../../mvp-build/package.json`](../../mvp-build/package.json)
  - The workspace root. Scripts tell you how the system is verified: `typecheck`, `test:unit`, `lint`, `build`, `test:integration`, local acceptance, and live tooling.
- [`../../mvp-build/apps/manager/package.json`](../../mvp-build/apps/manager/package.json)
  - Manager dependencies: Hono, MCP SDK, MCP-UI, TypeScript.
- [`../../mvp-build/apps/web/package.json`](../../mvp-build/apps/web/package.json)
  - Web dependencies: Next.js App Router, React, shared package.
- [`../../mvp-build/packages/shared/package.json`](../../mvp-build/packages/shared/package.json)
  - Shared contracts and zod schemas.
- [`../../mvp-build/packages/db/package.json`](../../mvp-build/packages/db/package.json)
  - Supabase client and Postgres migration tooling.

Package roles:

- `apps/manager`: backend control plane. If a change affects security, provider state, tools, scheduling, or tenant data, it probably belongs here.
- `apps/web`: owner-facing browser surfaces. It should call Manager, not Supabase directly.
- `packages/shared`: contracts between web, Manager, employee tools, tests, and profile rendering.
- `packages/db`: Supabase clients and migrations. This is where schema authority lives.
- `packages/agent-template`: the Hermes profile package rendered per employee.
- `infra`: local/live runtime scripts, acceptance scripts, Caddy/Hermes operational notes.
- `tests`: unit/integration/golden-path tests. Unit tests are the fastest way to learn intended behavior.

## 2. Customer Journey A: Owner Creates an Employee (30 Minutes)

Scenario: a contractor signs up, verifies phone ownership, creates an account, and provisions an AI Employee.

Read in this order:

1. [`../../mvp-build/apps/web/app/create-ai-employee/page.tsx`](../../mvp-build/apps/web/app/create-ai-employee/page.tsx)
   - Browser starting point for employee creation.
   - Look for form state, front-door API calls, and handoff to claim/provisioning.
2. [`../../mvp-build/apps/web/app/api/front-door/message/route.ts`](../../mvp-build/apps/web/app/api/front-door/message/route.ts)
   - Web proxy from browser to Manager.
   - Pattern to notice: browser calls Next.js route; Next.js route calls Manager with internal auth.
3. [`../../mvp-build/apps/manager/src/orchestrator.ts`](../../mvp-build/apps/manager/src/orchestrator.ts)
   - Front-door onboarding conversation and structured manifest extraction.
   - This is the "sales/onboarding agent" boundary, not the long-lived employee runtime.
4. [`../../mvp-build/packages/shared/src/manifest.ts`](../../mvp-build/packages/shared/src/manifest.ts)
   - Seven-question manifest contract. The manifest becomes provisioning input.
5. [`../../mvp-build/apps/manager/src/tools/identity.stub.ts`](../../mvp-build/apps/manager/src/tools/identity.stub.ts)
   - Phone verification, claim tokens, account creation.
   - Important security idea: phone ownership and claim links are signed/proven, not trusted from user text.
6. [`../../mvp-build/apps/manager/src/tools/provisioning.stub.ts`](../../mvp-build/apps/manager/src/tools/provisioning.stub.ts)
   - Creates `employees`, profile build rows, runtime endpoints, runtime secrets, and scoped MCP credentials.
   - After the recent hardening, provisioning mints a per-employee MCP token. The raw token is render-only.
7. [`../../mvp-build/apps/manager/src/provisioner.ts`](../../mvp-build/apps/manager/src/provisioner.ts)
   - Protected route that renders and starts a profile package.
8. [`../../mvp-build/apps/manager/src/lib/profile-renderer.ts`](../../mvp-build/apps/manager/src/lib/profile-renderer.ts)
   - Replaces template tokens in the Hermes profile package.
   - Important: `render_secrets.manager_mcp_token` is used for `config.yaml`, but not persisted in `profile-build-params.json`.
9. [`../../mvp-build/packages/agent-template/config.yaml`](../../mvp-build/packages/agent-template/config.yaml)
   - What Hermes sees: model config, terminal backend, enabled toolsets, and Manager MCP server.
10. [`../../mvp-build/packages/agent-template/.env.tpl`](../../mvp-build/packages/agent-template/.env.tpl)
   - What becomes the employee container `.env`.
   - Check that the global `MANAGER_INTERNAL_TOKEN` is not here.
11. [`../../mvp-build/infra/scripts/local/start-hermes-container.sh`](../../mvp-build/infra/scripts/local/start-hermes-container.sh)
   - How the employee container starts locally.
   - Notice container hardening: capability drop, no-new-privileges, PID/memory/CPU limits.

Tests to read:

- [`../../mvp-build/tests/unit/profile-renderer-security.test.ts`](../../mvp-build/tests/unit/profile-renderer-security.test.ts)
- [`../../mvp-build/tests/unit/runtime-backend.test.ts`](../../mvp-build/tests/unit/runtime-backend.test.ts)
- [`../../mvp-build/tests/unit/hermes-container-script.test.ts`](../../mvp-build/tests/unit/hermes-container-script.test.ts)

What you should understand after this section:

- How an owner-facing onboarding flow becomes a durable employee.
- Why the profile renderer is security-sensitive.
- Why raw secrets must not leak into persisted profile build params.
- Why "Docker backend" and "Hermes terminal backend" are different concepts.

## 3. Customer Journey B: Owner Chats With the Employee (25 Minutes)

Scenario: owner opens the Work Surface and sends a web chat message asking for an estimate.

Read in this order:

1. [Agent page route](../../mvp-build/apps/web/app/agent/%5BemployeeId%5D/page.tsx)
   - Server route for the employee desk.
2. [AgentClient Work Surface](../../mvp-build/apps/web/app/agent/%5BemployeeId%5D/AgentClient.tsx)
   - Main owner Work Surface client.
   - Follow `refresh`, SSE connection, `sendToEmployee`, and `resolveApproval`.
3. [Employee resources route](../../mvp-build/apps/web/app/api/employee/%5BemployeeId%5D/resources/route.ts)
   - Browser-to-Manager snapshot proxy.
4. [Employee message route](../../mvp-build/apps/web/app/api/employee/%5BemployeeId%5D/message/route.ts)
   - Browser-to-Manager owner message proxy.
5. [`../../mvp-build/apps/manager/src/server.ts`](../../mvp-build/apps/manager/src/server.ts)
   - Read these route groups:
     - `/manager/employee/:employeeId/message`
     - `/manager/employee/:employeeId/resources`
     - `/manager/employee/:employeeId/events`
     - `/manager/employee/:employeeId/heartbeat`
6. [`../../mvp-build/apps/manager/src/lib/owner-session.ts`](../../mvp-build/apps/manager/src/lib/owner-session.ts)
   - Owner session validation. This is separate from employee MCP auth.
7. [`../../mvp-build/apps/manager/src/lib/runtime.ts`](../../mvp-build/apps/manager/src/lib/runtime.ts)
   - Compatibility wrapper around queued owner turns and Hermes execution.
8. [`../../mvp-build/apps/manager/src/lib/turn-queue.ts`](../../mvp-build/apps/manager/src/lib/turn-queue.ts)
   - DB-backed turn serialization. This prevents multiple workers from racing one employee brain.
9. [`../../mvp-build/apps/manager/src/lib/hermes-client.ts`](../../mvp-build/apps/manager/src/lib/hermes-client.ts)
   - Real Hermes API client: capabilities, sessions/runs, polling/SSE behavior.
10. [`../../mvp-build/packages/db/migrations/0011_phase4_hermes_runtime.sql`](../../mvp-build/packages/db/migrations/0011_phase4_hermes_runtime.sql)
    - Turn queue schema and SECURITY DEFINER RPCs.

Tests to read:

- [`../../mvp-build/tests/unit/turn-queue.test.ts`](../../mvp-build/tests/unit/turn-queue.test.ts)
- [`../../mvp-build/tests/unit/hermes-client.test.ts`](../../mvp-build/tests/unit/hermes-client.test.ts)
- [`../../mvp-build/tests/unit/turn-drain.test.ts`](../../mvp-build/tests/unit/turn-drain.test.ts)

What you should understand:

- Web chat is an owner-authenticated path.
- Employee execution is serialized through the DB.
- Manager owns the durable turn queue and can recover/reap stuck turns.
- Hermes is a substrate, not AMTECH's tenancy/security boundary.

## 4. Customer Journey C: Employee Calls Manager Tools (25 Minutes)

Scenario: the employee needs to create an estimate artifact, request approval, and later send customer-facing work.

Read in this order:

1. [`../../mvp-build/packages/shared/src/tool-contracts.ts`](../../mvp-build/packages/shared/src/tool-contracts.ts)
   - Complete tool-name registry and TypeScript input contracts.
2. [`../../mvp-build/packages/shared/src/tool-schemas.ts`](../../mvp-build/packages/shared/src/tool-schemas.ts)
   - Runtime zod schemas. These power HTTP validation, MCP schemas, and generic rendering.
3. [`../../mvp-build/apps/manager/src/tools/registry.ts`](../../mvp-build/apps/manager/src/tools/registry.ts)
   - Ensures every shared tool name has a Manager handler.
4. [`../../mvp-build/apps/manager/src/lib/run-tool.ts`](../../mvp-build/apps/manager/src/lib/run-tool.ts)
   - Single dispatch path for HTTP and MCP tool calls.
5. [`../../mvp-build/apps/manager/src/lib/mcp-server.ts`](../../mvp-build/apps/manager/src/lib/mcp-server.ts)
   - Native MCP server over Manager tools and resources.
   - Key idea: schemas are advertised to the employee, but identity fields are injected server-side.
6. [`../../mvp-build/apps/manager/src/lib/mcp-auth.ts`](../../mvp-build/apps/manager/src/lib/mcp-auth.ts)
   - Scoped MCP credential mint/verify/revoke.
   - Key idea: `/manager/mcp` derives account/employee from a hashed credential row.
7. [`../../mvp-build/apps/manager/src/tools/estimate.stub.ts`](../../mvp-build/apps/manager/src/tools/estimate.stub.ts)
   - Business brain, estimate artifact, signed artifact link, approval primitive.
   - Notice the high-risk approval rule: employee can request high-risk approvals but cannot self-resolve them.
8. [`../../mvp-build/apps/manager/src/tools/gmail.stub.ts`](../../mvp-build/apps/manager/src/tools/gmail.stub.ts)
   - Gmail connector, drafts, watches, history sync, approval-gated send.
9. [`../../mvp-build/apps/manager/src/tools/stripe.stub.ts`](../../mvp-build/apps/manager/src/tools/stripe.stub.ts)
   - Stripe Connect, deposit invoice, approval-gated send.

Tests to read:

- [`../../mvp-build/tests/unit/mcp-auth.test.ts`](../../mvp-build/tests/unit/mcp-auth.test.ts)
- [`../../mvp-build/tests/unit/mcp-route-auth.test.ts`](../../mvp-build/tests/unit/mcp-route-auth.test.ts)
- [`../../mvp-build/tests/unit/mcp-server.test.ts`](../../mvp-build/tests/unit/mcp-server.test.ts)
- [`../../mvp-build/tests/unit/estimate-tools.test.ts`](../../mvp-build/tests/unit/estimate-tools.test.ts)
- [`../../mvp-build/tests/unit/gmail-send.test.ts`](../../mvp-build/tests/unit/gmail-send.test.ts)
- [`../../mvp-build/tests/unit/stripe-tools.test.ts`](../../mvp-build/tests/unit/stripe-tools.test.ts)

What you should understand:

- MCP is a transport over the same Manager tool registry, not a second implementation.
- The employee credential is scoped. It must never authorize global Manager routes.
- Approval rows are necessary but not sufficient; who resolved the approval matters.
- Money and customer-facing sends need owner-authenticated approval.

## 5. Customer Journey D: Provider Events Wake the Employee (25 Minutes)

Scenario: a customer replies to an estimate email, or Stripe sends an invoice/payment webhook.

Read in this order:

1. [`../../wiki/MVP/agent-inbox-and-channel-architecture.md`](agent-inbox-and-channel-architecture.md)
   - Product architecture for "anything becomes a message to the agent."
2. [`../../mvp-build/apps/manager/src/webhooks/twilio.ts`](../../mvp-build/apps/manager/src/webhooks/twilio.ts)
   - Inbound SMS and status callbacks.
3. [`../../mvp-build/apps/manager/src/webhooks/gmail.ts`](../../mvp-build/apps/manager/src/webhooks/gmail.ts)
   - Gmail OAuth callback and Pub/Sub push.
4. [`../../mvp-build/apps/manager/src/webhooks/stripe.ts`](../../mvp-build/apps/manager/src/webhooks/stripe.ts)
   - Stripe signed webhook boundary.
5. [`../../mvp-build/apps/manager/src/events/registry.ts`](../../mvp-build/apps/manager/src/events/registry.ts)
   - Registered external event sources.
6. [`../../mvp-build/apps/manager/src/events/ingress.ts`](../../mvp-build/apps/manager/src/events/ingress.ts)
   - Generic ingress: verify, normalize, dedupe, deliver or wake.
7. [`../../mvp-build/apps/manager/src/events/adapters/gmail.ts`](../../mvp-build/apps/manager/src/events/adapters/gmail.ts)
   - Gmail-specific safe-fact normalization.
8. [`../../mvp-build/apps/manager/src/events/adapters/stripe.ts`](../../mvp-build/apps/manager/src/events/adapters/stripe.ts)
   - Stripe-specific safe-fact normalization.
9. [`../../mvp-build/apps/manager/src/lib/employee-events.ts`](../../mvp-build/apps/manager/src/lib/employee-events.ts)
   - Central delivery primitive: dedupe, wake claim, descriptor binding, owner delivery.
10. [`../../mvp-build/apps/manager/src/lib/wake.ts`](../../mvp-build/apps/manager/src/lib/wake.ts)
    - Converts normalized events into employee reasoning and validated work descriptors.
11. [`../../mvp-build/apps/manager/src/lib/channel-router.ts`](../../mvp-build/apps/manager/src/lib/channel-router.ts)
    - Decides where the owner should see the result: web, SMS, silent record, etc.

Tests to read:

- [`../../mvp-build/tests/unit/forged-requests.test.ts`](../../mvp-build/tests/unit/forged-requests.test.ts)
- [`../../mvp-build/tests/unit/event-adapter-contract.test.ts`](../../mvp-build/tests/unit/event-adapter-contract.test.ts)
- [`../../mvp-build/tests/unit/ingress.test.ts`](../../mvp-build/tests/unit/ingress.test.ts)
- [`../../mvp-build/tests/unit/event-bus.test.ts`](../../mvp-build/tests/unit/event-bus.test.ts)
- [`../../mvp-build/tests/unit/channel-router.test.ts`](../../mvp-build/tests/unit/channel-router.test.ts)

What you should understand:

- Provider events are untrusted at the boundary.
- Signatures and OIDC checks happen before business logic.
- The system does not let provider payloads directly mutate owner-visible work without normalization and dedupe.
- The "two-door" invariant matters: external events use `ingestEvent`; internal Manager-authored events use `deliverEmployeeEvent`.

## 6. Customer Journey E: Work Materializes in Web, SMS, and Preview Links (25 Minutes)

Scenario: a draft estimate or deposit invoice becomes something the owner can inspect, approve, reject, or respond to.

Read in this order:

1. [`../../wiki/MVP/event-driven-office-and-generative-ui.md`](event-driven-office-and-generative-ui.md)
   - Why the product is not "chat only." Work becomes typed surfaces.
2. [`../../wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md)
   - Original Work Surface research note.
3. [`../../mvp-build/packages/shared/src/work-events.ts`](../../mvp-build/packages/shared/src/work-events.ts)
   - Typed `notify/question/review` descriptors and deliverable types.
4. [`../../mvp-build/packages/shared/src/preview-links.ts`](../../mvp-build/packages/shared/src/preview-links.ts)
   - Shared signed preview/action vocabulary.
5. [`../../mvp-build/packages/shared/src/resource-payload.ts`](../../mvp-build/packages/shared/src/resource-payload.ts)
   - Read model consumed by the Work Surface.
6. [`../../mvp-build/packages/shared/src/materialization.ts`](../../mvp-build/packages/shared/src/materialization.ts)
   - Phase 4 `SurfaceEnvelope`, `WorkResource`, `WorkAction`, proof/safety/render contracts.
7. [`../../mvp-build/apps/manager/src/lib/employee-stream.ts`](../../mvp-build/apps/manager/src/lib/employee-stream.ts)
   - Builds the owner-facing snapshot from DB rows.
8. [`../../mvp-build/apps/manager/src/lib/materialization.ts`](../../mvp-build/apps/manager/src/lib/materialization.ts)
   - Projects rows into generic work resources/actions/envelopes.
9. [`../../mvp-build/apps/manager/src/lib/capability-registry.ts`](../../mvp-build/apps/manager/src/lib/capability-registry.ts)
   - Turns tool schemas, connector state, runtime health, and policy into owner-language abilities.
10. [`../../mvp-build/apps/manager/src/lib/preview-links.ts`](../../mvp-build/apps/manager/src/lib/preview-links.ts)
    - Signed token persistence and resolution.
11. [`../../mvp-build/apps/manager/src/lib/preview-render.ts`](../../mvp-build/apps/manager/src/lib/preview-render.ts)
    - Builds a `WorkResource` for the mobile review page from the same read model as web.
12. [Signed review client](../../mvp-build/apps/web/app/agent/%5BemployeeId%5D/review/ReviewClient.tsx)
    - Mobile signed preview/action UI.

Tests to read:

- [`../../mvp-build/tests/unit/employee-stream.test.ts`](../../mvp-build/tests/unit/employee-stream.test.ts)
- [`../../mvp-build/tests/unit/materialization.test.ts`](../../mvp-build/tests/unit/materialization.test.ts)
- [`../../mvp-build/tests/unit/preview-links.test.ts`](../../mvp-build/tests/unit/preview-links.test.ts)
- [`../../mvp-build/tests/unit/preview-resolve.test.ts`](../../mvp-build/tests/unit/preview-resolve.test.ts)
- [`../../mvp-build/tests/unit/preview-action.test.ts`](../../mvp-build/tests/unit/preview-action.test.ts)
- [`../../mvp-build/tests/unit/sms-preview.test.ts`](../../mvp-build/tests/unit/sms-preview.test.ts)

What you should understand:

- The system is moving toward one work graph materialized across many surfaces.
- Web, SMS, signed preview links, and future admin surfaces should reuse contracts.
- A generic renderer is useful, but high-trust money/customer-facing work still needs explicit gates.

## 7. Customer Journey F: Data, Tenancy, and Secrets (20 Minutes)

Scenario: a bug or attacker tries to read another tenant's business data.

Read in this order:

1. [`../../mvp-build/packages/db/src/index.ts`](../../mvp-build/packages/db/src/index.ts)
   - `serviceClient()` is Manager authority. `anonClient()` is the owner/RLS path.
2. [`../../mvp-build/packages/db/migrations/0001_init.sql`](../../mvp-build/packages/db/migrations/0001_init.sql)
   - Core schema.
3. [`../../mvp-build/packages/db/migrations/0002_rls.sql`](../../mvp-build/packages/db/migrations/0002_rls.sql)
   - Original RLS model.
4. [`../../mvp-build/packages/db/migrations/0018_manager_only_rls.sql`](../../mvp-build/packages/db/migrations/0018_manager_only_rls.sql)
   - Recent RLS closure for public tables.
5. [`../../mvp-build/packages/db/migrations/0020_revoke_turn_rpc_from_anon.sql`](../../mvp-build/packages/db/migrations/0020_revoke_turn_rpc_from_anon.sql)
   - Revokes turn-queue RPCs from anon.
6. [`../../mvp-build/packages/db/migrations/0023_agent_boundary_hardening.sql`](../../mvp-build/packages/db/migrations/0023_agent_boundary_hardening.sql)
   - Per-employee MCP credentials.
7. [`../../mvp-build/apps/manager/src/lib/secrets.ts`](../../mvp-build/apps/manager/src/lib/secrets.ts)
   - Secret sealing/reference handling.
8. [`../../mvp-build/apps/manager/src/lib/signed-links.ts`](../../mvp-build/apps/manager/src/lib/signed-links.ts)
   - HMAC signed claim/artifact/preview tokens.
9. [`../../mvp-build/apps/manager/src/lib/audit.ts`](../../mvp-build/apps/manager/src/lib/audit.ts)
   - Safe audit writes.

Tests to read:

- [`../../mvp-build/tests/unit/secrets.test.ts`](../../mvp-build/tests/unit/secrets.test.ts)
- [`../../mvp-build/tests/unit/signed-links.test.ts`](../../mvp-build/tests/unit/signed-links.test.ts)
- [`../../mvp-build/tests/integration/rls-cross-account.test.ts`](../../mvp-build/tests/integration/rls-cross-account.test.ts)
- [`../../mvp-build/tests/integration/security-live.test.ts`](../../mvp-build/tests/integration/security-live.test.ts)

What you should understand:

- RLS protects owner/anon access, but Manager service-role bypasses RLS by design.
- Therefore Manager route auth and scoped credentials are load-bearing.
- Secrets should move by reference, not raw value, into logs, browser payloads, or model context.
- Signed links are credentials. Scope, expiry, storage hash, and single-use state matter.

## 8. Customer Journey G: Operations, Scheduler, Recovery, and Proof (15 Minutes)

Scenario: the employee misses a turn, a reminder is due, or an event must be retried.

Read:

1. [`../../mvp-build/apps/manager/src/lib/scheduler-runner.ts`](../../mvp-build/apps/manager/src/lib/scheduler-runner.ts)
   - Lanes for reminders, daily briefs, runtime health, turn drain, cleanup, event batches.
2. [`../../mvp-build/apps/manager/src/lib/turn-drain.ts`](../../mvp-build/apps/manager/src/lib/turn-drain.ts)
   - Drains queued owner turns, reaps stuck turns, fails visibly after attempt budget.
3. [`../../mvp-build/apps/manager/src/lib/cleanup.ts`](../../mvp-build/apps/manager/src/lib/cleanup.ts)
   - Retention cleanup for long-lived VPS operation.
4. [`../../mvp-build/apps/manager/src/tools/repair.stub.ts`](../../mvp-build/apps/manager/src/tools/repair.stub.ts)
   - Operator repair tools.
5. [`../../mvp-build/docs/admin-system-architecture.md`](../../mvp-build/docs/admin-system-architecture.md)
   - Future operator admin plane.
6. [`../../mvp-build/docs/metering-architecture.md`](../../mvp-build/docs/metering-architecture.md)
   - Usage/cost/proof model.

Tests:

- [`../../mvp-build/tests/unit/scheduler-runner.test.ts`](../../mvp-build/tests/unit/scheduler-runner.test.ts)
- [`../../mvp-build/tests/unit/turn-drain.test.ts`](../../mvp-build/tests/unit/turn-drain.test.ts)
- [`../../mvp-build/tests/unit/cleanup.test.ts`](../../mvp-build/tests/unit/cleanup.test.ts)
- [`../../mvp-build/tests/unit/repair-tools.test.ts`](../../mvp-build/tests/unit/repair-tools.test.ts)
- [`../../mvp-build/tests/unit/metering.test.ts`](../../mvp-build/tests/unit/metering.test.ts)

What you should understand:

- The system is not accepted until there are real proof IDs.
- Local unit tests prove source behavior; provider/runtime acceptance is a separate status.
- Recovery is part of product quality, not a nice-to-have.

## 9. The Deep Research You Should Read (30 Minutes)

Read these AMTECH docs first:

- [`../../wiki/MVP/old-build-plan/02-system-architecture.md`](old-build-plan/02-system-architecture.md)
- [`../../wiki/MVP/old-build-plan/04-manager-tools.md`](old-build-plan/04-manager-tools.md)
- [`../../wiki/MVP/old-build-plan/07-provisioning-runtime.md`](old-build-plan/07-provisioning-runtime.md)
- [`../../wiki/MVP/old-build-plan/09-event-mesh-v1.md`](old-build-plan/09-event-mesh-v1.md)
- [`../../wiki/MVP/old-build-plan/10-security-ops-observability.md`](old-build-plan/10-security-ops-observability.md)
- [`../../wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md`](old-build-plan/14-agentic-tooling-research-notes.md)
- [`../../wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md)
- [`../../wiki/MVP/hermes-run-session-semantics-research.md`](hermes-run-session-semantics-research.md)
- [`../../wiki/MVP/agent-inbox-and-channel-architecture.md`](agent-inbox-and-channel-architecture.md)
- [`../../wiki/MVP/event-driven-office-and-generative-ui.md`](event-driven-office-and-generative-ui.md)
- [`../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`](../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md)

Then use these external references as background:

- Hono docs: <https://hono.dev/docs/>
  - Needed for Manager routes, middleware style, `Context`, and Hono on Node.
- Next.js App Router docs: <https://nextjs.org/docs/app>
  - Needed for `apps/web/app`, route handlers, server/client component boundaries.
- React docs: <https://react.dev/learn>
  - Needed for `AgentClient.tsx`, state, effects, and event handling.
- TypeScript Handbook: <https://www.typescriptlang.org/docs/handbook/intro.html>
  - Needed everywhere.
- Zod docs: <https://zod.dev/>
  - Needed for shared tool schemas and runtime validation.
- Supabase Row Level Security docs: <https://supabase.com/docs/guides/database/postgres/row-level-security>
  - Needed for migrations and tenant isolation.
- Supabase JavaScript client docs: <https://supabase.com/docs/reference/javascript/introduction>
  - Needed for `serviceClient()` and query chains.
- Postgres RLS docs: <https://www.postgresql.org/docs/current/ddl-rowsecurity.html>
  - Needed for understanding what RLS does and does not protect.
- Model Context Protocol docs: <https://modelcontextprotocol.io/docs>
  - Needed for Manager-as-MCP and employee tool calls.
- MCP TypeScript SDK: <https://github.com/modelcontextprotocol/typescript-sdk>
  - Needed for `mcp-server.ts`.
- MCP-UI: <https://github.com/idosal/mcp-ui>
  - Needed for generative UI / `ui://` resources.
- Docker security docs: <https://docs.docker.com/engine/security/>
  - Needed for container hardening and why Docker is not a full hostile-code sandbox.
- OWASP Top 10 for LLM Applications: <https://genai.owasp.org/owasp-top-10-for-llm-applications/>
  - Needed for prompt injection, excessive agency, sensitive information disclosure.
- Simon Willison, lethal trifecta: <https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/>
  - Needed for understanding why private data + untrusted input + external egress is dangerous.
- OWASP SSRF Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>
  - Needed for agent egress and metadata-address blocking.
- NIST SP 800-207 Zero Trust Architecture: <https://csrc.nist.gov/publications/detail/sp/800-207/final>
  - Needed for least privilege and scoped credentials.
- Stripe webhook docs: <https://docs.stripe.com/webhooks>
  - Needed for signed webhook handling and idempotency.
- Twilio request validation docs: <https://www.twilio.com/docs/usage/security#validating-requests>
  - Needed for Twilio webhook signatures.
- Google Pub/Sub push authentication: <https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions>
  - Needed for Gmail Pub/Sub OIDC verification.
- Hookdeck webhook reliability guide: <https://hookdeck.com/blog/webhooks-at-scale>
  - Needed for verify/enqueue/ack/retry/DLQ architecture.
- Vitest docs: <https://vitest.dev/guide/>
  - Needed for unit tests.
- Playwright docs: <https://playwright.dev/docs/intro>
  - Needed for UI fixture smoke tests.

Books worth using as background:

- Martin Kleppmann, *Designing Data-Intensive Applications*
  - For queues, idempotency, transactions, streams, and distributed correctness.
- Michael T. Nygard, *Release It!*
  - For operational failure modes, timeouts, backpressure, and production readiness.
- Google SRE, *Building Secure and Reliable Systems*
  - Free online: <https://sre.google/books/building-secure-reliable-systems/>
  - For reliability and security as one system.
- Geoffrey Moore, *Crossing the Chasm*
  - For beachhead/customer adoption thinking.
- David Ogilvy, *Ogilvy on Advertising*
  - For the product communication style behind AMTECH's sales surface.
- Paul Graham, "Do Things that Don't Scale": <https://paulgraham.com/ds.html>
  - For why the MVP accepts manual/live-proof workflows while learning.

## 10. Package Concepts You Should Learn

Hono:

- Manager uses Hono for a small, explicit HTTP server.
- Learn: `new Hono()`, `app.get/post`, route params, `Context`, `c.req`, `c.json`, `app.onError`.
- File anchor: [`../../mvp-build/apps/manager/src/server.ts`](../../mvp-build/apps/manager/src/server.ts).

Next.js App Router:

- Web uses route handlers as browser-to-Manager proxies and React client components for the Work Surface.
- Learn: `app/` routing, dynamic route segments, route handlers, server vs client components.
- File anchor: [Employee message route](../../mvp-build/apps/web/app/api/employee/%5BemployeeId%5D/message/route.ts).

React:

- The Work Surface is a stateful client app.
- Learn: `useState`, `useEffect`, `useMemo`, `useCallback`, optimistic/pending state, SSE lifecycle.
- File anchor: [AgentClient Work Surface](../../mvp-build/apps/web/app/agent/%5BemployeeId%5D/AgentClient.tsx).

Supabase and Postgres:

- Manager uses service role; owner/browser paths go through Manager.
- Learn: RLS, service-role bypass, `from().select().eq()`, migrations, RPCs, SECURITY DEFINER risk.
- File anchors: [`../../mvp-build/packages/db/src/index.ts`](../../mvp-build/packages/db/src/index.ts), [`../../mvp-build/packages/db/migrations/`](../../mvp-build/packages/db/migrations/).

Zod:

- Tool schemas are runtime validators and JSON Schema source.
- Learn: object schemas, enums, passthrough, safe parsing, zod-to-json-schema.
- File anchor: [`../../mvp-build/packages/shared/src/tool-schemas.ts`](../../mvp-build/packages/shared/src/tool-schemas.ts).

MCP:

- Employee calls Manager tools through MCP.
- Learn: tools/list, tools/call, resources/list, resources/read, structuredContent.
- File anchor: [`../../mvp-build/apps/manager/src/lib/mcp-server.ts`](../../mvp-build/apps/manager/src/lib/mcp-server.ts).

MCP-UI:

- Rich UI resources can be compiled by Manager and rendered safely in the Work Surface.
- Learn: `ui://` resources, sandboxed rendering, postMessage intents.
- File anchors: [`../../mvp-build/packages/shared/src/work-events.ts`](../../mvp-build/packages/shared/src/work-events.ts), [`../../mvp-build/apps/manager/src/lib/ui-resources.ts`](../../mvp-build/apps/manager/src/lib/ui-resources.ts).

Vitest:

- Most system learning should happen through unit tests.
- Learn: `describe`, `it`, `expect`, mocks, fake Supabase.
- File anchor: [`../../mvp-build/tests/unit/_helpers/fake-supabase.ts`](../../mvp-build/tests/unit/_helpers/fake-supabase.ts).

Playwright:

- Used for UI fixture smoke, not full live acceptance.
- File anchor: [`../../mvp-build/infra/scripts/ui/fixture-browser.mjs`](../../mvp-build/infra/scripts/ui/fixture-browser.mjs).

Docker:

- Used as the current runtime isolation tier for each employee.
- Learn: port publishing, env files, volume mounts, capabilities, resource limits, why egress control is separate.
- File anchor: [`../../mvp-build/infra/scripts/local/start-hermes-container.sh`](../../mvp-build/infra/scripts/local/start-hermes-container.sh).

## 11. How to Read Any New Feature Safely

When you pick up any new task, answer these in order:

1. Which actor is calling this?
   - Owner browser, front door, employee, Manager, scheduler, webhook provider, or operator.
2. What credential authorizes it?
   - Owner session, signed link, scoped MCP token, provider signature, internal token, or service role.
3. Which account/employee identity is authoritative?
   - It should come from a server-verified credential or DB lookup, not model/browser-provided fields.
4. Does it leave the business or move money?
   - If yes, find the approval gate and confirm owner-authenticated resolution.
5. Is input untrusted?
   - Customer email/SMS, provider payloads, model output, web fetches, and browser input are untrusted.
6. Is the result durable and recoverable?
   - Look for idempotency key, audit log, proof IDs, repair queue, and tests.
7. Does local proof equal live proof?
   - No. Local unit tests do not prove Twilio/Gmail/Stripe/Supabase/Hermes acceptance.

## 12. Suggested 3-Hour Schedule

Use this exact schedule if you are onboarding:

- 0:00-0:15: Section 0, mental model.
- 0:15-0:30: Section 1, repo shape.
- 0:30-1:00: Section 2, create/provision employee.
- 1:00-1:25: Section 3, owner chat/runtime.
- 1:25-1:50: Section 4, Manager tools/MCP/approvals.
- 1:50-2:15: Section 5, provider events.
- 2:15-2:40: Section 6, Work Surface/materialization.
- 2:40-3:00: Sections 7-11 skim, then pick one test file from each journey and read it closely.

If you only have 30 minutes:

1. Read [`../../mvp-build/CODEGRAPH.md`](../../mvp-build/CODEGRAPH.md).
2. Read [`../../mvp-build/apps/manager/src/server.ts`](../../mvp-build/apps/manager/src/server.ts).
3. Read [`../../mvp-build/apps/manager/src/lib/mcp-server.ts`](../../mvp-build/apps/manager/src/lib/mcp-server.ts).
4. Read [`../../mvp-build/apps/manager/src/tools/provisioning.stub.ts`](../../mvp-build/apps/manager/src/tools/provisioning.stub.ts).
5. Read [AgentClient Work Surface](../../mvp-build/apps/web/app/agent/%5BemployeeId%5D/AgentClient.tsx).
6. Read [`../../mvp-build/architecture-and-security-review-2026-07.md`](../../mvp-build/architecture-and-security-review-2026-07.md).

## 13. Final Check: What "Understanding" Means Here

After this reading pass, you should be able to explain:

- Why Manager is invisible but central.
- Why Hermes profiles are not enough for tenant isolation.
- How a customer email becomes a work event.
- How the employee calls tools without receiving global authority.
- How web/SMS/signed previews render the same underlying work.
- Why approval gates protect sends and money movement.
- Why RLS is necessary but not sufficient.
- Why live provider/runtime proof is separate from local tests.
- Where you would add a new connector, a new tool, a new surface card, or a new migration.

If you cannot answer one of those, return to the journey section that covers it and read the linked tests.
