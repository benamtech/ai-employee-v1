# Agentic Tooling Research Notes

Status: active

Date: 2026-06-29

Purpose: record current-docs research for expanding the functional surface of the AMTECH AI Employee through Hermes, MCP, Manager tools, provider connectors, artifacts, approvals, and event delivery. This is an implementation addendum to the build packet, not a replacement for the original plan.

## Executive Decision

The right architecture is Hermes-first and tool-first:

- Hermes is the employee runtime and the surface to extend aggressively: profiles, skills, memory, API server, Runs/Sessions/Jobs, messaging gateways, webhooks, MCP servers, and filtered toolsets.
- MCP is the durable agentic tool contract: tools for actions, resources for readable context/artifact state, prompts for reusable workflows, strict schemas for inputs/outputs, and human approval for risky operations.
- Manager remains the AMTECH-owned control plane: tenancy, account authority, provider credentials, provider signatures, idempotency, audit, artifacts, approvals, and normalized events.
- The owner experience stays one relationship: the owner talks to the employee through SMS/web. Artifacts, connector consent, approvals, and provider proofs are rendered by AMTECH surfaces around that employee.
- The OpenAI-compatible note is only for onboarding technical simplicity and model/API portability. It should not become the architecture. Models can change; Manager tools, Hermes capabilities, MCP contracts, provider proofs, and artifact/approval flows are the product.

## Primary Sources Checked

- MCP latest specification: <https://modelcontextprotocol.io/specification/2025-11-25>
- MCP tools: <https://modelcontextprotocol.io/specification/2025-11-25/server/tools>
- MCP resources: <https://modelcontextprotocol.io/specification/2025-11-25/server/resources>
- MCP authorization: <https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization>
- Hermes MCP: <https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp>
- Hermes API server: <https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server>
- Hermes tools/toolsets: <https://hermes-agent.nousresearch.com/docs/user-guide/features/tools>
- Hermes plugins: <https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins>
- Hermes skills: <https://hermes-agent.nousresearch.com/docs/user-guide/features/skills>
- Hermes memory: <https://hermes-agent.nousresearch.com/docs/user-guide/features/memory>
- Hermes webhooks: <https://hermes-agent.nousresearch.com/docs/user-guide/messaging/webhooks>
- Hermes SMS: <https://hermes-agent.nousresearch.com/docs/user-guide/messaging/sms>
- Gmail sending: <https://developers.google.com/workspace/gmail/api/guides/sending>
- Gmail `users.messages.send`: <https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send>
- Gmail push notifications: <https://developers.google.com/workspace/gmail/api/guides/push>
- Gmail `users.history.list`: <https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list>
- Google OAuth scopes: <https://developers.google.com/identity/protocols/oauth2/scopes>
- Pub/Sub push: <https://docs.cloud.google.com/pubsub/docs/push>
- Pub/Sub authenticated push: <https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions>
- Stripe MCP: <https://docs.stripe.com/mcp>
- Stripe Connect onboarding/account links: <https://docs.stripe.com/connect/connect-onboarding>
- Stripe invoicing API integration: <https://docs.stripe.com/invoicing/integration>
- Stripe webhook signature verification: <https://docs.stripe.com/webhooks/signature>
- Stripe idempotent requests: <https://docs.stripe.com/api/idempotent_requests>
- Twilio webhook security: <https://www.twilio.com/docs/usage/webhooks/webhooks-security>
- Twilio incoming message webhook: <https://www.twilio.com/docs/messaging/guides/webhook-request>
- Twilio outbound message status callbacks: <https://www.twilio.com/docs/messaging/guides/track-outbound-message-status>
- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase Storage access control: <https://supabase.com/docs/guides/storage/security/access-control>
- Supabase changelog: <https://supabase.com/changelog>
- OpenAI Structured Outputs: <https://developers.openai.com/api/docs/guides/structured-outputs>
- OpenAI function calling: <https://developers.openai.com/api/docs/guides/function-calling>
- xAI structured outputs: <https://docs.x.ai/developers/model-capabilities/text/structured-outputs>
- xAI chat API: <https://docs.x.ai/developers/rest-api-reference/inference/chat>

## Hermes Functional Surface To Extend

