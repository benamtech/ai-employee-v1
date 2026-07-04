# Hermes Agent Authoritative Record

Status: for-now authoritative research record
Verified: 2026-07-03
Target upstream: NousResearch/hermes-agent v0.18.0, released 2026-07-01
Purpose: Record how Hermes Agent works and how AMTECH should integrate with it before Phase 5/6 production work.

## Evidence hierarchy

Use this order when claims conflict:

1. A live Hermes v0.18.0 instance passing black-box contract tests.
2. Current upstream source on `NousResearch/hermes-agent` `main`.
3. Official Hermes docs generated from the current docs site.
4. Upstream tests in the Hermes repository.
5. README/release notes.
6. AMTECH assumptions and prior notes.

Do not treat AMTECH assumptions as authoritative when current Hermes source/docs disagree.

## Current Hermes baseline

The latest verified upstream target is NousResearch/hermes-agent v0.18.0, released July 1, 2026. The GitHub repo showed it as the latest release during the July 3, 2026 research pass.

Primary sources:

- https://github.com/NousResearch/hermes-agent
- https://hermes-agent.nousresearch.com/docs/
- https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- https://hermes-agent.nousresearch.com/docs/developer-guide/architecture
- https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop
- https://hermes-agent.nousresearch.com/docs/developer-guide/session-storage
- https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals
- https://hermes-agent.nousresearch.com/docs/user-guide/profiles
- https://hermes-agent.nousresearch.com/docs/user-guide/features/cron

## Architecture model

Hermes is centered on `AIAgent` in `run_agent.py`.

Entry points include:

- CLI
- Gateway
- API Server
- ACP
- batch runner
- Python library

Those entry points converge into:

- prompt building;
- provider/runtime resolution;
- tool dispatch;
- session storage;
- terminal/browser/web/MCP/file/vision tool backends;
- gateway/platform delivery.

The architecture docs describe the core graph as entry points flowing into `AIAgent`, then into session storage and tool backends. AMTECH should therefore treat Hermes as an agent runtime, not as an AMTECH-owned internal library.

## Agent loop model

Hermes' agent loop is turn-based:

1. Generate or receive a task id.
2. Append the user message to conversation history.
3. Build or reuse the system prompt.
4. Compress context if needed.
5. Build provider API messages.
6. Inject ephemeral prompt layers.
7. Call the provider through an interruptible API call.
8. Parse the response.
9. If tool calls exist, execute tools, append tool results, and loop.
10. If final text exists, persist the session, flush memory if needed, and return.

Hermes uses an OpenAI-style internal message format and enforces strict role alternation:

- after system: user, assistant, user, assistant;
- during tool calls: assistant with tool calls, then tool results, then assistant;
- never two assistant messages in a row;
- never two user messages in a row;
- consecutive tool messages are allowed for parallel tool results.

This matters for AMTECH because external events should be re-entered as clean user/event turns through the Manager-owned queue. Manager must not synthesize malformed transcript fragments.

## Public API Server surface

The production integration should be API-server-first and capabilities-first.

Stable or documented surfaces include:

- `GET /health`
- `GET /v1/health`
- `GET /health/detailed`
- `GET /v1/models`
- `GET /v1/capabilities`
- `POST /v1/chat/completions`
- `POST /v1/responses`
- `GET /v1/responses/{id}`
- `DELETE /v1/responses/{id}`
- `POST /v1/runs`
- `GET /v1/runs/{run_id}`
- `GET /v1/runs/{run_id}/events`
- `POST /v1/runs/{run_id}/stop`
- `POST /v1/runs/{run_id}/approval`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/{job_id}`
- `PATCH /api/jobs/{job_id}`
- `DELETE /api/jobs/{job_id}`
- `POST /api/jobs/{job_id}/pause`
- `POST /api/jobs/{job_id}/resume`
- `POST /api/jobs/{job_id}/run`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/{id}`
- `PATCH /api/sessions/{id}`
- `DELETE /api/sessions/{id}`
- `GET /api/sessions/{id}/messages`
- `POST /api/sessions/{id}/fork`
- `POST /api/sessions/{id}/chat`
- `POST /api/sessions/{id}/chat/stream`
- `GET /v1/skills`
- `GET /v1/toolsets`

`/v1/capabilities` is load-bearing. Hermes docs state external UIs, orchestrators, and control planes should use it to discover whether the running version supports runs, streaming, cancellation, and session continuity without private Python internals.

## API configuration and security

The API server is enabled by environment:

- `API_SERVER_ENABLED=true`
- `API_SERVER_KEY=<secret>`
- optional `API_SERVER_PORT`, default `8642`
- optional `API_SERVER_HOST`, default `127.0.0.1`
- optional `API_SERVER_CORS_ORIGINS`
- optional `API_SERVER_MODEL_NAME`

Bearer auth is required even on loopback. CORS is disabled by default and should only be enabled with an explicit allowlist.

Unsupported files and non-image data URLs return `400 unsupported_content_type`. Inline images are supported for chat/responses paths; general file upload is not.

## Sessions, responses, and runs

`/v1/chat/completions` is OpenAI-compatible and stateless. The client sends the full message list.

`/v1/responses` supports server-side response chains using `previous_response_id` and named `conversation`. Stored responses persist in SQLite and survive gateway restarts, but the docs state a max of 100 stored responses with LRU eviction.

`/api/sessions/{id}/chat` runs one synchronous session turn.

`/api/sessions/{id}/chat/stream` streams one session turn over SSE. Use it only behind capability detection.

`/v1/runs` is the preferred production shape for long-running external control-plane work because it returns a `run_id`, supports status polling, SSE progress events, stop, and approval. For AMTECH Phase 5 live Work Surface progress, `/v1/runs` plus `/v1/runs/{run_id}/events` is the target path.

## Long-term memory scoping

Hermes supports `X-Hermes-Session-Key` on `/v1/chat/completions`, `/v1/responses`, and `/v1/runs`.

This header is distinct from transcript-scoped `X-Hermes-Session-Id`. It gives multi-user frontends a stable memory scope and is passed into `AIAgent(gateway_session_key=...)`. Rules from docs:

- max 256 chars;
- control characters are rejected;
- value is echoed back on JSON/SSE responses;
- support is advertised by `/v1/capabilities`.

AMTECH should use this deliberately for stable employee/account memory scope, but only after deciding the exact session-key grammar.

## Session storage

Hermes stores sessions and messages in SQLite with FTS5 search. The session storage docs show:

- `sessions` table with source, user, model, system prompt, parent session, timestamps, token/cost fields, title, and API call count;
- `messages` table with role, content, tool call fields, reasoning fields, timestamp, token count, and finish reason;
- FTS5 indexing for searchable message content;
- schema version 11 during this research pass;
- write contention handling with retries, jitter, `BEGIN IMMEDIATE`, and WAL checkpoint behavior.

AMTECH should not duplicate Hermes session storage for the agent brain. AMTECH should store product state, owner-visible messages, work descriptors, approvals, artifacts, metering, and provider proofs.

## Gateway and message guard

Hermes Gateway normalizes platform events, resolves session keys, checks auth, dispatches slash commands, and creates/runs `AIAgent`.

When an agent is active for a session, Hermes has a two-level guard:

- base adapter queues incoming messages and sets an interrupt event;
- gateway runner intercepts commands like `/stop`, `/new`, `/queue`, `/status`, `/approve`, `/deny`; other messages interrupt the running agent.

AMTECH should still keep its own per-employee turn queue. Hermes' guard is platform/runtime behavior; Manager's queue is the product guarantee across SMS, web, provider events, scheduler events, repair replays, and multi-instance Manager deployments.

## Profiles and isolation

Profiles are separate Hermes home directories. Each profile owns its own:

- config;
- `.env`;
- `SOUL.md`;
- memories;
- sessions;
- skills;
- cron jobs;
- state database;
- gateway state.

Profiles are useful for AMTECH's employee model, but profiles are not a filesystem sandbox by themselves. The profiles docs distinguish profiles from workspace/sandbox behavior. AMTECH must keep Docker-default runtime policy, workdir discipline, and tenant isolation outside profile identity.

Multi-user API setup uses one profile per user/agent, usually with separate ports and keys.

## Cron and Jobs

Hermes cron jobs can be created, listed, paused, resumed, run immediately, removed, and edited. The gateway ticks the scheduler every 60 seconds, starts a fresh `AIAgent` session for due jobs, optionally injects skills, runs the prompt, delivers the final response, updates metadata, and uses a file lock to prevent overlapping ticks.

The API Server exposes `/api/jobs` as a remote jobs CRUD surface with the same broad shape as `hermes cron`.

AMTECH should not blindly replace its scheduler/reminder model with Hermes Jobs. Jobs overlap with AMTECH's scheduled work, reminders, delivery, repair, and metering semantics. Use `/api/jobs` only after a dedicated contract pass.

## AMTECH integration doctrine

AMTECH should treat Hermes as an external employee runtime with a public HTTP contract.

