# Phase 3 Finish Session Handoff Prompt

Status: active

Purpose: copy this prompt into the next implementation session when the agent should finish Phase 3 from the current partial Gmail implementation, preserve the design research, and prepare clean Phase 4/5 seams without faking provider acceptance.

Use this after reading:

- [`../CODEGRAPH.md`](../CODEGRAPH.md)
- [`README.md`](README.md)
- [`implementation-records/README.md`](implementation-records/README.md)
- [`implementation-records/2026-06-29-phase-0-2-record.md`](implementation-records/2026-06-29-phase-0-2-record.md)
- [`implementation-records/2026-06-29-phase-3-partial-record.md`](implementation-records/2026-06-29-phase-3-partial-record.md)
- [`old-build-plan/README.md`](old-build-plan/README.md)
- [`old-build-plan/08-connectors-email-v1.md`](old-build-plan/08-connectors-email-v1.md)
- [`old-build-plan/09-event-mesh-v1.md`](old-build-plan/09-event-mesh-v1.md)
- [`old-build-plan/10-security-ops-observability.md`](old-build-plan/10-security-ops-observability.md)
- [`old-build-plan/14-agentic-tooling-research-notes.md`](old-build-plan/14-agentic-tooling-research-notes.md)
- [`old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md)
- [`phase-3-generative-ui-reframe.md`](phase-3-generative-ui-reframe.md)

## Copy-Ready Prompt

```text
You are the implementation agent for the AMTECH AI Employee MVP in /home/georgej/AMTECH/GTM-RESEARCH.

First read identity.md and embody it. Then read CODEGRAPH.md, wiki/README.md, wiki/MVP/prompting-guide.md, wiki/MVP/old-build-plan/README.md, wiki/MVP/implementation-records/README.md, wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md, wiki/MVP/implementation-records/2026-06-29-phase-3-partial-record.md, and wiki/MVP/phase-3-generative-ui-reframe.md.

Session objective:

Finish Phase 3 from the current partial Gmail implementation. Do not restart from the old "Gmail groundwork only" assumption. The code already has real source-level seams for Google OAuth/token custody, Gmail REST, MIME sends, watch/history, Pub/Sub decoding, reply dedupe, normalized employee events, and tests. Your job is to close the remaining provider/user-experience gaps and leave an honest record of what is provider-accepted.

Current implemented Phase 3 source to inspect before editing:

- mvp-build/packages/db/migrations/0005_phase3_gmail.sql
- mvp-build/apps/manager/src/lib/google-gmail.ts
- mvp-build/apps/manager/src/lib/gmail-tokens.ts
- mvp-build/apps/manager/src/lib/mime.ts
- mvp-build/apps/manager/src/lib/pubsub.ts
- mvp-build/apps/manager/src/lib/employee-events.ts
- mvp-build/apps/manager/src/tools/gmail.stub.ts
- mvp-build/apps/manager/src/webhooks/gmail.ts
- mvp-build/tests/unit/google-gmail.test.ts
- mvp-build/tests/unit/mime.test.ts
- mvp-build/tests/unit/gmail-send.test.ts
- mvp-build/tests/unit/gmail-pubsub.test.ts

Local checks before this handoff passed:

- npm run typecheck
- npm run test:unit (15 files, 70 tests)
- npm run build
- npm run lint

Primary Phase 3 finish work:

1. Verify/apply the Phase 3 schema in a real Supabase project when DATABASE_URL is available.
2. Wire and test live Gmail OAuth callback with GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI or MANAGER_API_ORIGIN.
3. Run a real connector test: Gmail profile, scope validation, watch start/renew, watch expiration/history id persisted.
4. Send a real approved Gmail email from an estimate artifact: PDF attachment first; signed-link fallback explicit when attachment bytes are missing/unavailable.
5. Configure Pub/Sub push for Gmail watch and verify real push delivery.
6. Harden Pub/Sub authentication from current claim validation to full RS256/JWKS signature verification for production.
7. Process a real customer reply with history.list, dedupe, thread mapping, inbound_email_events, inbound_events, and employee_messages.
8. Fix owner event delivery: load/pass the verified owner phone so important Gmail reply notifications can produce Twilio MessageSid proof when SMS is configured.
9. Build the Phase 3 Work Surface rendering seam from wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md and wiki/MVP/phase-3-generative-ui-reframe.md: external event -> typed work-event descriptor -> notify/question/review card in web and concise SMS text. Owner must never see raw tool names, JSON, stack traces, or webhook payloads.
10. Add focused tests for any changed behavior: owner-phone event delivery, Pub/Sub JWT hardening, watch renewal/fallback sync, Work Surface event rendering, and cross-account denial.

Design constraints:

- Owner talks only to the employee. Manager is backend-only.
- Approval gate before any external send or money action.
- Secrets by reference; never log raw OAuth tokens, full email bodies, raw webhook bodies, or provider secrets.
- OpenAI-compatible onboarding remains a portability boundary, not the architecture.
- Hermes/MCP/Manager tools are the durable functional surface.
- Use the deliverable-driven surface principle: outbound_message and money_movement types drive preview, proof, and gate consistently across SMS/web.
- Treat generative UI as conformance-first: the agent selects and fills pre-approved typed components; do not let arbitrary model-generated markup reach the owner-facing money/customer gate.
- Provider acceptance requires real proof ids: Gmail message/thread/history ids, Pub/Sub message/watch proof, Twilio MessageSid for SMS delivery where relevant, artifact ids/links, approval ids.

Phase 4/5 groundwork allowed only if it creates real seams without faking acceptance:

- Stripe: keep approval-gated invoice contracts, Stripe-Signature verification, test-mode guardrails, idempotency keys, and estimate/customer/account links.
- Reminders/events: use the same normalized event rail and Work Surface renderings; Hermes Jobs/Cron can be a scheduler seam, but AMTECH reminder records remain source of truth.

Do not rewrite the original 00-13 build-plan docs. Implementation facts belong in wiki/MVP/implementation-records/, CODEGRAPH.md, mvp-build/README.md, and focused addenda/handoffs. Update wiki/README.md and the root index.html explorer if you add pages or important source files.

Verification required before final answer:

- npm run typecheck
- npm run test:unit
- npm run build
- npm run lint
- Run provider smoke checks only if required env is available; otherwise state exact env vars missing and keep provider acceptance pending.

Final answer should separate:

- Implemented in code
- Locally verified
- Provider-accepted with proof ids
- Still pending
```
