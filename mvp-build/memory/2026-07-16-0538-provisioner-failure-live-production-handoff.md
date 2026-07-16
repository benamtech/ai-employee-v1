# Provisioner failure investigation + full live production run handoff

Date: 2026-07-16 05:38 EDT
Status: live public stack up; employee provisioning failed once; root cause narrowed; full production run still pending
Workspace: `/home/georgej/AMTECH/GTM-RESEARCH/mvp-build`

## Ultimate Goal

Complete a full live production-like AMTECH normal employee run:

1. Public Cloudflare URL onboarding at `https://agent.amtechai.com/create-ai-employee`.
2. Real chat-first intake.
3. Real Twilio Verify phone verification.
4. Real Supabase account creation.
5. Start Employee.
6. Live Hermes employee runtime starts.
7. Owner web client opens for the new employee.
8. Employee gives a real provider-backed reply.
9. Connect and verify useful tools/connectors for the new employee where available, especially accounting/payment/field-service/marketing context such as QuickBooks, Square/Stripe, Jobber/ServiceTitan-style systems, website/lead/ad setup.
10. Capture proof: session id, Twilio Verify SID/status, account id, owner email, employee id, `amtech-hermes-<employee_id>` container id/status, proof JSON paths, Cloudflare tunnel id/container id, provider-backed reply evidence, and tool connection evidence.

Do not count local fixture mode, `/api/dev/login`, `live:*`, public-estimator scripts, or any bypass path as success.

## Read First

Use references first. Do not rely on conversation memory alone.

1. `../identity.md`
2. `../CODEGRAPH.md`
3. `CODEGRAPH.md`
4. `AGENTS.md` or `CLAUDE.md`
5. `docs/production-normal-employee-live-deploy-runbook.md`
6. `docs/onboarding-live-review-2026-07-16.md`
7. `docs/public-interaction-standard.md`
8. `memory/2026-07-16-0405-normal-employee-rebuild-xai-ok-cloudflare-auth-gated.md`
9. This file
10. `memory/MEMORY.md` newest entries only

## Current Running Processes / Containers

Snapshot at `2026-07-16 05:38:33 EDT`:

```text
092fb2e18436  amtech-tunnel                 Up 12 minutes
39acdfa7d4ea  amtech-ai-employee-caddy-1   Up 13 minutes (healthy)  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp, 443/udp
5cdc92fb8fc2  amtech-ai-employee-web-1     Up 13 minutes (healthy)  127.0.0.1:3000->3000/tcp
29b6df46e4c3  amtech-ai-employee-manager-1 Up 15 minutes (healthy)  127.0.0.1:8080->8080/tcp
```

No `amtech-hermes-*` employee container is currently running. A diagnostic Hermes container created during investigation was removed.

Cloudflare:

- Tunnel name: `amtech-tunnel`
- Tunnel id: `496ceef3-e2a8-49f5-9af3-c3b155534627`
- Current connector id after restart: `00ebed27-2432-4eda-9c64-162dbd91dc20`
- Current tunnel container id prefix: `092fb2e18436`
- Public route was verified after restart: `https://agent.amtechai.com/create-ai-employee` returned `HTTP/2 200`, `server: cloudflare`, `via: 1.1 Caddy`.

## Recent Work Already Implemented Locally

These changes are in the working tree and not necessarily committed:

- Proper onboarding streaming architecture:
  - Browser posts to `/api/front-door/message/stream`.
  - Manager streams natural-language deltas from xAI-compatible chat completions.
  - Manager then performs a separate strict structured extraction pass for manifest/session persistence.
- Onboarding security:
  - Model-bound manifest/transcript/new-message context strips contact/account/auth-like keys.
  - Text redacts accidental email and phone/code-like values.
  - Strict extraction schema no longer advertises `owner_email`.
- `ORCHESTRATOR_TEMPERATURE` default changed to `0.45`; local `.env` also set to `0.45`.
- Secure-control UI cleanup:
  - Synthetic chat messages like “I entered my phone number/code/account” removed.
  - Phone/account/start controls have pending/done/error states.
- Account create duplicate email mapping:
  - `account_email_already_registered`.
- Prompt/harness tuning:
  - Onboarding asks naturally about current software, website setup, paid ads, lead sources, Jobber, ServiceTitan, QuickBooks, Square, Stripe, Google Business Profile, Google Ads, Meta Ads, Wix, Squarespace, WordPress, Shopify, etc.
  - Local contractor fixtures include non-secret operating-stack context.

Validation already passed after these local changes:

```bash
npm run typecheck --workspace @amtech/manager
npm run typecheck --workspace @amtech/web
npm run test:unit -- tests/unit/create-account-error.test.ts tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts tests/unit/phone-verify-dev-bypass.test.ts
```

Most recent prompt/harness-only validation:

```bash
node infra/scripts/local/contractor-fixtures.mjs
npm run typecheck --workspace @amtech/manager
npm run test:unit -- tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts
```

## Live Failure Observed

The founder completed public onboarding far enough to create an account and clicked Start Employee. The UI returned:

```text
Provisioner failed to create a live employee.
```

Live IDs from DB/audit:

```text
onboarding_session_id: onb_g3aarxlemxpf7kqrdhhqwi
account_id: acct_0f1qj0k6k4coq6mepqsdy7
verified_phone_ref: phone_alull4azgq3dtfsvurd729
twilio_verify_sid: VE5cfebd857d54889e7f1e15a8d5133288
employee_id attempted: emp_t596x0vbwtd23xdqonfp09
provisioning_job_id: pjob_t934ptxbf0y8ar427q7s7u
audit_id: aud_s7ekwufunsfyegl42xyx1f
```

Session state:

```text
state: amtech_account_created
manifest keys: timezone, account_id, owner_email, seed_skills, business_kind,
employee_type, top_workflows, consent_channel, verified_phone_ref,
profile_package_key, verification_method, verified_phone_e164,
business_display_name
```

Important: live manifest is missing `owner_name` and `employee_name`. `compileOnboardingManifest()` should fill defaults (`owner_name` from owner email, `employee_name` as `Jordan`), so this is likely not the direct failure.

Audit/provision rows:

```text
tool:create_account -> ok
tool:provision_employee -> failed
provisioning_jobs.state -> failed
provisioning_jobs.failure_state -> provisioner_failed
employee_profile_builds.validation_status -> failed
employee_profile_builds.validation_output -> provisioner_failed
runtime_endpoints -> none
employee row -> not visible in later query, likely deleted by cascade/cleanup or not present after failure handling
```

## Deeper Investigation

The user asked to look deeper before only writing the handoff.

Findings:

1. `apps/manager/src/tools/provisioning.stub.ts` loses useful provisioner details.
   - `callProvisioner()` throws only `json.failure_state ?? provisioner_${status}`.
   - The provisioner returns `logs`, but those are discarded.
   - Result: DB only stores `provisioner_failed`, not the actual root exception.

2. A controlled provisioner diagnostic with an invalid/minimal `profile_context` reproduced a concrete failure:

```text
Cannot read properties of undefined (reading 'memory_chars')
```

This comes from:

```text
apps/manager/src/lib/memory-seed.ts
buildNativeMemoryFiles(context)
context.memory_limits.memory_chars
```

If `profile_context.memory_limits` is missing, profile rendering crashes.

3. A second controlled diagnostic using the real `buildProfileContext()` path succeeded:
   - profile rendered;
   - plugin deployed;
   - Caddy validated/reloaded;
   - Hermes container started;
   - SMS disabled for the diagnostic;
   - diagnostic container `amtech-hermes-emp_diagmrnbdbyp` was created and then removed;
   - diagnostic Caddy snippet/profile/workspace were removed.

This means the live failure was probably one of:

- a transient Caddy/Docker/runtime issue during the founder’s Start Employee click;
- a failure whose useful logs were swallowed by `callProvisioner()`;
- a profile_context shape issue in a path not matching the second diagnostic;
- an idempotency/retry bug preventing clean recovery after the failed job.

## Most Important Fix Targets

Fix these before asking the founder to retry Start Employee.

1. Preserve provisioner failure logs.

In `apps/manager/src/tools/provisioning.stub.ts`, change `callProvisioner()` so when `/provision` returns non-OK, the thrown error includes:

- `failure_state`
- `logs`
- HTTP status

Then store those in:

- `provisioning_jobs.failure_state`
- `provisioning_jobs.logs`
- `employee_profile_builds.validation_output`
- audit details

Do not print secrets.

2. Make `memory-seed.ts` defensive.

`buildNativeMemoryFiles(context)` should default missing `memory_limits` instead of crashing:

```ts
const limits = context.memory_limits ?? { memory_chars: 2200, user_chars: 1375 };
```

This protects profile rendering from malformed profile contexts.

3. Fix failed idempotency retry.

Current `provision_employee` existing-job branch returns `pending` for any existing idempotency key, even if `state === "failed"`. The frontend uses:

```text
idempotency_key: `${accountId}:${sessionId}`
```

After one failed provision, clicking Start Employee again may only return “Provisioning request already exists” for a failed job and never create a live employee.

Options:

- Allow retry when existing job `state === "failed"` by creating a new job/employee with a retry suffix/idempotency revision.
- Or make frontend generate a new idempotency key after a failed provision.
- Or add a repair/retry endpoint that reuses the same account/session but creates a fresh employee attempt.

4. Improve `provision-from-session` error surface.

Currently:

```ts
if (outcome.kind !== "ok") return failed("validation_failed", "The employee could not be started.")
```

And `provision_employee` returns generic:

```text
Provisioner failed to create a live employee.
```

