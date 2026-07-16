# Onboarding Live Review

Date: 2026-07-16
Status: review from production-like normal employee launch attempt

## What was inspected

Live surfaces and processes:

- Production containers: `manager`, `web`, `caddy`.
- Cloudflare tunnel connector.
- Caddy origin route for `agent.amtechai.com`.
- Public `https://agent.amtechai.com/create-ai-employee`.
- Manager/Web/Caddy logs.
- Latest `infra/proofs/prod-like-normal-up-*.json`.

Onboarding code path:

- Web page: `/create-ai-employee`.
- Web API proxies: `/api/front-door/message`, `/send-code`, `/check-code`, `/create-account`, `/provision`.
- Manager orchestrator: `/manager/orchestrator/web`.
- Identity tools: `send_phone_verification`, `check_phone_code`, `create_account`.
- Server-backed provisioning: `/manager/onboarding/provision-from-session`.
- Model adapter: OpenAI-compatible xAI/Grok path.

## Current live state observed

Core local production stack:

- `amtech-ai-employee-manager-1`: healthy on `127.0.0.1:8080`, 65 tools registered.
- `amtech-ai-employee-web-1`: healthy on `127.0.0.1:3000`.
- `amtech-ai-employee-caddy-1`: healthy on host `:80/:443`.
- No `amtech-hermes-*` normal employee container was started during this review.

Public ingress:

- Named tunnel container `amtech-tunnel` connected successfully when run manually.
- Public route `https://agent.amtechai.com/create-ai-employee` returned `HTTP/2 200` through Cloudflare and Caddy after the Cloudflare public hostname was configured.
- The tunnel was later stopped intentionally while debugging onboarding/provider behavior.

Provider state:

- xAI `/models` request using the configured key returned a credit/spending-limit error.
- Manager logs showed `model_403` from the onboarding orchestrator before the logging patch.
- This is a provider account/credit gate, not a Web, Caddy, Manager, Docker, or Hermes outage.

## Flow review

### Chat-first intake

The browser sends owner messages to `/api/front-door/message`, which proxies to `/manager/orchestrator/web`.

Strengths:

- The UI starts with chat and uses secure inline controls for phone/code/password/account/start employee.
- The browser does not assemble the final employee manifest.
- The Manager stores transcript and manifest draft in `onboarding_sessions`.
- Readiness logic prevents repeated interviewing once minimum business facts are captured.

Issues fixed in this review:

- Provider failures were surfacing only as opaque Manager `model_403` unhandled errors.
- Added structured provider error classification.
- Added sanitized onboarding logs for model-call start/success/failure.
- Added controlled JSON responses with `operator_error_code`, including `provider_auth_or_credit_gated`.

Remaining concern:

- The running production container does not include this logging patch until Manager is rebuilt/redeployed.

### Phone verification

The browser sends phone/code through secure controls:

- `/api/front-door/send-code` -> `send_phone_verification`.
- `/api/front-door/check-code` -> `check_phone_code`.

Strengths:

- Real Twilio Verify path exists and records provider proof.
- Dev bypass is ignored when `NODE_ENV=production`.
- Verification updates `onboarding_sessions` with canonical phone facts.
- The code is not sent as normal chat text.

Live launch requirement:

- A production-level proof must show no `dev_bypass`.
- Record Twilio Verify SID/status, not the code.

### Account creation

The browser sends email/password through secure controls:

- `/api/front-door/create-account` -> `create_account`.
- Web sets the `amtech_owner_session` cookie from the returned owner session token.

Strengths:

- Password stays in the secure form, not the chat transcript.
- Owner session is minted during account creation, so production mode does not need `/api/dev/login`.
- `onboarding_sessions` gets `account_id`, `owner_email`, phone ref, business name, and timezone.

Production concern:

- Account creation is not atomic. It creates Supabase Auth user, account row, user row, membership row, phone claim, session update, and owner session in sequence.
- Before paid pilots, this should become a DB RPC/transactional boundary or gain explicit compensating cleanup for partial failures.

### Start Employee

The browser sends:

- `session_id`
- `account_id`
- `idempotency_key`

to `/api/front-door/provision`, which proxies to `/manager/onboarding/provision-from-session`.

Strengths:

- Manager compiles final manifest from server-side session state.
- Strict `OnboardingManifest` validation still runs.
- Provisioning uses the normal `provision_employee` tool path.
- This is the right boundary for production; the browser no longer owns final manifest assembly.

Production concern:

- Operator proof should capture the compiled manifest readiness result and provision outcome without exposing sensitive transcript details.
- Normal browser onboarding needs a launch proof writer that does not depend on fixtures.

## Logging standard going forward

For onboarding conversation turns, log:

- `session_id`
- state before/after
- surface
- provider/model/base URL
- response format
- transcript turn count
- message character count
- elapsed time
- provider HTTP status and coarse error kind

Do not log:

- owner message text
- passwords
- verification codes
- cookies/session tokens
- provider keys
- full provider raw body

## Current blocker

The live onboarding LLM is blocked by xAI credit/spending limit:

```text
provider_auth_or_credit_gated
```

Until xAI credits/spending limit are fixed, onboarding chat cannot complete with the live provider. This should be recorded as provider-gated, not a product runtime failure.

## Recommended next fixes

1. Rebuild/redeploy Manager once xAI account access is fixed so structured onboarding logging is live.
2. Add a normal public-browser proof script that attaches to Playwright/headed mode only for observation/capture, not fixture-driving.
3. Add a small public-ingress proof JSON writer for `agent.amtechai.com` that records Cloudflare/Caddy headers.
4. Add transaction/cleanup hardening for `create_account`.
5. Add operator dashboard/readiness display for latest onboarding provider gate and latest public ingress proof.
