# Public Estimator Employee GTM And Implementation Plan

Date: 2026-07-14
Status: plan-only; no production source changes in this pass
Current branch: `agent/gtm-public-estimator-handoff` at `fde56b1`
Founder prior: make the public landing-page estimator employee real enough to put in front of contractors quickly.

## Objective

Create one no-signup public estimator flow that proves AMTECH can materialize a provisioned AI employee as an acquisition surface:

visitor -> public estimator page -> isolated visitor session -> live estimator employee turn -> estimate draft artifact -> revise -> download/copy -> optional Resend email from AMTECH -> funnel state -> CTA into free AI Employee trial.

The wedge is not "free estimate software." The wedge is: "Try an AMTECH employee on one real job. If it is useful, make it remember your pricing, format, materials, service area, and follow-up rules."

## Source Audit Summary

Read before planning:

- Root strategy and product docs establish AMTECH as an AI employee factory and owner-operated contractor beachhead.
- `wiki/gtm/free-estimator-funnel.md`, `wiki/offers/estimator-whole-product.md`, and estimator research docs already point at this exact funnel.
- `mvp-build/memory/2026-07-14-1225-next-session-gtm-public-estimator.md` confirms this handoff is the intended next session.
- `mvp-build/second-half-plan/estimator-product-limits-research.md` identifies visitor-session isolation and deterministic PDF materialization as the two primary missing primitives.

Inspected source seams:

- `apps/web/app/page.tsx` is a general public front door; it should remain the company/product landing page.
- `apps/web/app/create-ai-employee/page.tsx` is the current signup/claim entry.
- `apps/web/app/agent/[employeeId]/AgentClient.tsx` is the authenticated owner work surface and should not be forked into the public visitor experience.
- `apps/manager/src/server.ts` has owner-authenticated `/manager/employee/:employeeId/message`, heartbeat, snapshot, and artifact resolve routes. These require `owner_session_token` or signed artifact tokens today.
- `apps/manager/src/lib/runtime.ts` sends owner turns through `deliverOwnerTurnToRuntime`.
- `apps/manager/src/lib/turn-queue.ts` serializes work per employee through `employee_turn_jobs` and `employee_turn_locks`.
- `apps/manager/src/lib/hermes-client.ts` resolves one runtime API per employee and uses `runtime_endpoints.api_session_id` plus `api_session_key` for the current owner thread.
- `apps/manager/src/lib/session-rotation.ts` tracks one active `employee_sessions` row per employee. This is correct for the owner thread, but not suitable for many anonymous visitor conversations.
- `apps/manager/src/tools/estimate.stub.ts` already creates structured estimate artifacts. PDF storage exists only when valid PDF bytes are supplied.
- `apps/manager/src/lib/artifact-view.ts` provides a deterministic, escaped HTML fallback for structured artifact payloads.
- `apps/manager/src/lib/artifacts.ts` enforces PDF header, checksum, max size, storage path, and signed storage URL behavior for stored PDFs.
- `apps/manager/src/lib/signed-links.ts` supports HMAC claim, artifact, and preview links, but not visitor-session scoped artifact reads yet.
- `packages/agent-template/skills/estimate/SKILL.md` assumes the authenticated owner is the operator. Public estimator session framing must override this so the visitor is a contractor/prospect and customer-facing sends are forbidden.
- `infra/scripts/local/profile-generator-harness.mjs` and probe configs already generated/adapted a `website_estimator_conversation` package and previously provisioned `emp_5omv4ihbvggc8ibe31nj43` locally.

## Official Resend Notes Checked 2026-07-14

Sources used:

- Resend Node.js send guide: https://resend.com/docs/send-with-nodejs
- Resend domain management: https://resend.com/docs/dashboard/domains/introduction
- Resend API keys: https://resend.com/docs/dashboard/api-keys/introduction
- Resend send email API: https://resend.com/docs/api-reference/emails/send-email
- Resend API introduction/rate limits: https://resend.com/docs/api-reference/introduction
- Resend errors: https://resend.com/docs/api-reference/errors

Implementation-relevant facts from official docs:

