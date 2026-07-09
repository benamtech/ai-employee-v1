# Phase 0 - Current State Handoff

Status: active handoff

Purpose: give a cold implementer the current product, code, architecture, dirty-tree, and readiness state without requiring the old plan packet.

## Executive Readout

The codebase is no longer just an estimate MVP. It has a real shape:

- Manager is the backend control plane.
- Hermes Agent is the employee substrate.
- Per-employee profile packages render Hermes config, workspace policy, skills, brain files, model config, toolsets, and Manager MCP server config.
- Web/SMS front-door, claim, owner session, provisioning, artifacts, approvals, Gmail, Stripe, reminders, generic events, channel routing, runtime health, scheduler lanes, repair seams, metering ledgers, Manager-as-MCP, and schema-first Manager tools are present in source.

The serious gap is product surface quality. The owner-facing web UI is still a sparse proof surface. The onboarding flow is plainly a developer prototype. Login is a placeholder. Work cards exist, but the experience does not yet look or behave like a powerful employee desk. SMS is not yet a complete ambient inbox with signed previews for every task, artifact, approval, and progress state. This is not ready for free trials.

The second-half work is therefore not "add more estimate code." It is:

1. preserve and prove the tool-enabled Hermes employee path;
2. rebuild the owner surfaces into a tool-agnostic employee work surface;
3. make SMS powerful enough to stand alone;
4. expose all Hermes/Manager/MCP capability through generic renderers and approvals;
5. make the factory operable and billable for many client employees;
6. pass free-trial and paid-pilot acceptance gates with real proof ids.

Surface research update, 2026-07-09: the plan now also incorporates the Hermes Workspace/WebUI/Desktop research in `surface-research-hermes-gui-and-materialization.md`. The core addition is a materialization contract above chat: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, and a Manager-owned capability/ability model rendered into web, SMS, signed previews, admin, and optional desktop/Deno clients.

## Canonical Product Alignment

AMTECH packages Hermes Agent by Nous Research for small-business owners. Hermes is a real open-source substrate with skills, memory, Runs, Sessions, Jobs, toolsets, MCP, terminal/file/web/browser/media tools, messaging gateways, and a desktop/web/dashboard ecosystem. AMTECH should not compete with Hermes by rebuilding those primitives. AMTECH should make those primitives usable, safe, and economically valuable for an owner who does not know what an API, MCP server, model provider, or terminal is.

The product promise has two equal sides:

- A broad AI employee: can help start or run a business from scratch, including website work, estimates, purchasing, invoices, follow-ups, marketing, records, reminders, and connected-system tasks.
- A humane small-business interface: web and SMS surfaces that show work, results, outputs, approvals, receipts, connectors, tasks, and progress in owner language.

The estimate wedge is still the first proof object. It must not become the architecture ceiling.

## Source Orientation

Read order used for this handoff:

- root `CODEGRAPH.md`
- `mvp-build/CODEGRAPH.md`
- `wiki/MVP/build-plan-current/`
- `wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md`
- `wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`
- `mvp-build/memory/MEMORY.md` and recent dated memory notes
- `mvp-build/infra/hermes/RUNBOOK.md`
- `mvp-build/infra/local/RUNBOOK.md`
- `mvp-build/docs/admin-system-architecture.md`
- `mvp-build/docs/metering-architecture.md`
- web client files under `mvp-build/apps/web/app/`
- Manager/runtime/tool files under `mvp-build/apps/manager/src/`
- shared contracts under `mvp-build/packages/shared/src/`
- Hermes profile template under `mvp-build/packages/agent-template/`

## Repo And Git State At Handoff

Remote:

- `origin https://github.com/benamtech/ai-employee-v1.git`

Recent commits show toolset/MCP/materialization work, live local onboarding, model bridge work, and Manager centrality fixes.

The worktree is dirty and contains important interrupted changes. Preserve them before large refactors.

Dirty tracked files observed:

- `mvp-build/apps/manager/src/lib/mcp-server.ts`
- `mvp-build/apps/manager/src/lib/profile-renderer.ts`
- `mvp-build/apps/manager/src/server.ts`
- `mvp-build/infra/scripts/local/model-bridge-lib.mjs`
- `mvp-build/memory/MEMORY.md`
- `mvp-build/packages/agent-template/README.md`
- `mvp-build/packages/agent-template/SOUL.md`
- `mvp-build/packages/agent-template/config.yaml`
- `mvp-build/packages/agent-template/workspace/AGENTS.md`
- `mvp-build/packages/agent-template/workspace/manager-tools.md`
- `mvp-build/tests/unit/mcp-server.test.ts`
- `mvp-build/tests/unit/model-bridge.test.ts`
- `mvp-build/tests/unit/runtime-backend.test.ts`