Manager owns:

- serialization across channels and event sources;
- identity;
- tenant/account rules;
- approval gates;
- metering;
- repair;
- delivery;
- channel/session/presence routing;
- owner-visible product semantics;
- provider webhooks and proofs;
- artifact records;
- billing/usage policy.

Hermes owns:

- agent execution;
- provider calls;
- tool execution inside the Hermes profile;
- skills;
- session memory;
- profile-local runtime state;
- gateway/platform mechanics when Hermes itself is the gateway.

Most efficient target shape:

- use `/v1/capabilities` first;
- use `/v1/runs` and `/v1/runs/{run_id}/events` for Phase 5 live progress;
- keep `/api/sessions/{id}/chat` as synchronous fallback;
- use `/api/sessions/{id}/chat/stream` only behind capabilities;
- defer `/api/jobs` until contract-tested;
- introduce `X-Hermes-Session-Key` deliberately for AMTECH employee/account memory;
- keep Docker/backend isolation separate from profiles.

## TDD contract suite

Build tests in two modes:

1. Fake Hermes API server for local AMTECH Manager TDD.
2. Real Hermes v0.18.0 instance for runtime acceptance.

The same contract scenarios should run against both where possible.

Required contracts:

- Version/capability: health, bearer auth, `/v1/capabilities`, model/profile identity, endpoint feature flags.
- Auth/security: missing token fails, wrong token fails, CORS disabled unless configured, unsupported content fails.
- Session: create, chat, stream if available, messages, fork, delete, message persistence.
- Runs: create, status, SSE events, terminal states, reconnect/poll, stop.
- Approval: pending approval, approve, deny, resume/terminate.
- Responses: `previous_response_id`, named conversation, stored response retrieval/deletion.
- Session key: `X-Hermes-Session-Key` accepted, echoed, rejects control chars, stable scoping.
- Jobs: CRUD, pause, resume, run-now, delete, in-flight cancellation.
- Profile isolation: two profiles, two ports, two model names, separate memory/session state.
- Failure limits: payload max, malformed booleans, unsupported files, malformed JSON, network timeout, 5xx recovery.
- AMTECH adapter: Manager preserves `run_id`, owner message rows, delivery decisions, work descriptors, metering rows, and repair paths across Hermes failures.

## Restricted-environment approach

Do not install or fork Hermes inside `mvp-build` as part of ordinary source work.

Recommended sequence:

1. Use this record for source audit.
2. If fork/clone is approved, clone Hermes outside `mvp-build`, preferably `/tmp` or a sibling research directory.
3. Run upstream Hermes tests first.
4. Start a disposable Hermes profile with API server enabled.
5. Run AMTECH Hermes contract tests against that real profile.
6. Only then mark runtime acceptance.

Local fake-server tests can prove Manager behavior but cannot prove Hermes runtime acceptance.

## Phase implications

Current AMTECH status after the July 3 research pass:

- Phase 3/3A/4: source-wired and locally hardened, but live runtime/provider proof remains pending.
- Phase 4 should be considered complete only at source level until real Hermes runtime acceptance exists.
- Phase 5 should use the `/v1/runs` + SSE path for production live progress, not build around one-shot snapshots.
- Phase 6 metering foundation should keep `run_id` as the correlation spine and should instrument the Hermes run lifecycle when the `/v1/runs` path is adopted.

Do not claim provider or runtime acceptance until there are real proof ids.

## Open questions for next audit

- Does current `hermes-client.ts` call `/v1/capabilities` and branch correctly, or does it assume a fixed Sessions-only surface?
- Does current `runtime.ts` reject all invented legacy endpoints?
- Should Phase 5 introduce a new `HermesRunsClient` or extend the existing Hermes client?
- Where should `X-Hermes-Session-Key` be generated and stored?
- What exact key grammar should AMTECH use for employee/account memory?
- Can `/api/jobs` be safely ignored for Phase 5, or does any existing AMTECH script assume it?
- Are current tests capable of running the same Hermes contract suite against fake and real endpoints?
- Does the run-id chain already align with Hermes `run_id`, or do we need a separate external-runtime-run id field?

## Bottom line

Hermes v0.18.0 is now a strong enough runtime target to support AMTECH's employee architecture through its public API Server. The efficient path is not to wrap private internals. It is to build a capability-detected Manager adapter around Hermes' HTTP contract, use Runs/SSE for live work, keep Sessions chat as fallback, preserve Manager ownership of product state and safety, and require real runtime contract proof before upgrading any phase to `runtime-accepted`.