- Node send requires a Resend API key and verified domain.
- API key should be supplied as `RESEND_API_KEY`; API keys are secret and cannot be viewed after creation.
- Resend says sending uses a domain you own and at least one domain must be added and verified.
- Resend recommends sending from subdomains to isolate sender reputation; this fits `mail.amtechleads.com`.
- Send API accepts `from`, `to`, `subject`, `html`/`text`/template fields, `reply_to`, attachments, tags, and an `Idempotency-Key` header.
- Idempotency keys are max 256 chars and expire after 24 hours.
- API base URL is `https://api.resend.com`; direct calls require `Authorization: Bearer re_xxxxxxxxx`.
- Direct calls also require `User-Agent`; the official SDK handles this.
- Default API rate limit is 5 requests per second per team across all API keys; exceeding it returns HTTP 429.
- Error handling must persist at least status, type/message, and provider response id when present. Expected error classes include missing/invalid/restricted API key, validation errors, unverified or wrong from-domain, invalid attachment, invalid from address, invalid idempotent request, concurrent idempotent request, not found, method not allowed, 429, and 5xx.

Plan implication: add a small Manager-side Resend wrapper using the official SDK if dependency policy allows it; otherwise direct fetch must set authorization and user-agent explicitly. The wrapper must be idempotent, persist provider ids, persist failures, and fail closed when `RESEND_API_KEY`, `PUBLIC_ESTIMATOR_FROM_EMAIL`, or the sending domain verification gate is missing.

## Milestone 0 Answers

1. Public route

Use `apps/web/app/free-estimator/page.tsx` as the canonical acquisition route. Add `/estimate` as a redirect or lightweight alias later if useful for outbound links. Do not replace `/`; the root is the company/product front door.

2. Database schema

No suitable public visitor/customer/funnel schema exists. Add an additive migration. Do not reuse `owner_web_sessions`, because those represent claimed owners. Do not reuse `employee_sessions`, because it enforces one active transcript per employee.

Minimum new tables:

- `public_estimator_sessions`: one anonymous visitor session scoped to one `employee_id`, with `visitor_session_id`, hashed visitor token, transcript session id, memory session key, status, email, IP/user-agent hashes, created/last_seen timestamps.
- `public_estimator_messages`: visitor/employee transcript rows or compact summaries, scoped by visitor session.
- `public_estimator_artifacts`: map `visitor_session_id` to artifact ids and current draft status.
- `public_estimator_events`: funnel state ledger for `started`, `useful_input`, `draft_produced`, `draft_revised`, `draft_downloaded`, `draft_copied`, `email_submitted`, `email_sent`, `email_failed`, `feedback`, `trial_intent`, `founder_followup_needed`.
- `public_estimator_email_sends`: Resend send attempts, idempotency key, recipient, artifact id, provider message id, status, error details.
- Optional `public_estimator_rate_limits` only if Redis/upstream rate limiting is not available; otherwise use app-level rate limit storage with DB fallback.

All tables should be Manager/service-role only. Public browser access goes through web route handlers and Manager endpoints.

3. Generated package reuse

Reuse `website_estimator_conversation` for the first local/source-wired path if it still provisions and the employee runtime exists. Do not regenerate just to start. Regenerate/reprovision only if live provider credentials require a fresh package, the package is missing, or prompt/profile changes are needed after the first live proof.

Prefer `company_data` mode for the public GTM proof because it demonstrates the core promise: an AMTECH employee can remember pricing and produce a useful draft. Keep sparse contractor mode as a fallback for demos where no pricing facts are available.

4. Visitor-session adapter

Add a Manager-side public estimator service rather than threading anonymous behavior through owner routes.

Adapter behavior:

- `POST /manager/public-estimator/session` creates or resumes a visitor session for configured `PUBLIC_ESTIMATOR_EMPLOYEE_ID`.
- Mint `visitor_session_id` and an opaque visitor token cookie. Store only token hash.
- Create per-visitor Hermes transcript id, for example `pubest:{visitor_session_id}`.
- Create per-visitor memory session key, for example `amtech:v1:public-estimator:employee:{employee_id}:visitor:{visitor_session_id}`.
- Resolve the same runtime endpoint and bearer as the employee, but override `sessionId` and `sessionKey` before calling Hermes.
- Run through the existing `employee_turn_jobs` lock so one employee brain does not receive simultaneous turns that could interleave tool work.
- Do not use `runtime_endpoints.api_session_id` for visitors. That field remains the owner thread.
- Do not use `employee_sessions` active-row rotation for visitor sessions in the first milestone. Track visitor transcript occupancy in `public_estimator_sessions` or a separate visitor transcript table. Add rotation later if live usage requires it.