Untracked files observed:

- `mvp-build/apps/manager/src/lib/artifact-view.ts`
- `mvp-build/memory/2026-07-05-0140-tool-availability-and-materialization-direction.md`
- `mvp-build/memory/2026-07-06-0010-container-manager-networking-and-terminal-backend-fix.md`
- `mvp-build/memory/2026-07-06-0130-live-gate-closed-bridge-tools-mcp-identity-persona.md`

## What The Dirty Changes Do

Do not discard these changes without replacing their behavior.

### Container-To-Manager MCP Reachability

`profile-renderer.ts` rewrites Manager loopback origins for Dockerized employee runtimes:

- host `localhost` or `127.0.0.1` becomes `host.docker.internal`;
- `DOCKER_MANAGER_API_ORIGIN` can override;
- production non-loopback origins are untouched.

This fixes the "tool-less employee" bug where Hermes inside a container tried to call `http://localhost:8080/manager/mcp`, which points to the container itself instead of Manager.

### Terminal Backend Separation

The rendered Hermes `terminal.backend` is now `local` by default even when Manager runtime isolation is `docker`. The employee already runs inside the container, so Hermes terminal/file tools should execute in-process. Rendering `docker` there caused Docker-in-Docker failures and silently gated terminal/file tools off.

### MCP Identity Injection

The Manager MCP server now strips `account_id` and `employee_id` from advertised input schemas and injects them server-side from baked MCP request headers:

- `X-AMTECH-Account-Id`
- `X-AMTECH-Employee-Id`

This prevents the model from seeing or spoofing owner identity and stops it from asking the owner for internal ids.

### Model Bridge Tool Forwarding

The local no-key model bridge now includes OpenAI `tools` in the worker prompt and teaches a `tool_calls` JSON protocol. Without this, the warm Haiku worker only produced text and could not call Manager tools, meaning no real work happened in local live testing.

### Persona Un-Gating

`SOUL.md` and workspace `AGENTS.md` were softened from a narrow "not a chatbot/writing assistant" posture to "default to helping." This is directionally correct for the broader AI employee product. Keep the money/customer approval gate, but do not train the employee to reject broad business work.

### Generic Artifact View

`artifact-view.ts` is an untracked generic HTML renderer for any structured artifact payload. It renders arrays as tables, scalars as key/value rows, nested objects as sections, and escapes all values. It should be wired into artifact resolution as a safe fallback when an artifact has a payload but no rendered file.

## Backend State

The backend has the right high-level shape.

### Manager Control Plane

`apps/manager/src/server.ts` registers:

- health;
- protected Manager tool route;
- `/manager/mcp` MCP endpoint;
- scheduler runner;
- claim token consume;
- owner message routing;
- owner heartbeat;
- artifact resolve;
- employee resources;
- employee SSE stream;
- dev owner session mint;
- Twilio/Gmail/Stripe webhooks;
- provisioner;
- orchestrator.

Manager is correctly framed as invisible infrastructure. Owners should never see it directly.

### Manager Tools

Manager tool implementation is registry based:

- shared tool contracts in `packages/shared/src/tool-contracts.ts`;
- zod schemas in `packages/shared/src/tool-schemas.ts`;
- shared dispatch in `apps/manager/src/lib/run-tool.ts`;
- registry in `apps/manager/src/tools/registry.ts`;
- tool families for identity, provisioning, estimates, Gmail, Stripe, events, reminders, repair.

Current direction is good: tools are schema-first and can be exposed through HTTP or MCP without duplicating behavior.

### Manager-As-MCP Server

`apps/manager/src/lib/mcp-server.ts` exposes Manager tools over MCP using `@modelcontextprotocol/sdk`. It lists JSON Schemas derived from zod and calls `runManagerTool`. This is the right long-term path for employee-native actions.

Missing for the second half:

- resources for readable state, not only tools;
- output schemas for high-value tools;
- product capability metadata derived from AMTECH provisioning/profile-package intent, Manager tool schemas, installed skills, rendered toolsets/MCP config, connector state, entitlements, and safety policy;
- owner-language names/categories;
- account policy gating around what to show in UI;
- integration into web capability surfaces.

