# AI Employee MVP Build-Plan Handoff

**Status: complete** · _Created 2026-06-28. **This handoff's output is realized: the full MVP build plan now exists at [`MVP/old-build-plan/`](MVP/old-build-plan/) (the source of truth), built in [`../mvp-build/`](../mvp-build/).** This page is retained as the **design rationale** behind that packet — the non-negotiable corrections, the system model, the required workstreams, the open decisions, and the anti-patterns. Read it alongside [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md) and [`product-ai-employee-context.md`](product-ai-employee-context.md) when you need the "why" behind a build-plan decision._

## Purpose

The job was **not** to invent the product again, and **not** to re-litigate architecture. It was to ground a concrete, sequenced, buildable MVP plan — now captured in [`MVP/old-build-plan/`](MVP/old-build-plan/) — in:

- the proven product mechanics (the per-client factory pattern, the template, the two onboarding doors) documented in [`product-ai-employee-context.md`](product-ai-employee-context.md);
- current Hermes capabilities: profiles, gateways, API server, Runs/Sessions/Jobs, webhooks, MCP, cron, skills, and runtime backends;
- the corrected AMTECH product model: account setup creates an employee; payment is not required; all MVP capabilities are free by default while entitlement/paywall scaffolding exists and defaults to allow.

The build plan is precise enough that implementation agents can pick up workstreams without re-litigating architecture. The corrections and workstreams below are why it is shaped the way it is.

## Non-negotiable corrections

These are the mistakes the plan must not reintroduce:

- **Account setup, not payment, activates creation.** A user should be able to stand up an AI Employee after phone verification, email verification, and password setup. AMTECH has not decided which capabilities later become paid.
- **MVP capabilities are free by default.** Still build entitlement/paywall scaffolding now: feature checks, account entitlements, usage counters, upgrade-intent hooks, audit logs, and confirmation-gated money actions. The default MVP policy is permissive: `allow`.
- **AMTECH account != Hermes profile != runtime.** The account is the product identity. The Hermes profile is durable employee state/config. Runtime processes make that profile reachable through SMS, webchat, webhooks, jobs, connectors, and tools.
- **A Hermes profile is not a sandbox.** Profiles isolate Hermes state and configuration. Real process/filesystem isolation needs Docker, SSH, VM/VPS, Daytona/Modal-style backends, or equivalent, plus profile-scoped home/credentials.
- **The owner only talks to their employee.** The Manager/control plane is backend infrastructure exposed to agents through tools/MCP. The user should never have to understand or address "the Manager."
- **The employee owns implied follow-through.** "Connect my email" means connect, test, verify, recover/report failures, and suggest the next useful move. The owner never has to say "and test it."
- **Use Hermes primitives first.** Do not rebuild an agent runtime, task engine, dashboard, webhook rail, or connector system if Hermes already provides the primitive AMTECH can wrap.
- **Do not expose raw Hermes as the customer product.** AMTECH owns the customer wrapper: account auth, tenant routing, chat, artifact previews, approvals, connector consent, repeatable tasks, and account settings.
- **Prompt-to-profile authoring is not per-client provisioning.** `hermes-profile-template`-style systems manufacture profile packages and skills. `provision_client.py`/`provision_employee` stamps one client employee from a known template and manifest.

## System model to preserve

The plan should model the product relationship like this:

```text
AMTECH account / org
  -> owner user(s), verified phone/email, auth session, entitlement policy
  -> employee record(s)
  -> Hermes profile(s)
  -> runtime endpoints and processes
     - SMS/gateway
     - webchat/API server
     - webhook/event routes
     - cron/jobs
     - terminal/container backend
     - MCP connector processes
     - artifact output and signed links
```

For the MVP, assume one owner-user and one employee unless a workstream explicitly handles multi-user or multi-employee expansion. Still choose schema names that do not paint AMTECH into a single-user corner.

## Current source truth

Use these as the factual starting points:

- [`MVP/old-build-plan/`](MVP/old-build-plan/) - **the source of truth**: the realized whole-product MVP packet (rules, milestones, architecture, data model, Manager tools, connectors, event mesh, security, tests).
- [`product-ai-employee-context.md`](product-ai-employee-context.md) - AMTECH AI Employee product mechanics (template, per-client factory pattern, the two onboarding doors, security boundary, Estimate skill).
- [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md) - three-plane Hermes-aware platform architecture.
- [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) - customer-facing funnel and work-preview/product wrapper.
- The proven prototype mechanics are documented in the ledger at [`evidence/sources.md`](evidence/sources.md) (S081–S085) — the deterministic per-client factory, the agent-as-files template, the two onboarding doors, and the security/runtime model.