Use Hermes as more than a chat relay:

- API server: AMTECH should call Hermes server-to-server through the API server, not expose raw Hermes bearer credentials to browsers. Use Responses for conversational continuity, Runs/SSE for long work and tool progress, Sessions for scoped state, Jobs for scheduled/background work, `/v1/capabilities` for health, and `/v1/skills` plus `/v1/toolsets` for runtime discovery.
- Messaging gateways: SMS and webhooks are first-class surfaces. Use Hermes messaging where it reduces custom glue, but keep Manager in front of provider verification, tenancy mapping, idempotency, and business event normalization.
- MCP client: Hermes should connect to AMTECH-approved MCP servers with include lists. Expose only tools that match the employee profile and current account state.
- MCP server: where useful, Hermes can expose messaging/conversation tools to other MCP clients, but AMTECH should treat that as an internal/admin integration until the tenancy and permission model is explicit.
- Skills and memory: package contractor-estimator behavior as skills/context, keep long-lived owner/business facts in controlled memory/business-brain surfaces, and avoid stuffing provider secrets or full private content into memory.
- Plugins/custom tools: use Hermes plugins only for runtime-local utility. Provider-critical actions should still go through Manager so audit, approval, and proof remain centralized.
- Parallel tools: allow only for safe read-only or independent operations. Avoid parallel writes against provider state, approvals, connector setup, payment actions, or shared artifact records.

## MCP Contract Rules

Manager tools should be shaped so they can be exposed directly or through MCP without changing semantics:

- Names should be stable, ASCII, unique, and specific.
- Each tool needs strict `inputSchema`; high-value tools should also have `outputSchema`.
- Tool results should return structured data that maps to MCP `structuredContent`, plus a human-readable summary where useful.
- Tool execution errors should be returned as execution failures the model can recover from, while protocol/auth/validation failures should remain hard errors.
- Read/context surfaces should become MCP resources where possible: business brain facts, connector status, artifact metadata, approval status, event traces, runtime health, entitlement state, and work queues.
- Sensitive/mutating operations require human approval and proof: external email send, invoice send, money movement/refunds, scope expansion, destructive provider changes, and credential changes.
- The client/UI must show the user what is about to happen before approval and must record the approved payload hash or equivalent audit reference.

## Provider Strategy

Use provider APIs directly in Manager for security-critical actions. Use provider MCPs as research/admin accelerators or filtered employee tools only after permissioning is explicit.

Gmail:

- Send is RFC 2822/MIME, base64url encoded in `raw`, then sent with `users.messages.send`.
- Store Gmail message id, thread id, watch expiration, and last known `historyId`.
- Gmail push uses Pub/Sub; `users.watch` must be renewed before the documented seven-day expiration, with daily renewal preferred.
- Pub/Sub notification data is base64url JSON with `emailAddress` and `historyId`; Manager must call `history.list` from the stored history id, page through results, dedupe, and full-sync on stale/invalid `startHistoryId`.
- Authenticated Pub/Sub push should verify the OIDC bearer JWT: signature, issuer, audience, expected service-account email, `email_verified`, issue/expiry times.

Stripe:

- Stripe MCP is useful for agent-assisted implementation and documentation/API exploration, but production invoice/send/payment state should be mediated by Manager.
- Account Links are one-time, short-lived, and should be shown only inside the authenticated AMTECH app. `refresh_url` must mint a new link; `return_url` is not proof of completed requirements.
- Deposit invoice flow should create customer/product/price or invoice items, create a draft invoice with `collection_method=send_invoice`, finalize, send, and listen for `invoice.paid`.
- Use `Idempotency-Key` for POST retries and store the key on AMTECH intent records.
- Verify `Stripe-Signature` against the raw body and endpoint secret before any state mutation.

Twilio:

- Inbound SMS authority requires validating `X-Twilio-Signature` with the exact URL and body handling expected by the Twilio SDK.
- SMS sender identity is not business authority by itself; it must map to a verified owner/account and the expected employee route.
- Store Twilio message SID/status callback evidence for outbound proof and notification reliability.

Supabase:

