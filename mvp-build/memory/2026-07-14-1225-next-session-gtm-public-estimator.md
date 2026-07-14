# Next Session: GTM Public Estimator Employee

Date: 2026-07-14 12:25 EDT
Status: grounding prompt / handoff
Scope: next session should act as GTM executive and production builder for the public landing-page estimator employee

## Copy-Ready Prompt

You are taking over AMTECH as the go-to-market executive and production-minded builder. Your job is to decide and execute the highest-leverage next steps for getting AMTECH in front of contractors quickly.

Start from the latest `main` branch. If this prompt has not been merged yet, use branch
`agent/gtm-public-estimator-handoff`; it contains this handoff file and the `MEMORY.md` index update. All
UI/UX canonicalization and fixture-guard work needed for this prompt is already on `main` as of merge commit
`0a07ce7ac6eefc1b03cd0d5b5fec110a7500732b`.

Strong prior from the founder: the best next step is to make the public landing-page estimator employee completely real. That means a no-signup contractor can land on an AMTECH page, talk to an AI employee about one real job, get a useful estimate draft, revise it conversationally, download/copy it, optionally receive it by email from AMTECH, and then enter the free-trial AI Employee funnel.

This is not a generic chatbot, calculator, or demo. It is the acquisition version of the AMTECH employee loop:

```text
visitor lands from cold email / SEO / referral
  -> starts one estimator conversation with no signup
  -> gives job notes, measurements, customer messages, photos/files if supported
  -> employee asks only for missing facts
  -> employee produces a line-item estimate draft with assumptions
  -> visitor can discuss, correct, and regenerate
  -> visitor can download/copy the draft
  -> AMTECH suggests emailing them the draft
  -> if they provide email, send via Resend from mail.amtechleads.com
  -> record visitor/customer/funnel state
  -> soft CTA: make this estimator remember your pricing and format
  -> free AI Employee trial / founder follow-up funnel starts
```

## Read First

Read these files in order before editing:

1. `identity.md`
2. `README.md`
3. `CODEGRAPH.md`
4. `mvp-build/README.md`
5. `mvp-build/CODEGRAPH.md`
6. `mvp-build/AGENTS.md`
7. `mvp-build/memory/MEMORY.md`
8. `mvp-build/memory/2026-07-14-1216-ui-docs-canonicalized.md`
9. `mvp-build/memory/2026-07-14-1225-next-session-gtm-public-estimator.md`
10. `wiki/README.md`
11. `wiki/00-decision.md`
12. `wiki/gtm/free-estimator-funnel.md`
13. `wiki/gtm/outreach-engine.md`
14. `wiki/offers/wedge-offers.md`
15. `wiki/offers/estimator-whole-product.md`
16. `wiki/product-ai-employee-context.md`
17. `wiki/product-agent-platform-architecture.md`
18. `mvp-build/second-half-plan/estimator-product-limits-research.md`
19. `mvp-build/memory/2026-07-12-2355-ce4-and-estimator-materialization-research.md`
20. `mvp-build/memory/2026-07-12-2359-profile-generator-first-estimator-probe.md`
21. `mvp-build/docs/ux/README.md`
22. `mvp-build/ui-redesign/README.md`

Then inspect source before deciding implementation shape:

- `mvp-build/apps/web/app/page.tsx`
- `mvp-build/apps/web/app/create-ai-employee/page.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts`
- `mvp-build/apps/manager/src/server.ts`
- `mvp-build/apps/manager/src/lib/hermes-client.ts`
- `mvp-build/apps/manager/src/lib/runtime.ts`
- `mvp-build/apps/manager/src/lib/turn-queue.ts`
- `mvp-build/apps/manager/src/lib/session-rotation.ts`
- `mvp-build/apps/manager/src/tools/estimate.stub.ts`
- `mvp-build/apps/manager/src/lib/artifact-view.ts`
- `mvp-build/apps/manager/src/lib/artifacts.ts`
- `mvp-build/apps/manager/src/lib/signed-links.ts`
- `mvp-build/packages/agent-template/skills/estimate/SKILL.md`
- `mvp-build/infra/scripts/local/profile-generator-harness.mjs`
- `mvp-build/infra/scripts/local/profile-generator-probes/website-estimator.company-data.json`
- `mvp-build/infra/scripts/local/profile-generator-probes/website-estimator.contractor-mode.json`

## Research Requirements

Do not assume external APIs from memory. Before implementing provider integrations, verify current official docs and write short notes into a dated memory or implementation note:

- Resend official docs for sending email with a verified custom domain.
- Resend official docs for API keys, from-address requirements, reply-to, attachments, rate limits, and error responses.
- Current Hermes runtime/API behavior relevant to serving many visitor sessions against one estimator employee.
- Current repo behavior for artifact creation, safe HTML fallback, PDF bytes, signed links, and any existing customer/funnel tables.

Use official docs or source. Do not cite random blog posts for provider behavior.

## Product Requirements

Build toward this public estimator behavior:

- One estimator employee can handle many visitors concurrently without mixing context.
- Each visitor has a stable `visitor_session_id` or equivalent, separate transcript/session state, scoped artifacts, and scoped funnel state.
- The workflow is guided by prompts/hooks/context, not a long rigid form.
- The employee asks only for missing facts needed to make a reasonable draft.
- The estimate draft has line items, assumptions, confidence/unknowns, and contractor-owned final-price language.
- The visitor can keep talking to revise the estimate.
- The visitor can download/copy the current draft.
- After the draft is useful, the product suggests emailing it to them.
- If the visitor gives an email, AMTECH sends the estimate using Resend from the `mail.amtechleads.com` sending domain.
- The system records the visitor/customer/funnel state: start, useful input, draft produced, draft downloaded/copied, email submitted, email sent/failed, feedback, trial intent, founder follow-up needed.
- The next CTA is concrete: "Want this estimator to remember your pricing, format, materials, service area, and follow-up rules for the next job?"

## Engineering Direction

Expect most of the work to be API and product plumbing:

- public web route/page for the estimator;
- visitor-session creation/resume endpoint;
- message endpoint that routes visitor turns to the estimator employee;
- turn serialization that isolates visitors while preserving one shared estimator capability;
- artifact/draft retrieval endpoint scoped to visitor session;
- download/copy/email actions;
- Resend email service wrapper and tests;
- customer/funnel state persistence;
- admin/founder inspection path if the existing admin surface can be extended safely;
- prompt/profile/hook/context changes that make the estimator reliably follow the workflow.

The public estimator is allowed to draft and email the contractor their own draft. It must not send anything to the contractor's customer/homeowner. It must not perform money movement. It must not present AMTECH's output as a guaranteed final price. It must not expose Hermes, MCP, tool, runtime, schema, token, or stack-trace language.

## Production Readiness Bias

The founder expects live LLM provider credits tonight. Be ready to switch from local/fixture proof to real provider/runtime proof as soon as credentials are present.

Before claiming production readiness, prove:

- many visitor sessions do not bleed context into each other;
- one visitor cannot fetch another visitor's artifacts or email state;
- Resend email sends from the verified domain with a real message id;
- failures are recorded and visible;
- rate limits / abuse controls exist for public endpoints;
- uploaded files have size/type limits and are not blindly exposed;
- live provider/runtime proof is captured with IDs, not hand-waved.

Use the Realness Rule from memory: local proof is local proof; provider/runtime acceptance needs real provider proof ids.

## Suggested First Milestone

Do a short implementation audit and write down the exact smallest viable path before coding:

1. What route should host the public estimator?
2. Is there already a suitable database schema for public visitor/customer/funnel state, or is an additive migration needed?
3. Can the existing `website_estimator_conversation` generated package be reused, or should the next session regenerate/reprovision after live provider creds land?
4. What is the cleanest visitor-session adapter around Hermes session ids and Manager turn serialization?
5. Should first PDF/download be deterministic HTML-first with PDF later, or does current employee/tooling already produce acceptable PDF bytes?
6. Where should Resend live in the codebase, and what env vars are required?
7. Which checks and live proofs will mark the page ready for outreach?

Then implement the smallest end-to-end path that can support real contractor traffic:

```text
public estimator page
  -> visitor session
  -> live estimator turn
  -> estimate draft artifact
  -> revise
  -> download/copy
  -> email via Resend
  -> funnel state recorded
```

## Deliverables For The Session

- Working public estimator flow or, if blocked by provider creds, a source-wired flow with explicit gates and a live-proof checklist.
- Dated notes on what was discovered about Hermes employee serving, visitor-session isolation, artifacts/PDFs, and Resend.
- Tests for visitor isolation, public endpoint guardrails, Resend wrapper behavior, and funnel state transitions.
- Updated memory handoff and source maps.
- Clear statement of what is `source-wired`, what is `provider-accepted`, and what remains pending.