Do not treat older prompts, old website assumptions, or the Hermes profile-template repo as stronger evidence than `MVP/old-build-plan/` and the product docs above.

## Target MVP shape

The full build plan should produce a demoable system with these end-to-end paths.

### 1. Front door

The first touch is an agentic onboarding conversation, not a static form:

- Web first: `amtechai.com/create-ai-employee`.
- SMS next: text a keyword to the AMTECH front-door number.
- Same orchestrator definition across surfaces where practical: product-aware prompt, goal-oriented conversation, small strict tool surface.
- The orchestrator collects business context naturally, maps it to the seven-question manifest contract, confirms it back, and routes the user through account setup.
- After account activation, it calls `provision_employee(account_id, manifest, transcript_ref)`.
- The raw conversation seeds the employee brain; the structured summary becomes the manifest.

### 2. Provisioning

Provisioning is a strict backend/Manager operation:

- create/bind AMTECH account, owner user, employee record, and Hermes profile;
- allocate phone number, subdomain, ports, API keys, webhook routes, and runtime metadata;
- render the template from the manifest;
- start or register the needed runtime processes;
- store the profile/runtime linkage in AMTECH's account layer;
- send the first "I'm live" message from the new employee;
- return structured state to the front door and web app.

The build plan must decide which parts are synchronous, queued, retried, and observable.

### 3. Interaction wrapper

After activation, the owner works with the live employee across surfaces:

- SMS remains the default high-trust, async channel.
- Webchat talks to the same employee/profile through Hermes API server primitives, fronted by AMTECH auth and tenant routing.
- Artifact previews use AMTECH signed links and inline web rendering for files produced in the employee output workspace.
- Approvals work in natural language and with web buttons as affordances over the same approval primitive.
- Repeatable tasks are skills plus Hermes cron/jobs, surfaced in a narrow customer UI instead of a new task engine.

### 4. Manager/control plane

The Manager is backend-only and agent-native. It should likely be implemented as an AMTECH control service with MCP-compatible tools where practical.

Minimum useful tool surface for the plan:

| Tool | Caller | Required behavior |
|---|---|---|
| `send_phone_verification` / `check_phone_code` | front-door orchestrator | verify the phone that becomes the owner identity and SMS authority |
| `create_account` | front-door orchestrator | create AMTECH account after phone verification; add email/password |
| `provision_employee` | front-door orchestrator / Manager | validate manifest, create profile/runtime, bind employee to account |
| `get_entitlements` | employee / front door | read account policy; default MVP response allows all product capabilities |
| `record_usage` | employee / Manager | log usage for future pricing/limits without blocking MVP usage |
| `request_upgrade` | employee | capture upgrade intent only; no assumed paywall in MVP |
| `connect_tool` | employee | start OAuth/connector flow, store credentials, install scoped connector tools |
| `run_connector_test` | Manager/employee | verify connector function without owner having to ask |
| `revoke_tool` | employee/account UI | disconnect connector and remove/disable credentials |
| `add_skill` / `tune_skill` | employee/Manager | install or tune skills and smoke test them |
| `set_schedule` / `pause_checkin` | employee | manage Hermes cron/jobs and verify next scheduled state |
| `send_employee_event` | Manager/event mesh | deliver normalized events into the employee inbox |

Every Manager tool returns structured facts: status, changed resources, proof/test result, user-facing summary hints, required confirmation, and next suggested action.

### 5. Connector first slice

Use email as the first serious Manager proof:

1. Owner says to the employee, "connect my email."
2. Employee calls `connect_tool("email")`.
3. Manager sends an OAuth consent link to the verified owner.
4. Owner approves.
5. Manager stores credentials, installs/updates scoped connector MCP config, and runs the connector test.
6. Employee reports proof and suggests the next useful action.

The build plan must define token custody, least-privilege scopes, revocation, refresh failures, audit logging, and what "test passed" means.

### 6. Real event mesh first slice

Prove real provider-to-employee notification paths. The MVP is not complete if the invoice or reply event is manually injected for theater. Stripe may run in provider test mode, but the event must come through Stripe's real webhook rail; Gmail replies must come through Gmail's real mailbox-change rail.

```text
customer replies to Gmail estimate email
  -> Gmail watch/Pub/Sub notification
  -> Gmail history sync
  -> normalized reply event
  -> employee inbox/message
  -> owner-facing SMS with context and next action

Stripe invoice/payment event in test mode
  -> signed Stripe webhook
  -> verified normalized invoice/payment event
  -> employee inbox/message when owner attention is useful
```