### Hermes Runtime Client

`apps/manager/src/lib/hermes-client.ts` handles:

- runtime API resolution;
- bearer auth from sealed secret reference;
- `/health`;
- `/v1/capabilities`;
- `/v1/toolsets`;
- capability cache;
- Runs-first execution when advertised;
- Sessions fallback;
- session key handling.

This is aligned with Hermes docs. The missing piece is a real event-stream adapter from Hermes Runs/Sessions streams to owner-safe work-progress events, plus a Manager-owned materialization model above chat. Current Work Surface progress is skeletal.

### Event Mesh

The event system has:

- generic source registry;
- Gmail/Stripe/Manager adapters;
- `ingestEvent` for external events;
- `deliverEmployeeEvent` for internal Manager-authored events;
- dedupe, triage, wake/deliver-only decisions;
- repair queue;
- event batching;
- channel/session/presence router;
- Work Surface stream.

The event mesh is an important asset. The owner UI is not yet good enough to express it.

### Metering

Migrations and helpers exist for:

- `work_runs`;
- `meter_events`;
- `tool_invocations`;
- pricing versions;
- daily rollups;
- budget policies.

Metering is source-wired but not complete enough for paid pilots. Instrumentation coverage, rollups, budget controls, and admin views are still needed.

## Hermes Profile State

`packages/agent-template/` renders a Hermes profile package with:

- `SOUL.md`;
- `config.yaml`;
- workspace `AGENTS.md`;
- `manager-tools.md`;
- brain files;
- skills for estimate, invoice, and daily check-in.

The rendered `config.yaml` includes:

- model config;
- terminal backend;
- `platform_toolsets.api_server`;
- `mcp_servers.amtech_manager`;
- SMS gateway disabled because Manager owns SMS;
- tool progress off for SMS.

`packages/shared/src/platform-toolsets.ts` currently enables a base set:

- `web`
- `search`
- `file`
- `skills`
- `todo`
- `memory`
- `session_search`

It conditionally enables:

- `terminal` when isolated;
- `browser` when isolated and Browserbase key exists;
- `vision`, `image_gen`, `tts` when keys exist.

Deliberately off:

- `cronjob`;
- `skills_hub`;
- terminal/browser under `local`.

This is a good safety baseline, but the product should become more capability-aware. The UI should show what this employee can do, what is currently healthy, what needs connection, and what is policy-gated, using rendered profile data, Hermes runtime discovery, Manager tools, connector state, and policy together.

## Web Client State

The web client is the biggest product gap.

### Existing Owner Work Surface

Files:

- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `components/WorkCard.tsx`
- `components/ApprovalCard.tsx`
- `components/DailyBrief.tsx`
- `components/JobFolder.tsx`
- `components/Receipt.tsx`
- `components/McpUiResource.tsx`
- `components/deliverables/index.tsx`
- `surface.tokens.ts`
- `surface-types.ts`
- `lib/group-by-job.ts`

What exists:

- resource snapshot load;
- heartbeat;
- SSE connection with snapshot/work_event/work_progress/approval_update;
- simple local chat state;
- daily brief stats;
- work cards;
- approval cards;
- job folder grouping;
- generic deliverable renderers;
- MCP-UI sandboxed iframe;
- schema-derived form rendering for `tool_activity`.

Why it is not ready:

- It is a narrow single-column prototype, not a professional employee work surface.
- Chat history is local component state, not a real persistent conversation view.
- The "Doing it now" progress line is a single string, not a meaningful live work timeline.
- There is no side-by-side artifact/task preview.
- There is no task board, capability panel, connector consent center, output library, or job workspace.
- There is no owner-friendly capability model from provisioned profile-package intent, Hermes skills/toolsets, Manager/MCP tools, connector state, and policy.
- The UI still depends on a few card shapes and looks more like a basic internal status page than a rich product.
- Mobile behavior has not been designed as a first-class experience.
- There is no comprehensive no-data/error/degraded/reconnect UX.
- The design is intentionally quiet, but it currently reads underbuilt, not calm.

### Existing Onboarding And Claim UI

Files:

- `apps/web/app/create-ai-employee/page.tsx`
- `apps/web/app/claim/ClaimClient.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`

Current state:

- create flow is a raw linear dev form;
- claim flow is raw and prints JSON-ish status;
- login is a placeholder;
- home page explicitly says Phase 1 wiring and environment setup are needed.

This cannot be used for trials as-is.

## SMS State

