# Phase 3 Implementation Session Handoff Prompt

Status: active

Purpose: copy this prompt into a fresh implementation session when the next agent should tie up all Phase 0-2 loose ends, fully implement Phase 3 Gmail, and lay as much Phase 4 Stripe and Phase 5 reminder/event groundwork as is responsible without faking provider acceptance.

Use this after reading:

- [`../CODEGRAPH.md`](../../CODEGRAPH.md)
- [`implementation-records/README.md`](implementation-records/README.md)
- [`implementation-records/2026-06-29-phase-0-2-record.md`](implementation-records/2026-06-29-phase-0-2-record.md)
- [`old-build-plan/README.md`](old-build-plan/README.md)
- [`old-build-plan/08-connectors-email-v1.md`](old-build-plan/08-connectors-email-v1.md)
- [`old-build-plan/09-event-mesh-v1.md`](old-build-plan/09-event-mesh-v1.md)
- [`old-build-plan/10-security-ops-observability.md`](old-build-plan/10-security-ops-observability.md)
- [`old-build-plan/12-tests-demo-acceptance.md`](old-build-plan/12-tests-demo-acceptance.md)

## Copy-Ready Prompt

```text
You are the implementation agent for the AMTECH AI Employee MVP in the repository at /home/georgej/AMTECH/GTM-RESEARCH.

Your session objective is:

1. Tie up all loose ends from Phase 0, Phase 1, and Phase 2.
2. Fully implement Phase 3: Gmail OAuth, connector test, approved email send with the estimate PDF/link, Gmail watch/Pub/Sub/history sync, real customer reply normalization, and employee/owner notification wiring.
3. Lay as much Phase 4 and Phase 5 groundwork and wiring as possible without falsely claiming those phases are accepted.

Do not alter the original build-plan packet unless the user explicitly asks. The build-plan packet is the product/source plan. Current implementation facts belong in implementation records and CODEGRAPH updates.

Start by reading these files in this order:

1. identity.md, if present.
2. CODEGRAPH.md.
3. wiki/README.md.
4. wiki/MVP/prompting-guide.md.
5. wiki/product-ai-employee-context.md.
6. wiki/product-agent-platform-architecture.md.
7. wiki/MVP/old-build-plan/README.md.
8. wiki/MVP/old-build-plan/00-source-of-truth-and-rules.md.
9. wiki/MVP/old-build-plan/01-mvp-scope-and-milestones.md.
10. wiki/MVP/old-build-plan/02-system-architecture.md.
11. wiki/MVP/old-build-plan/03-data-model.md.
12. wiki/MVP/old-build-plan/04-manager-tools.md.
13. wiki/MVP/old-build-plan/05-front-door-orchestrator.md.
14. wiki/MVP/old-build-plan/06-interaction-wrapper.md.
15. wiki/MVP/old-build-plan/07-provisioning-runtime.md.
16. wiki/MVP/old-build-plan/08-connectors-email-v1.md.
17. wiki/MVP/old-build-plan/09-event-mesh-v1.md.
18. wiki/MVP/old-build-plan/10-security-ops-observability.md.
19. wiki/MVP/old-build-plan/11-agent-team-workstreams.md.
20. wiki/MVP/old-build-plan/12-tests-demo-acceptance.md.
21. wiki/MVP/old-build-plan/13-backlog-non-goals.md.
22. wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md.
23. wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md.
24. wiki/MVP/phase-3-generative-ui-reframe.md.
25. wiki/MVP/implementation-records/README.md.
26. wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md.
27. mvp-build/README.md.
28. mvp-build/package.json.

Then inspect the codebase before editing. Use the codegraph and actual files, not memory. At minimum inspect:

- mvp-build/packages/shared/src/tool-contracts.ts
- mvp-build/packages/shared/src/routes.ts
- mvp-build/packages/shared/src/event-types.ts
- mvp-build/apps/manager/src/tools/registry.ts
- mvp-build/apps/manager/src/tools/gmail.stub.ts
- mvp-build/apps/manager/src/tools/stripe.stub.ts
- mvp-build/apps/manager/src/tools/events.stub.ts
- mvp-build/apps/manager/src/webhooks/gmail.ts
- mvp-build/apps/manager/src/webhooks/stripe.ts
- mvp-build/apps/manager/src/lib/oauth-state.ts
- mvp-build/apps/manager/src/lib/secrets.ts
- mvp-build/apps/manager/src/server.ts
- mvp-build/apps/web/app/agent/[employeeId] and related API routes
- mvp-build/packages/db/migrations
- mvp-build/tests/README.md
- mvp-build/tests/unit
- mvp-build/tests/integration/rls-cross-account.test.ts
- mvp-build/tests/golden-path

Core product truth:

- The MVP is not complete until the whole loop works against real provider rails: signup/claim/SMS onboarding -> live employee over SMS and web -> walkthrough-to-estimate -> real PDF + signed link -> approved Gmail send -> real Gmail customer reply event -> approved Stripe Connect test-mode deposit invoice/payment link -> internal reminder.
- No payment gate before employee creation.
- No external customer send, invoice, money movement, or customer-visible action without owner approval.
- Raw Hermes dashboards are not customer UI.
- Provider acceptance requires real proof ids: Twilio SID, Gmail message/thread/history/watch ids, Stripe account/invoice/payment/webhook ids, artifact id/link, approval id, runtime health record, and audit ids where applicable.
- Manual provider-result injection does not satisfy MVP acceptance.
- Manager is the backend control plane. The owner talks to the employee; employee/tool calls reach Manager.
- Keep the onboarding/front-door LLM OpenAI-compatible. It currently supports OpenAI-compatible Chat Completions and structured JSON output with OpenAI/XAI/Grok-style API key routing. Do not hardwire the workflow to a single model provider.

Current implementation state to verify:

- Phase 0, Phase 1, and Phase 2 are wired in code, but provider/runtime acceptance is still pending.
- Local checks previously passed: npm run typecheck, npm run test:unit, npm run build, npm run lint.
- Known gaps to close before or during this session:
  - Supabase db status and migrations need a real DATABASE_URL.
  - RLS cross-account integration test is still a skeleton.
  - Full Phase 2 Manager artifact/approval state transitions need better unit or integration coverage.
  - Phase 2 golden path is documented but not executable.
  - Real Supabase Storage, signed artifact-link access, owner-session access, and cross-account denial need proof in a configured environment.
  - Real Twilio Verify/SMS/Hermes/Caddy acceptance may still be pending depending on env availability.

Execution protocol:

1. First orient with a short source-memory note: files read, current state, and any blocking environment gaps.
2. Inspect implementation reality and list the exact loose ends for Phase 0-2.
3. Fix Phase 0-2 loose ends that are code/test/doc solvable in this workspace.
4. Implement Phase 3 end to end in code.
5. Add Phase 4/5 groundwork only where it creates real useful seams for the next phases and does not fake completion.
6. Run validation after meaningful changes. At minimum run npm run typecheck, npm run test:unit, npm run build, and npm run lint from mvp-build. If env exists, run db status/migration checks and any provider smoke scripts. If env is missing, report the exact missing variables.
7. Update implementation records, CODEGRAPH, wiki indexes, and mvp-build README as needed. Do not rewrite the original build-plan docs unless explicitly requested.

Phase 0-2 loose-end acceptance:

- Build/test/lint pass after your changes.
- RLS cross-account denial has an executable test or a clearly named provider/env-gated integration test with exact setup.
- Phase 2 artifact/approval Manager tools have sensible tests for create/render/sign/resolve/approve/reject and cross-account denial behavior.
- The golden path is either executable or the remaining manual steps are precise and provider-proof-oriented.
- Any provider-backed proof that cannot be run locally is recorded honestly as pending with required env vars and proof ids.

Phase 3 required implementation:

1. Gmail OAuth:
   - Complete the OAuth callback route.
   - Validate OAuth state.
   - Exchange code for tokens with Google.
   - Store tokens by secret reference, not raw token in normal tables or logs.
   - Persist connector identity, scopes, status, email/profile identity, refresh/token expiry metadata as appropriate.
   - Support reconnect/revoke paths as far as the data model and tools allow.

2. Gmail connector test:
   - Implement test_email_connector.
   - Refresh token if needed.
   - Fetch Gmail profile identity.
   - Verify scopes/identity.
   - Start or renew watch where configured, or clearly report that watch setup is unavailable.
   - Return provider proof fields.

3. Email draft and approval:
   - Preserve existing create_email_draft behavior and harden it.
   - Validate account/employee ownership.
   - Validate artifact attachment ownership and availability.
   - Require owner approval before send.
   - Ensure approval state and outbound_email state remain consistent/idempotent.

4. Gmail send:
   - Implement send_email_draft.
   - Build a MIME/RFC 2822 message with safe subject/body, PDF attachment where available, and signed artifact link fallback.
   - Base64url encode and call Gmail users.messages.send.
   - Store Gmail message id, thread id, send proof, status, sent_at, and audit trail.
   - Do not send without approval.
   - Do not log full email bodies, tokens, or secrets.

5. Gmail watch/Pub/Sub/history:
   - Implement start/renew listener behavior if it is a separate tool.
   - Implement handle_gmail_pubsub route and tool.
   - Decode Pub/Sub payload safely.
   - Verify delivery/auth where configured.
   - Load connector by email address/account mapping.
   - Call history.list from stored historyId.
   - Identify new messages in known estimate/customer threads.
   - Dedupe by Gmail message id or threadId:historyId:messageId.
   - Advance stored historyId safely.
   - Store inbound_email_events with provider proof and processing status.

6. Reply normalization and employee delivery:
- Normalize a safe snippet/summary without storing raw sensitive email contents in normal logs.
- Link reply to account, employee, estimate/artifact, and email thread where possible.
- Deliver a structured event to the employee runtime or event table using existing Manager/Event seams.
- The employee should text or surface to the owner with context and a proposed next action, not a raw webhook dump.
- The same normalized reply should produce a typed work-event descriptor that renders as a concise SMS prompt and a Work Surface notify/question/review card. Generative UI here means a pre-approved typed component selected and filled by data, not arbitrary model-generated markup.

7. Repair/ops:
   - Add or wire repair paths for reconnect Gmail, renew watch, replay history range, redeliver employee event, suppress duplicates/noisy source as appropriate for this phase.
   - Add observability: connector status, watch expiration, last history id, sent message ids, reply event traces, audit ids.

Phase 3 tests:

- Unit tests for OAuth state/callback validation, token refresh handling, MIME builder, base64url encoding, attachment/link fallback, approval-required send guard, Pub/Sub decoding, history sync dedupe, and reply normalization.
- Integration-style tests with mocked Google HTTP endpoints for OAuth exchange, profile fetch, send, watch, and history.list.
- Negative tests for forged/invalid Pub/Sub where verification is configured, wrong account/employee ownership, missing approval, revoked connector, expired token refresh failure, and duplicate Gmail message events.
- Golden-path doc or executable script for: connect Gmail -> connector test -> create draft with estimate artifact -> approve -> send -> process real or mocked provider reply -> employee event.
- Do not mark Gmail accepted unless real provider proof exists in the configured environment.

Phase 4 groundwork and wiring:

- Keep Stripe in test mode for MVP.
- Leave current Stripe not_implemented behavior honest unless you implement a real piece.
- Add or harden shared input/output contracts and data seams for connect_stripe, account links, onboarding callback, deposit invoice creation, send invoice, webhook handling, and connection status.
- Add signature-verification helper/tests for Stripe webhooks if not present.
- Add test-mode guardrails: reject live-mode events unless an explicit live-pilot flag is enabled.
- Add owner approval gate for invoice creation/send.
- Prepare invoice state/events to link to approved estimate, customer, account, employee, and Stripe connected account.
- Provider acceptance for Phase 4 requires Stripe connected account id, account link/onboarding proof, invoice id, hosted invoice URL, and verified webhook event id. Do not claim this unless real Stripe test-mode calls prove it.

Phase 5 groundwork and wiring:

- Add or harden contracts/data seams for set_internal_reminder and get_reminders.
- Make reminder creation linkable to customer reply, approved estimate, Stripe invoice/payment state, job commitment, account, and employee.
- Preserve SMS as the default important-event notification channel.
- Add idempotency and audit fields for reminder creation and delivery.
- Google Calendar is only an offer/fast-follow; internal reminder is the MVP requirement.
- Provider/runtime acceptance for Phase 5 requires a reminder id, scheduled state, and SMS reminder proof where env allows.

Implementation quality bar:

- Prefer existing local patterns over new abstractions.
- Keep changes scoped to the MVP build home and necessary wiki/codegraph records.
- Use structured parsing and typed contracts, not ad hoc string parsing, where the codebase provides helpers.
- Return Manager tool envelopes consistently with proof fields.
- Maintain authorization boundaries: owner/account/employee IDs must match; cross-account access must fail.
- Handle idempotency for provider webhooks/events.
- Store secrets by reference; never log raw OAuth tokens, refresh tokens, API keys, webhook signing secrets, full email bodies, or customer-sensitive payment contents.
- Keep OpenAI-compatible onboarding model routing intact.

Final response required:

- Summarize what you implemented by phase.
- List all files changed at a high level.
- List validation commands run and their outcomes.
- List provider acceptance still pending with exact env vars/proof ids needed.
- Name any tests you did not run and why.
- Confirm whether the original build-plan docs were untouched.
- Point to the updated implementation record and CODEGRAPH lines.
```