The user-facing message should not be a raw webhook or email template. It should sound like an office manager with context: what the customer said or paid, what it means, and what the employee can do next.

## Required build-plan workstreams

The agent team should split the MVP plan into these workstreams, with dependencies and acceptance checks for each:

1. **Accounts and identity.** Account/org/user/employee schema; phone first; email/password after; session auth; account-to-profile binding; verified owner authority.
2. **Front-door orchestrator.** Webchat first, SMS next; prompt; state store; transcript persistence; manifest extraction; account handoff.
3. **Provisioning and runtime supervision.** `provision_employee` wrapper; queue/retry model; local demo topology; Caddy/tunnel/domain routing; process lifecycle; health checks.
4. **Hermes profile/runtime integration.** Profile creation, API server enablement, gateway config, webhook routes, cron/jobs, MCP config, terminal backend and isolation strategy.
5. **Interaction wrapper.** Authenticated webchat, SMS routing, artifact signed links, approvals, work-in-progress states, repeatable task UI affordances.
6. **Manager MCP/control service.** Strict tool schemas, policy checks, audit trail, structured return format, permissioning per employee/account.
7. **Gmail connector v1.** Gmail OAuth, token custody, scoped send/read tools, connector test, real email send with PDF attachment, Gmail watch/PubSub, history sync, revoke/reconnect, failure events.
8. **Stripe/deposit connector v1.** Stripe Connect test-mode onboarding, account-link regeneration, deposit invoice creation, send, hosted invoice/payment URL, signed webhook handling, invoice/payment event trace.
9. **Event mesh v1.** Real Gmail reply and Stripe invoice/payment ingress, normalization, idempotency, triage, employee message injection, notification channel policy.
10. **Entitlement/paywall scaffolding.** Default allow policy, feature check helper, usage records, upgrade intent, money-action confirmation gate, no blocking paywalls in MVP.
11. **Security and abuse controls.** Twilio signature verification, CSRF/OAuth state, owner verification, webhook secrets, rate limits, runtime containment, dangerous-tool allowlists.
12. **Observability and operations.** Provision logs, runtime health, gateway delivery logs, Gmail/Stripe connector status, event trace, support/repair commands.
13. **Demo scripts and smoke tests.** Golden path scripts for web create, SMS create, provision, first employee message, webchat, PDF artifact preview, Gmail send/reply, Stripe Connect/deposit invoice/webhook, and internal reminder.

## Open decisions the build plan must resolve

Do not leave these as vague implementation notes:

- Account model: `account` vs `org` vs `business`; whether MVP stores one owner or anticipates multiple humans.
- Front-door runtime: what LLM loop/service runs the pre-account orchestrator and how it shares prompt/skill DNA with the Hermes employee.
- Manager boundary: MCP-first, HTTP-first with MCP adapter, or both; how tools are authenticated and authorized per employee.
- Runtime topology for local demo: one machine with Caddy/tunnel and per-profile ports; Docker vs local backend; which services run continuously vs on demand.
- Domain and routing scheme: `agents.<business>.amtechai.com`, `<client>.agents.amtechai.com`, or both with canonical redirects.
- Webchat auth: how a logged-in account talks to the right Hermes API server without exposing raw bearer tokens or raw Hermes admin surfaces.
- Artifact storage: local output folder indexing vs copied object storage; signed URL lifetime; retention; permission checks.
- Gmail connector implementation: scopes, token storage, MCP wiring, send-with-attachment path, watch/PubSub setup, `historyId` storage, renewal, revocation, reconnect flow.
- Stripe connector implementation: Connect test-mode account path, Account Link refresh/return handling, invoice object shape, application-fee posture, webhook verification, live-mode gate.
- Event mesh implementation: Gmail reply event and Stripe invoice/payment event through Manager-normalized routes; idempotency keys and batching policy.
- Entitlements: schema and code path that defaults to allow now but can enforce plans later without rewiring surfaces.
- A2P/SMS path: whether the demo starts with toll-free/10DLC, one shared front-door number, and per-employee numbers; how local development avoids accidentally representing unallocated numbers as live.
- Self-hosting boundary: what stays local/self-hosted for demo and pilots, and which external APIs remain acceptable dependencies.

## Acceptance criteria for the full MVP plan

The finished build plan is good enough only if it can answer "what gets built next?" without another architecture pass.

It should include:

- a sequenced roadmap with demoable milestones;
- workstream owners/agent roles if a team of agents will execute it;
- file/module targets in the existing MVP source where known;
- new services/modules to create, named concretely;
- data model changes and migration shape;
- tool schemas for Manager/front-door actions;
- runtime/process topology for local demo and first pilot;
- security gates and trust boundaries;
- smoke tests and manual demo scripts;
- rollback/repair paths for failed provisioning, broken connectors, and failed event delivery;
- explicit non-goals for the MVP.