This preserves one shared estimator capability while isolating each visitor's transcript, artifacts, and funnel state.

5. Draft/PDF/download decision

First milestone should be deterministic HTML-first. Existing `create_estimate_artifact` plus `renderArtifactHtml` is enough to show and download/copy a useful draft without pretending PDF bytes exist.

Implementation shape:

- Current draft endpoint returns escaped HTML and structured JSON payload.
- "Copy" copies the structured/text estimate draft in the browser and records `draft_copied`.
- "Download" initially downloads an `.html` or `.txt` estimate draft generated by the web/Manager route and records `draft_downloaded`.
- PDF is accepted later only after either the employee/runtime produces valid PDF bytes through `render_estimate_pdf`, or Manager owns a deterministic HTML-to-PDF helper with tests.

Do not call an HTML fallback a PDF.

6. Resend placement and env

Place Resend in Manager, not web:

- `apps/manager/src/lib/resend-client.ts`: provider wrapper, idempotency, normalized errors.
- `apps/manager/src/lib/public-estimator-email.ts`: builds the AMTECH email from visitor session and current draft.
- `apps/manager/src/routes` or `server.ts` public estimator endpoints until routing is split.

Required env:

- `RESEND_API_KEY`
- `PUBLIC_ESTIMATOR_FROM_EMAIL`, expected like `AMTECH <estimates@mail.amtechleads.com>`
- `PUBLIC_ESTIMATOR_REPLY_TO`, likely founder/AMTECH follow-up inbox
- `PUBLIC_ESTIMATOR_SENDING_DOMAIN=mail.amtechleads.com`
- `PUBLIC_ESTIMATOR_EMPLOYEE_ID`
- `PUBLIC_ESTIMATOR_ACCOUNT_ID`
- `PUBLIC_ESTIMATOR_EMAIL_ENABLED=1` for live sends
- `PUBLIC_WEB_ORIGIN` or equivalent for links

Fail closed when email is disabled or env is missing. Record `email_failed` with a safe reason; never leak API keys, provider internals, stack traces, Hermes language, or schema terms.

7. Ready-for-outreach checks

Source-wired readiness:

- Public page renders without auth.
- Visitor session create/resume works through token cookie.
- Two visitor sessions can have separate transcript ids, messages, artifacts, and funnel events.
- Visitor A cannot fetch Visitor B's artifact/current draft/email state.
- Message endpoint rate limits and validates input length.
- Artifact endpoint is scoped by visitor token and session id.
- Email endpoint validates recipient, uses idempotency, records sent/failed.
- Tests cover visitor isolation, endpoint guardrails, artifact scope, Resend wrapper behavior, and funnel event transitions.

Provider-accepted readiness:

- Live Hermes turn proof for the public estimator with employee id, visitor session id, Hermes run id, and artifact id.
- Live Resend proof from `mail.amtechleads.com` with provider message id.
- Failure proof showing a recorded and visible send failure.
- Abuse controls verified under repeated unauthenticated requests.
- If file uploads are added, type/size limits and storage visibility proof are captured. Defer uploads from first milestone unless they are necessary.

## Smallest Viable Build Sequence

### Phase 1: Public Estimator Skeleton

Goal: source-wired public route and session lifecycle.

Work:

- Add `/free-estimator` page with the real first-screen experience: conversation, draft panel, email prompt, and CTA.
- Add web route handlers under `apps/web/app/api/public-estimator/*` that call Manager.
- Add Manager endpoints:
  - `POST /manager/public-estimator/session`
  - `POST /manager/public-estimator/message`
  - `GET/POST /manager/public-estimator/current-draft`
  - `POST /manager/public-estimator/action`
  - `POST /manager/public-estimator/email`