- Browser code never receives service-role or secret keys.
- Public/exposed schemas need RLS. Policies must combine `TO authenticated` with ownership predicates, not only role checks.
- Private artifacts belong in private buckets with RLS on `storage.objects`; AMTECH should issue signed artifact links through Manager-owned authorization paths.
- Do not make auth decisions from user-editable metadata. Use app metadata or AMTECH-owned tables.

## Artifact, Approval, And Connected-Tool UX

Artifacts, tools, and approvals should feel like part of the employee, not separate admin screens:

- The employee says what it produced or wants to do.
- The web wrapper renders the artifact, connector status, tool proof, and approval controls.
- SMS gets a concise prompt plus signed link where inspection is needed.
- Approval buttons are UI affordances over the same Manager approval primitive used by SMS.
- Connected-tool setup should start from the employee conversation, move through an authenticated AMTECH consent surface, then return as employee context: connected, needs reconnect, limited scope, test passed, or test failed.
- Provider events should become employee messages with business meaning, not raw webhook alerts.

## Phase Notes

Phase 0-2 loose ends:

- Add schema/RLS tests for account ownership, artifacts, approvals, connectors, events, and private storage.
- Add Manager tool contract tests that validate envelopes, proof fields, idempotency behavior, and approval gates.
- Add runtime health checks against Hermes capability/toolset discovery once a real Hermes runtime is available in the environment.

Phase 3 Gmail:

- Complete OAuth exchange/refresh and persist secret references, not raw tokens in app tables/logs.
- Implement draft/send with MIME attachment plus signed-link fallback.
- Implement watch renewal, Pub/Sub authenticated push validation, `history.list` sync, stale-history full-sync behavior, thread matching, dedupe, and safe snippet logging.
- Normalize customer replies into `gmail.reply_received` employee events and route them through Hermes/Manager to SMS/web.

Phase 4 Stripe:

- Implement Connect test-mode onboarding with authenticated account-link display, refresh/return handling, account requirements checks, and no link delivery by SMS/email.
- Implement approved deposit invoice creation/send, webhook verification, idempotent retries, hosted invoice/payment URL storage, and employee event routing.
- Treat Stripe MCP as a helpful implementation/admin surface, not the production payment authority.

Phase 5 reminders:

- Prefer Hermes Jobs/Cron where it gives reliable employee-native scheduling; keep AMTECH reminder records as the source of truth.
- Store reminder proof and route reminder notifications through the same employee event path.

## Research Conclusion

The build plan made the right choice: front-door onboarding can stay OpenAI-compatible for portability, but AMTECH should invest most of the functional surface in Hermes extension, MCP-compatible Manager tools/resources, provider-backed events, and artifact/approval UX. The smooth experience is: user opens chat over web/SMS, onboarding extracts a manifest, verified account setup calls `provision_employee`, Hermes profile/runtime comes live, Manager tools expose safe capabilities, and the owner keeps interacting with one employee while connected tools and artifacts appear as natural parts of that employee's work.

> **The owner-facing rendering of all of this is its own design problem — see [`15-interaction-reimagined-the-work-surface.md`](15-interaction-reimagined-the-work-surface.md) (the "Macintosh moment").** This addendum is the *mechanics*; doc 15 is how those mechanics become a coworker a painter trusts.

---

## Most Efficient Interaction In Our Agentic Context (addendum, 2026-06-29)

Grounded in the Hermes **API server** surface (fetched 2026-06-29: Runs + `/v1/runs/{id}/events` SSE, `hermes.tool.progress`, Sessions `/chat/stream` emitting `assistant.delta|tool.started|tool.completed|run.completed`, Jobs, `/v1/runs/{id}/approval` + `run_approval` capability flag, `/v1/capabilities|skills|toolsets`, `X-Hermes-Session-Key`) plus the MCP/provider sources above. Focus: the *cheapest, most reliable* way for AMTECH's agents (front-door orchestrator, the live employee, the Manager) to drive tools and feed surfaces.