Golden-path demo acceptance:

1. A visitor starts at webchat, has a natural onboarding conversation, verifies phone/email, creates an AMTECH account, and provisions an employee with no payment step.
2. The employee sends its own "I'm live" text and can be reached through SMS.
3. The logged-in owner can talk to the same employee through webchat.
4. The employee can produce a PDF estimate and the owner can preview it through a signed link or inline web preview.
5. The owner approves sending the estimate; if Gmail is not connected, the employee initiates OAuth, Manager installs/tests the connector, drafts the message with the PDF attached, asks approval, and sends through Gmail.
6. A real customer reply to that Gmail thread reaches the employee through Gmail watch/PubSub/history sync, and the owner receives a context-rich SMS notification with an obvious next action.
7. The owner approves a deposit invoice; if Stripe is not connected, the employee initiates Stripe Connect test-mode onboarding, creates/sends a real Stripe invoice/payment link, and records signed Stripe webhook events.
8. The employee stores the job start/reminder internally and offers Google Calendar as a fast-follow.
9. Entitlement checks and usage logging run in the path but allow all MVP capabilities.
10. Dangerous external actions still require confirmation.
11. Runtime isolation limitations are explicit, with a concrete pilot-safe containment plan.

## Anti-patterns to reject

- A payment gate before the first employee is created.
- A hardcoded questionnaire that replaces the agentic front door.
- One shared Hermes profile for many customer employees.
- Treating a profile as a security sandbox.
- Customer exposure to the raw Hermes dashboard as the product UI.
- A separate owner-facing "Manager" chatbot or admin concept.
- Rebuilding Hermes Runs/Sessions/Jobs/webhooks/cron/MCP as a parallel AMTECH runtime.
- Connector flows that stop at OAuth and wait for the user to ask for testing.
- Paywall logic hidden in prompts instead of explicit entitlement policy.
- Notification templates that bypass the employee's business context and voice.
- Any manually injected provider result standing in for the Gmail reply or Stripe invoice/payment path.

## Recommended agent-team split

For plan creation, not implementation, use a small team with hard deliverables:

- **Architecture lead:** owns final build-plan sequence, dependencies, non-goals, and consistency with this handoff.
- **Hermes integration agent:** maps profile/API/gateway/webhook/MCP/runtime choices to concrete implementation steps.
- **Accounts/auth agent:** designs account, phone/email verification, session auth, employee binding, and entitlement schema.
- **Frontend/surfaces agent:** designs front-door webchat, post-account webchat, artifact previews, approvals, and repeatable task affordances.
- **Manager/connectors agent:** defines MCP/control-plane tools, Gmail send/listen flow, Stripe Connect/deposit flow, token custody, tests, and audit logs.
- **Ops/security agent:** defines local demo topology, Caddy/tunnel/domain routing, runtime containment, observability, smoke tests, and repair paths.

The architecture lead should merge these into one coherent plan, removing duplicate abstractions and keeping the MVP lean.

## First planning pass

Start the build-plan document with this sequence unless fresh source inspection proves a better order:

1. Reconcile the proven prototype mechanics (ledger S081–S085, documented in `product-ai-employee-context.md`) and identify the reusable patterns to re-implement in `../mvp-build/`.
2. Define account/employee/profile/runtime data model.
3. Specify Manager tool schemas and entitlement default-allow policy.
4. Build web front-door orchestrator path to account setup and `provision_employee`.
5. Close the provisioning loop: first employee text, runtime endpoint records, webchat route.
6. Add artifact preview and approval affordances.
7. Add SMS front-door route.
8. Add Gmail connector with test/verify/report, real send, and real reply listener.
9. Add Stripe Connect test-mode deposit invoice and signed webhook handling.
10. Add real Gmail reply and Stripe invoice/payment event mesh.
11. Add runtime containment/ops hardening for first real pilots.

The plan can defer voice, multi-human orgs, Google Calendar write, full billing enforcement, marketplace-like skill catalogs, and multi-employee coordination until the first SMS+web+Gmail+Stripe+Manager loop works end to end.

## Final reminder

AMTECH's edge is not "a profile per user" by itself. The edge is that a business owner can create an employee instantly, talk to it in the channels they already use, watch useful work materialize, connect real tools without becoming a systems integrator, and receive business events as intelligent employee messages. Hermes is the engine. AMTECH owns the relationship, the wrapper, the Manager, and the within-business usefulness.