- Add migration for public estimator tables.
- Add visitor token cookie, token hashing, TTL, and resume semantics.
- Add event recording helpers.

Acceptance:

- Starting the page creates `started`.
- Sending meaningful job input records `useful_input`.
- Refresh resumes the same visitor session.
- No owner session is required.

### Phase 2: Employee Turn Adapter

Goal: one provisioned estimator employee handles many anonymous visitors without context bleed.

Work:

- Add `resolvePublicEstimatorRuntimeApi(db, employeeId, visitorSession)` or a generic `resolveRuntimeApiForSession`.
- Override Hermes `sessionId` and `sessionKey` for visitor turns.
- Add `deliverPublicEstimatorTurnToRuntime`.
- Use `runEmployeeTurn` with a new turn kind, or widen `EmployeeTurnKind` to include `public_estimator_chat`.
- Add public-estimator system/session framing:
  - visitor is a contractor/prospect, not the homeowner;
  - ask only missing facts;
  - draft with line items, assumptions, confidence/unknowns;
  - no sends to homeowner/customer;
  - no final-price guarantee;
  - never expose Hermes/MCP/tool/runtime/schema/token/stack wording;
  - after useful draft, suggest emailing the contractor their own draft;
  - CTA: "Want this estimator to remember your pricing, format, materials, service area, and follow-up rules for the next job?"

Acceptance:

- Visitor A and B can both talk to the same `employee_id` with separate transcript ids.
- A later turn by Visitor A retains A context without seeing B facts.
- The per-employee turn lock still serializes runtime calls.

### Phase 3: Draft Artifact Materialization

Goal: useful draft artifact visible, copyable, downloadable, and revisable.

Work:

- Ensure estimator prompt strongly calls `create_estimate_artifact` once line items exist.
- Map artifacts to visitor session when created. If Manager cannot infer visitor session from tool call metadata yet, include visitor id in turn metadata and store current run/session mapping during the public turn.
- Add scoped current-draft endpoint.
- Render structured payload with `renderArtifactHtml`.
- Add text/markdown serializer for clipboard/email plain text.
- Add HTML download route that records `draft_downloaded`.
- Add copy action endpoint that records `draft_copied`.

Acceptance:

- First useful draft records `draft_produced`.
- Revisions produce a new current artifact or revision event.
- Visitor cannot read an artifact not mapped to their session.

### Phase 4: Resend Email Materialization

Goal: email the contractor their own estimate draft from AMTECH, with persistence and failure visibility.

Work:

- Add Resend wrapper and tests with mocked fetch/SDK.
- Add `public_estimator_email_sends` persistence.
- Build email from current draft:
  - from `PUBLIC_ESTIMATOR_FROM_EMAIL`;
  - to visitor email only;
  - reply-to AMTECH/founder follow-up inbox;
  - subject references draft, not guaranteed final quote;
  - body includes line items, assumptions, unknowns, and CTA;
  - attach only if a real stored PDF exists; otherwise include HTML/text content or a scoped link.
- Use idempotency key based on visitor session and artifact id.
- Record `email_submitted`, then `email_sent` with message id or `email_failed` with safe error.

Acceptance:

- Missing Resend env fails closed and is visible.
- Mocked success stores provider message id.
- Mocked validation/rate-limit/server failures persist safe failure details.
- Live proof required before claiming provider-accepted.

### Phase 5: Funnel And Founder Inspection

Goal: make the acquisition loop operable tonight.

Work:

- Add admin/founder read path, preferably extending existing admin if low risk.
- Show public estimator sessions, latest draft status, email status, feedback, trial intent, and follow-up needed.
- Add CTA event from public page into trial/founder follow-up queue.
- Add CSV or simple JSON export if admin UI is too slow.

Acceptance:

- Founder can see who used the estimator, what job they tried, whether a draft was produced, whether email was sent, and whether follow-up is needed.

## GTM Execution Plan

Audience:

- Owner-operated painting contractors first; landscapers second only if estimator prompt and examples have enough fit.
- Prioritize owners who still write estimates manually, respond after hours, or lose jobs due to slow follow-up.

Offer:

- "Send one real job to Avery, AMTECH's estimator employee. Get a draft with line items and assumptions. If it helps, we can make it remember your pricing and format for the next job."

Traffic sources:

- Founder cold email to a narrow contractor list.
- Direct referral asks from known local contractors.
- SEO/lightweight page title around "free painting estimate draft" only after live proof.
- Follow-up from any demo conversation where the owner mentions estimating pain.

Outbound CTA:

- Primary link: `/free-estimator`.
- Promise one useful draft, not signup.
- Secondary CTA after draft: "Want this estimator to remember your pricing, format, materials, service area, and follow-up rules for the next job?"

Founder follow-up rules:

- Follow up manually when a visitor produces a draft, submits email, gives feedback, clicks trial intent, or the employee marks confidence low but job intent high.
- Manual email should reference the concrete draft, not generic AI claims.

Metrics:

- Sessions started.
- Useful-input rate.
- Draft-produced rate.
- Revision rate.
- Copy/download rate.
- Email-submit rate.
- Email-send success/failure.
- Trial-intent rate.
- Founder-follow-up conversion.
- Qualitative objections from contractors.

## Guardrails

The public estimator may:

- Draft the contractor's own estimate.
- Email the contractor their own draft from AMTECH.
- Ask for missing facts needed to make a reasonable draft.
- State assumptions, unknowns, confidence, and contractor-owned final-price language.

The public estimator must not:

- Send anything to the contractor's customer/homeowner.
- Move money or create invoices.
- Present AMTECH output as guaranteed final pricing.
- Expose Hermes, MCP, tool calls, runtime, schemas, tokens, stack traces, provider internals, or database vocabulary.
- Let one visitor read another visitor's transcript, artifact, email status, or funnel state.
- Accept unlimited unauthenticated traffic without rate limits.
- Blindly expose uploaded files. File uploads are out of first milestone unless size/type/storage controls are included.

## Test Plan

Unit tests:

- Visitor token mint/hash/verify/expiry.
- Public estimator session create/resume.
- Funnel event transition idempotency.
- Runtime API override uses visitor transcript/session key, not owner thread.
- Resend wrapper success, validation failure, missing env, rate-limit response, idempotency conflict, and 5xx.
- Artifact scope lookup denies foreign visitor session.

Integration tests:

- Two visitor sessions against same employee do not share transcript ids or artifacts.
- Message endpoint rejects missing/too-long body and rate-limited callers.
- Current draft endpoint returns only visitor-scoped draft.
- Email endpoint cannot send without current draft and cannot send to homeowner/customer fields.
- HTML-first download records `draft_downloaded`; copy records `draft_copied`.

Provider/runtime acceptance:

- Live Hermes public estimator turn with proof ids.
- Live estimate artifact id and rendered draft.
- Live Resend message id from verified `mail.amtechleads.com`.
- Live failure recording proof.

## Status Language For Future Updates

Use these labels exactly:

- `plan-only`: this document exists, no source implementation.
- `source-wired`: code paths, migrations, and tests are implemented locally.
- `local-proven`: local runtime/harness proof captured; no external provider proof.
- `provider-accepted`: real Hermes/provider and/or Resend proof ids captured.
- `outreach-ready`: provider-accepted plus abuse controls and founder inspection path are proven.

As of this plan, the public estimator funnel is `plan-only`. Existing underlying pieces are partially `source-wired` for owner chat, turn serialization, estimate artifacts, safe HTML fallback, signed artifact links, and profile-generator package generation. The public visitor-session adapter, visitor-scoped artifacts, Resend email materialization, funnel persistence, and public page are pending.

## Immediate Next Actions

1. Add the migration and service helpers for public visitor sessions/events.
2. Add Manager public estimator endpoints behind strict rate/input guards.
3. Add `/free-estimator` page and web API handlers.
4. Add visitor-session runtime adapter and isolation tests.
5. Add HTML-first draft retrieval/copy/download.
6. Add Resend wrapper and mocked tests.
7. Run local proof with existing or reprovisioned `website_estimator_conversation`.
8. When live provider credentials land, capture Hermes run/artifact ids and Resend message id before declaring provider acceptance.