SMS exists as a provider route and channel, but not as a complete product surface.

Current intent:

- SMS is the ambient inbox.
- Owner should see notify/question/review moves.
- Approval gates should be resolvable from SMS.
- Signed artifact links exist.

Missing:

- signed mobile preview pages for every work item, task, artifact, connector, approval, and result;
- consistent SMS copy grammar;
- link previews that show enough context to approve safely;
- SMS-only acceptance tests;
- delivery receipt and repair UX surfaced in owner language;
- cross-channel state continuity from SMS to web and back.

## Deployment And Factory State

Deployment docs establish the factory model:

- Caddy splits public web, agent web route, Manager API/webhooks, and per-client employee gateways.
- `infra/hermes/RUNBOOK.md` describes per-profile Hermes setup, runtime containment, Jobs runner, API server, and smoke tests.
- `infra/local/RUNBOOK.md` has local VPS-faithful no-SMS paths.
- `runtime_endpoints`, `provisioning_jobs`, `employee_profile_builds`, `number_pool`, `runtime_health_checks`, `hermes_job_runs`, and related tables exist.

Missing for real operations:

- operator admin panel;
- account health summaries;
- provisioning state-machine UI;
- support access controls;
- production owner auth;
- billing/account states;
- cost/budget views;
- one-operator workflows for dozens/hundreds of employees.

## External Hermes Research Summary

Hermes Agent repo says Hermes is a self-improving agent with:

- memory;
- skill creation and improvement;
- session search;
- scheduling;
- delegation/subagents;
- multiple model providers;
- multiple messaging surfaces;
- terminal backends;
- cloud/runtime options.

Hermes API Server docs show:

- OpenAI-compatible Chat Completions;
- Responses;
- `/v1/capabilities`;
- Runs API;
- `/v1/runs/{run_id}/events` SSE;
- run stop;
- run approval;
- Jobs API;
- Sessions API;
- `/api/sessions/{id}/chat/stream`;
- `/v1/skills`;
- `/v1/toolsets`;
- `X-Hermes-Session-Key`.

Hermes MCP docs show:

- stdio and HTTP MCP servers;
- OAuth-authenticated HTTP MCP;
- tool selection;
- catalog manifests;
- env substitution;
- dashboard support for MCP details.

Hermes Desktop shows the interaction model AMTECH should learn from:

- same agent, skills, and memory as CLI/gateway;
- streaming tool output;
- side-by-side previews;
- file browser;
- voice;
- settings without terminal.

Hermes WebUI and Hermes Workspace show useful patterns:

- streaming SSE;
- queued messages;
- edit/regenerate;
- stop running task;
- inline tool cards;
- subagent activity;
- memory/skills/jobs/tools enhanced mode;
- graceful portable mode when enhanced Hermes APIs are absent.

AMTECH should borrow the interaction ideas, not the developer vocabulary.

Additional GUI/runtime research from Hermes Workspace/WebUI/Desktop adds these requirements:

- web must be a persistent employee desk with navigation, timeline, preview rail, queue/stop/edit/rerun, connector/ability status, and mobile-first review flows;
- SMS must be a complete ambient inbox with notify/question/review/failure/receipt grammar and signed scoped preview/action links;
- every output should materialize as a `WorkResource`, not only as a chat message or estimate PDF;
- every user-visible event should be a `SurfaceEnvelope` that can render differently on web, SMS, admin, customer links, email, and optional desktop clients;
- future Deno/Tauri/Electron clients should consume Manager surface APIs/events, not raw Hermes internals.

## Readiness Assessment

Current rough readiness:

- Backend architecture: medium-high.
- Hermes alignment: medium-high, pending live proof and event-stream adapter.
- Tool agnosticism: medium at contract layer, low at product surface.
- Web UI/UX: low.
- SMS-only surface: low-medium.
- Trial operations: low.
- Billing/admin: planned but low.
- Live provider/runtime acceptance: not complete.

## Non-Negotiables For Phases 1-6

- Preserve the dirty-tree fixes before redesign.
- Do not regress Manager-as-MCP.
- Do not show owners raw tool names, raw JSON, APIs, MCP, tokens, config, or stack traces.
- Make broad Hermes/Manager employee capability visible in owner language.
- Make generic rendering work for every deliverable and tool result.
- Keep approvals structurally enforced for money/customer-facing work.
- Make SMS and web render the same underlying work state.
- Build admin/factory controls before charging.
- Capture proof ids for live acceptance.
