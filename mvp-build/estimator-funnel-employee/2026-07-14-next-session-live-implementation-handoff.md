# Next Session Handoff Prompt: Public Estimator Employee Live Implementation

You are taking over AMTECH as the production-minded GTM builder. Start in `/home/georgej/AMTECH/GTM-RESEARCH`, working inside `mvp-build`.

First read:

1. `identity.md`
2. `README.md`
3. `CODEGRAPH.md`
4. `mvp-build/README.md`
5. `mvp-build/CODEGRAPH.md`
6. `mvp-build/AGENTS.md`
7. `mvp-build/memory/MEMORY.md`
8. `mvp-build/estimator-funnel-employee/README.md`
9. `mvp-build/estimator-funnel-employee/2026-07-14-public-estimator-employee-plan.md`

Then inspect the source seams named in the plan before editing. The key files are:

- `mvp-build/apps/web/app/page.tsx`
- `mvp-build/apps/web/app/create-ai-employee/page.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `mvp-build/apps/manager/src/server.ts`
- `mvp-build/apps/manager/src/lib/runtime.ts`
- `mvp-build/apps/manager/src/lib/hermes-client.ts`
- `mvp-build/apps/manager/src/lib/turn-queue.ts`
- `mvp-build/apps/manager/src/lib/session-rotation.ts`
- `mvp-build/apps/manager/src/tools/estimate.stub.ts`
- `mvp-build/apps/manager/src/lib/artifact-view.ts`
- `mvp-build/apps/manager/src/lib/artifacts.ts`
- `mvp-build/apps/manager/src/lib/signed-links.ts`
- `mvp-build/packages/agent-template/skills/estimate/SKILL.md`
- `mvp-build/packages/db/migrations/`
- `mvp-build/infra/scripts/local/profile-generator-harness.mjs`
- `mvp-build/infra/scripts/local/profile-generator-probes/website-estimator.company-data.json`

The objective is to implement the smallest source-wired public estimator employee path:

public `/free-estimator` page
-> anonymous visitor session
-> per-visitor Hermes transcript/session key against one provisioned estimator employee
-> message endpoint
-> structured estimate draft artifact
-> revise
-> copy/download current draft
-> optional Resend email to the contractor visitor
-> funnel events recorded
-> concrete free-trial CTA.

Important framing:

- This is a public materialization of a real AMTECH-provisioned AI employee, not a separate estimator app, generic chatbot, or calculator.
- Keep `/` as the company/product front door. Build the acquisition experience at `/free-estimator`.
- Reuse the existing estimator employee/package if viable. Prefer `website_estimator_conversation` / company-data mode for the first proof.
- Do not reuse owner web sessions for anonymous visitors.
- Do not use `employee_sessions` active-row rotation for visitor sessions in the first milestone; it is one-active-session-per-employee and would break visitor isolation.
- The missing primitive is the visitor-session adapter: one employee, many visitor transcript ids, scoped messages, scoped artifacts, scoped funnel state.

Implementation order:

1. Add an additive migration for `public_estimator_sessions`, `public_estimator_messages`, `public_estimator_artifacts`, `public_estimator_events`, and `public_estimator_email_sends`. Keep them Manager/service-role only.
2. Add Manager service helpers for visitor token hashing/resume, funnel event recording, rate/input guards, and visitor-scoped artifact lookup.
3. Add Manager endpoints for session create/resume, message, current draft, draft action, and email.
4. Add a runtime adapter that resolves the same employee runtime but overrides `sessionId` and `sessionKey` per visitor before calling Hermes. Continue using the existing per-employee turn lock.
5. Add `/free-estimator` and web API route handlers that call Manager. The page should be the usable estimator experience immediately, not a marketing landing page.
6. Use HTML-first artifact materialization. Do not claim PDF until real PDF bytes exist through current tooling or a deterministic Manager-owned renderer.
7. Add Resend wrapper in Manager with env gates and mocked tests. Required env should include `RESEND_API_KEY`, `PUBLIC_ESTIMATOR_FROM_EMAIL`, `PUBLIC_ESTIMATOR_REPLY_TO`, `PUBLIC_ESTIMATOR_SENDING_DOMAIN=mail.amtechleads.com`, `PUBLIC_ESTIMATOR_EMPLOYEE_ID`, `PUBLIC_ESTIMATOR_ACCOUNT_ID`, and `PUBLIC_ESTIMATOR_EMAIL_ENABLED=1`.

Guardrails:

- The estimator may draft and email the contractor visitor their own estimate draft from AMTECH.
- It must not send anything to the contractor's customer/homeowner.
- It must not perform money movement, create invoices, or present AMTECH output as a guaranteed final price.
- It must not expose Hermes, MCP, tool, runtime, schema, token, stack trace, provider, or database vocabulary in public UI or public errors.
- One visitor must never read another visitor's transcript, artifact, email state, or funnel state.
- Public endpoints need size limits, rate limits, and safe error responses.
- Defer uploads unless type/size/storage visibility controls are included.

Tests to add before claiming source-wired:

- visitor session create/resume and token expiry/hash behavior;
- two visitors against one employee have different transcript ids/session keys and cannot read each other's artifacts;
- message endpoint guardrails for missing/oversized input and rate-limited calls;
- current draft/copy/download are visitor-scoped and record funnel events;
- Resend wrapper success, missing env, validation error, rate limit, idempotency conflict, and 5xx behavior;
- email endpoint refuses sends without a current draft and only sends to the visitor email.

Status discipline:

- Call the result `source-wired` only after code, migrations, and tests pass locally.
- Call runtime proof `local-proven` only with local proof ids/logs.
- Call Resend/Hermes `provider-accepted` only after real provider proof ids are captured.
- The Realness Rule applies: local proof is local proof; provider acceptance needs real provider ids.

Deliverables for this session:

- First source-wired implementation of the public estimator employee flow, or explicit env/provider gates if credentials are absent.
- Focused tests for isolation, guardrails, Resend wrapper, artifacts, and funnel events.
- Dated memory/implementation note summarizing source-wired vs provider-accepted status.
- Clear final statement of what works locally, what is gated by live credentials, and the exact proof IDs still needed.
