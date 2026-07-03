# Implementation Record — Phase 0 Through Phase 2 Wiring

Status: active

Date: 2026-06-29  
Build home: [`../../../mvp-build/`](../../../mvp-build/)  
Plan source: [`../old-build-plan/`](../old-build-plan/)  
Workspace map used: [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)

## Current State

Phase 0, Phase 1, and Phase 2 are wired in code. Provider/runtime acceptance is still pending because this workspace does not have the real `DATABASE_URL`, Supabase project credentials, Twilio credentials, Hermes runtime, Caddy/tunnel routes, or provisioner host environment configured.

The codebase currently supports:

- account setup before employee creation, with no payment gate;
- OpenAI-compatible front-door onboarding with strict structured output by default;
- web and SMS onboarding surfaces converging on the same onboarding session/manifest path;
- Twilio Verify and signed inbound-SMS claim flow;
- AMTECH account/user/session creation through Supabase Auth and app tables;
- production-shaped `provision_employee` flow and protected `/provision` host boundary;
- registered profile-package provisioning, with first package `contractor_estimator`;
- owner webchat and SMS routing to the same employee runtime endpoint;
- Manager-backed estimate artifact rows, private Supabase Storage upload, signed artifact links, and owner artifact route;
- approval primitive with web approve/reject affordances;
- Gmail Phase 3 groundwork for consent URL creation and draft rows with artifact attachments, without claiming live Gmail send/watch support.

## Implemented By Phase

### Phase 0 — Foundation

Implemented:

- npm-workspaces TypeScript monorepo under [`../../../mvp-build/`](../../../mvp-build/).
- Shared Manager tool envelope, routes, ids, manifest schema, event types, and tool names.
- Supabase schema migrations for account/employee/runtime/artifact/Gmail/Stripe/event/reminder/audit tables.
- RLS baseline migration for owner-facing tables.
- Secret-reference helper, signed-token helper, OAuth state helper, Twilio signature validation, entitlement/usage scaffolding.
- Hermes/Caddy runbook and env smoke script.
- Full Manager tool registry coverage with explicit `not_implemented` envelopes for later phases.

Local proof:

- `npm run typecheck` passed.
- `npm run test:unit` passed.
- `npm run build` passed.
- `npm run lint` passed.

Pending provider proof:

- Supabase migration application and advisor/security verification against a real project.
- Real RLS cross-account denial test; current integration file is still a skeleton.

### Phase 1 — Onboarding, Account, Provisioning, First Live Employee

Implemented:

- LLM front-door orchestrator at `POST /manager/orchestrator/web`.
- OpenAI-compatible Chat Completions adapter with `json_schema` structured output default and `OPENAI_API_KEY`/`XAI_API_KEY`/`ORCHESTRATOR_API_KEY` key routing.
- Web `/create-ai-employee` flow.
- SMS front-door Twilio webhook flow with signature validation, onboarding-session persistence, and single-use claim token.
- Claim page that consumes signed SMS token and carries manifest context into account setup.
- Manager tools for phone verification, code check, account creation, provisioning, provisioning status, business-brain read/write, entitlements, and usage.
- Protected owner web session cookie.
- Production-shaped host provisioner: profile render, Caddy snippet, Twilio employee webhook setup, runtime start hook, first live SMS proof capture.
- Authenticated owner web route and owner-to-runtime message proxy.
- Employee SMS webhook routes owner messages to the same runtime endpoint as web.

Pending provider proof:

- Real Twilio Verify SID.
- Real inbound SMS signature proof.
- Real first live outbound SMS SID.
- Real Hermes runtime health and webchat route.
- `npm run smoke:phase01` must pass after provisioning a live employee in the configured environment.

### Phase 2 — Interaction Wrapper, Estimate Artifact, Approval

Implemented:

- Shared input contracts for estimate artifacts, PDF storage, signed artifact links, and approvals.
- Manager artifact helper for PDF validation, storage path construction, private Supabase Storage upload, and short-lived storage signed URL creation.
- `create_estimate_artifact`: validates owner/account/employee context and line-item payload, then writes an `artifacts` row.
- `render_estimate_pdf`: accepts employee-created PDF bytes, validates `%PDF` header and optional checksum, uploads to private storage, and updates `artifacts.storage_ref`.
- `create_signed_artifact_link`: mints HMAC artifact token, stores only token hash, returns owner-safe AMTECH artifact route.
- `request_approval`, `resolve_approval`, `get_approval_status`: create and resolve one approval primitive used by web/SMS affordances.
- Manager artifact resolver: validates signed token or owner session, checks artifact ownership/expiry/revocation, increments access count, audits access, and returns a short-lived Supabase Storage URL.
- Next.js artifact route `/agent/{employee_id}/output/{artifact_id}` resolves through Manager.
- Owner web UI lists recent artifacts and pending approvals, with approve/reject buttons.
- Supabase migration `0004_phase2_artifacts.sql` creates/hardens private `artifacts` bucket and artifact/approval indexes.
- Employee template instructions now direct the Estimate skill to create the PDF itself and call Manager for artifact registration, storage, signed link, and approvals.

Local proof:

- Artifact helper unit tests cover scoped storage path, filename normalization, PDF header validation, and TTL bounds.
- Build/typecheck/lint pass.

Pending provider proof:

- Apply `0004_phase2_artifacts.sql` in a real Supabase project.
- Verify private Storage upload and signed URL open path.
- Verify signed-token access, owner-session access, and cross-account denial.
- Execute [`../../../mvp-build/tests/golden-path/step2-estimate-artifact.md`](../../../mvp-build/tests/golden-path/step2-estimate-artifact.md).

### Phase 3 — Superseded By Partial Gmail Record

This record was written when Phase 3 had Gmail consent/draft groundwork only. A later same-day implementation moved Phase 3 materially forward. Read [`2026-06-29-phase-3-partial-record.md`](2026-06-29-phase-3-partial-record.md) for the current Phase 3 state.

Baseline implemented before that later Phase 3 work:

- Shared Gmail input types for connect, OAuth callback, connector test, draft creation, send draft, and related Phase 3 seams.
- `connect_email` creates or reuses a pending Gmail connector row and returns a Google consent URL when Google OAuth client env is configured.
- `create_email_draft` validates Gmail connector existence and Phase 2 artifact attachment ownership, then stores an outbound email draft row.

Previously not implemented at the time of this baseline record:

- Gmail OAuth token exchange.
- Token custody for real Gmail refresh/access tokens.
- Gmail connector test.
- MIME construction and `users.messages.send`.
- Gmail `users.watch`, Pub/Sub validation, `history.list`, reply normalization, and employee event delivery.

The current source now implements these seams locally, but they still require provider-backed acceptance proof.

## Current Test Posture

Passing local checks:

```text
npm run typecheck
npm run test:unit
npm run build
npm run lint
```

Known test gaps:

- No executable integration test for RLS cross-account denial yet.
- No mocked Manager-tool unit tests for the full Phase 2 artifact/approval state transitions yet.
- Golden-path Phase 2 is documented but not scripted.
- `npm run db:status` requires `DATABASE_URL`; it cannot run in the current environment.

## Next Implementation Inherits

The next implementation phase should treat these as stable seams:

- Manager is the backend control plane; owner never talks to Manager directly.
- Employee creates estimate PDFs as files; Manager validates, stores, signs, serves, and audits.
- External customer send and money movement require approval ids.
- Gmail drafts can reference Phase 2 artifact ids.
- Provider-backed acceptance always requires real provider ids/proof, not local mocks.