### A. Pick the right Hermes call shape per job (don't default to chat)
- **`/v1/chat/completions`** (stateless) — front-door orchestrator turns, where the Manager owns state in `onboarding_sessions`. Cheapest + portable (keeps the OpenAI-compatible decision intact).
- **`/v1/responses`** (`previous_response_id` / `conversation`) — when we want Hermes to hold tool-call history server-side (some employee conversational turns).
- **`/v1/runs` + `/v1/runs/{id}/events` SSE** — long/agentic work needing progress + **attach/detach without losing state**; the owner Work Surface and any "doing it now" rendering. Use `/stop` for owner override, `/approval` for the gate.
- **`/api/sessions/{id}/chat/stream`** — the cleanest event vocabulary (`assistant.delta`, `tool.started/completed`, `run.completed`); **preferred feed for the Hermes→Work adapter** (doc 15 §5).
- **`/api/jobs`** — scheduled/background work (check-ins, repeatable tasks) instead of a custom scheduler. The AMTECH `reminders` table stays source of truth; Jobs is the runner (Phase 5).
- **Discovery** (`/v1/capabilities|skills|toolsets`) — health + an honest "what I can do" surface; **cache it**, refresh on connector change, don't poll per render.

### B. Token economics — the wake-the-big-model rule
- **Triage before reasoning.** Most events deserve a cheap tier (rules or `claude-haiku-4-5`) deciding *notify / batch / ignore*; spend `claude-opus-4-8` only at the point of **human meaning** (what/whether/how to tell the owner). The `[SILENT]` check-in is this pattern, generalized.
- **`deliver_only` for zero-token literal notices** via the Hermes webhook adapter when no reasoning is needed ("invoice paid" → templated line).
- **Structured payloads on internal hops; English only at the edge.** "Agent-to-agent" is the interface and future-proofing, not a mandate to parse prose at every step.
- **Prompt caching:** keep the stable prefix (`SOUL`/`AGENTS`/business-brain/system) first and *constant* so provider prompt caches hit; vary only the tail. Big cost lever on every employee turn.
- **Model routing** per [`../../principle-agent-leverage.md`](../../principle-agent-leverage.md): opus default employee, haiku for compression/background/triage, founder reserved for Tier-D gates.

### C. MCP contract efficiency — resources vs tools
- **Read/context = MCP resources, not tool calls** (business-brain facts, connector status, artifact metadata, approval status, runtime health, work queues): cacheable, no round-trip reasoning, cheaper than a tool invocation.
- **Mutations = tools** with strict `inputSchema` (+ `outputSchema` on high-value); return `structuredContent` + a short human summary.
- **Errors:** tool *execution* failures returned as recoverable (model retries); protocol/auth/validation failures stay hard errors.
- **Narrow allowlists per employee** — tool selection is product design; the owner sees "connect my email," never a tool catalog. Dangerous tools (refund/delete/broad-write) filtered out by default until the surface + gate support them.

### D. Parallelism + idempotency
- **Parallel tools only for safe, independent reads.** Never parallel writes to provider state, approvals, connector setup, payments, or shared artifacts.
- **Idempotency everywhere it touches a provider:** Stripe `Idempotency-Key` (store it on the intent record); Gmail dedupe by message id (`threadId:historyId:messageId`); provider-event dedupe by provider id; provisioning by `idempotency_key`. Carried in the data model already (`03`).
- **Batch + dedup at the account layer** (ten events/minute → one digest), beyond Hermes route-level idempotency.

### E. The event→meaning pipeline (efficiency view of doc 15's adapter)
`provider/Hermes event → Manager normalize + dedup → cheap triage (notify/batch/ignore) → only if business judgment is needed, wake the employee with a compact structured payload → employee emits ONE owner-facing line → surface renders.` Never surface raw tool names; collapse bursts; narrate only work slow enough to matter. This is where the spend is justified and nowhere else.

### F. Phase 3 application (Gmail), efficiency-first
- **Event-driven, not polling:** Gmail Pub/Sub **push** → verify the authenticated OIDC JWT → `history.list` from stored `historyId` (page + dedupe) → normalize a *safe snippet* (no raw bodies in logs) → cheap triage → employee composes the notify/question line → SMS. `deliver_only` for trivial confirmations.
- **Connector verify is the agent's job** (proactive competence): connect → test → report in one employee turn; the owner never says "…and test it."
- **Watch renewal** as a Hermes Job/cron (daily, before the 7-day expiry) rather than ad-hoc — reliable and cheap.