The owner can see a concise message, but operator proof should include non-secret `provisioning_job_id`, `employee_id`, failure_state, and logs summary.

## Useful Commands

Do not source the full production env into a host dev stack.

Check current public stack:

```bash
docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}' | rg 'amtech-hermes|amtech-ai-employee|amtech-tunnel'
curl -sS http://127.0.0.1:8080/health
curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee
```

Inspect latest non-secret audit/session state:

```bash
docker exec amtech-ai-employee-manager-1 node --input-type=module -e '...use serviceClient; query onboarding_sessions, audit_log, provisioning_jobs, employee_profile_builds...'
```

Rebuild after source fixes:

```bash
npm run typecheck --workspace @amtech/manager
npm run typecheck --workspace @amtech/web
npm run test:unit -- tests/unit/create-account-error.test.ts tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts tests/unit/phone-verify-dev-bypass.test.ts
npm run prod-like:normal:up -- --skip-tunnel
```

If the named tunnel needs reconnecting:

```bash
docker rm -f amtech-tunnel
TOKEN=$(docker run --rm --user 0 \
  -v "$PWD/infra/.local/cloudflared/cert.pem:/cert.pem:ro" \
  cloudflare/cloudflared:latest tunnel --origincert /cert.pem token amtech-tunnel)
docker run -d --name amtech-tunnel --network host --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$TOKEN"
```

Do not print the token.

## Copy-Paste Prompt For Next Session

You are continuing AMTECH production-level normal employee live deploy in:

```text
/home/georgej/AMTECH/GTM-RESEARCH/mvp-build
```

Reference-first. Read, in order:

1. `../identity.md`
2. `../CODEGRAPH.md`
3. `CODEGRAPH.md`
4. `AGENTS.md` or `CLAUDE.md`
5. `docs/production-normal-employee-live-deploy-runbook.md`
6. `docs/onboarding-live-review-2026-07-16.md`
7. `docs/public-interaction-standard.md`
8. `memory/2026-07-16-0405-normal-employee-rebuild-xai-ok-cloudflare-auth-gated.md`
9. `memory/2026-07-16-0538-provisioner-failure-live-production-handoff.md`
10. `memory/MEMORY.md` newest entries only

Ultimate goal:

Complete a full live production-like AMTECH normal employee run from public onboarding to using the employee and connecting tools:

- public Cloudflare `/create-ai-employee`;
- real chat-first onboarding;
- real Twilio Verify;
- real Supabase account creation;
- Start Employee;
- live Hermes employee container;
- owner web client;
- real provider-backed employee reply;
- connect/use relevant tools/connectors where available, especially QuickBooks/accounting/payment/field-service/website/lead/ads context.

Current running stack at last handoff:

```text
amtech-tunnel                 container 092fb2e18436, up
amtech-ai-employee-caddy-1    container 39acdfa7d4ea, healthy, host :80/:443
amtech-ai-employee-web-1      container 5cdc92fb8fc2, healthy, 127.0.0.1:3000
amtech-ai-employee-manager-1  container 29b6df46e4c3, healthy, 127.0.0.1:8080
```

Cloudflare:

```text
tunnel name: amtech-tunnel
tunnel id: 496ceef3-e2a8-49f5-9af3-c3b155534627
connector id: 00ebed27-2432-4eda-9c64-162dbd91dc20
public URL: https://agent.amtechai.com/create-ai-employee
```

The live failure to fix:

```text
Provisioner failed to create a live employee.
session_id: onb_g3aarxlemxpf7kqrdhhqwi
account_id: acct_0f1qj0k6k4coq6mepqsdy7
attempted employee_id: emp_t596x0vbwtd23xdqonfp09
provisioning_job_id: pjob_t934ptxbf0y8ar427q7s7u
audit_id: aud_s7ekwufunsfyegl42xyx1f
```

Known findings:

- The provisioner failure details are currently swallowed by `callProvisioner()`, which throws only `provisioner_failed`.
- A controlled invalid `profile_context` diagnostic showed a concrete renderer crash: `Cannot read properties of undefined (reading 'memory_chars')`.
- A controlled diagnostic using the real `buildProfileContext()` path succeeded end-to-end, proving Caddy reload and Hermes Docker runtime can work in the current stack.
- There is likely a retry/idempotency bug: failed provisioning jobs with the same frontend idempotency key are returned as existing/pending instead of allowing a clean retry.

Fix first:

1. Preserve `/provision` failure logs in `provisioning.stub.ts`.
2. Make `memory-seed.ts` default missing `memory_limits`.
3. Allow retry after failed provisioning idempotency key, or generate a fresh retry key from the frontend/repair path.
4. Improve operator proof in `provision-from-session`.
5. Rebuild source and retry the full live production run.

Do not use fixture mode, `/api/dev/login`, local-only acceptance, public-estimator scripts, or bypasses as success.
