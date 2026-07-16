# Production provisioning recovery + owner dashboard

Date: 2026-07-16 06:06 EDT
Status: source-wired; live core still running pre-rebuild containers; full production run still pending
Scope: normal employee public onboarding, provisioning retry recovery, multi-employee/account modifiers, and owner dashboard access

## What changed

- Preserved provisioner failure detail in `apps/manager/src/tools/provisioning.stub.ts`.
  - Non-OK `/provision` responses now carry `failure_state`, HTTP status, and redacted logs into `provisioning_jobs.logs`, `provisioning_jobs.failure_state`, `employee_profile_builds.validation_output`, audit details, and returned proof.
  - Obvious token/key/secret/password shapes are redacted before persistence.
- Fixed failed provisioning idempotency recovery in `apps/manager/src/tools/provisioning.stub.ts`.
  - Existing non-failed jobs still return `pending`.
  - Existing failed jobs now create a fresh employee/job attempt with a retry idempotency key and a `retry_of_provisioning_job_id` marker.
  - Cross-account reuse of an idempotency key fails with `idempotency_conflict`.
- Made native memory seeding defensive in `apps/manager/src/lib/memory-seed.ts`.
  - Missing `profile_context.memory_limits` now defaults to `{ memory_chars: 2200, user_chars: 1375 }` instead of crashing profile rendering.
- Improved the public Start Employee error surface in `apps/manager/src/server.ts`.
  - `/manager/onboarding/provision-from-session` now returns operator proof fields for failures: `provisioning_job_id`, `employee_id`, `failure_state`, and `failure_code`, while keeping the owner-facing message concise.
- Added a production owner dashboard path.
  - Shared route: `MANAGER_API.ownerDashboard`.
  - Manager endpoint: `POST /manager/owner/dashboard`, owner-session scoped, returns the account's employees plus runtime endpoint summaries.
  - Web page: `apps/web/app/dashboard/page.tsx`, server-rendered from the `amtech_owner_session` cookie.
  - Onboarding page now stores the returned employee route after Start Employee and shows `Open employee` plus `Dashboard` actions.
- Added regression coverage.
  - Provisioner failure logs are preserved and redacted.
  - Failed provisioning idempotency keys can retry into a new job.
  - Multiple provisions under one account create separate employees, jobs, endpoints, and MCP credentials.
  - Same founder phone can appear on different accounts while duplicate phone rows inside one account are rejected.
  - Missing profile memory limits do not crash.

## Why

The previous live attempt reached public onboarding, Twilio Verify, and account creation, then failed at Start Employee with only `provisioner_failed`. That is not production-operable: the operator needs non-secret provisioner logs, and the owner must be able to retry after a transient failure without the original browser idempotency key permanently trapping the session.

Production also needs the normal owner loop to be navigable without operator-only shortcuts: after an employee is created, the owner must be able to open it, return to a dashboard, and create another employee.

The multiple-employee and same-founder-phone requirements are treated as acceptance modifiers on the production path, not a separate product track.

## Current status

- Source status: `source-wired`.
- Verification status: focused unit/type/build gates passed.
- Live runtime status: current public stack is still the pre-rebuild stack. The code changes in this handoff are not live in the running Manager/Web containers until the production-like stack is rebuilt/redeployed.
- Live production proof status: still pending. Do not count this as launch proof yet.

Current running containers observed at 06:06 EDT:

```text
amtech-tunnel                 Up 38 minutes
amtech-ai-employee-caddy-1    Up 38 minutes (healthy)
amtech-ai-employee-web-1      Up 39 minutes (healthy)
amtech-ai-employee-manager-1  Up 41 minutes (healthy)
```

Manager health:

```text
{"status":"ok","tools":65,"expected":65}
```

Public ingress remains up:

```text
https://agent.amtechai.com/create-ai-employee
HTTP/2 200
server: cloudflare
via: 1.1 Caddy
```

## Files / seams touched

- `apps/manager/src/tools/provisioning.stub.ts`
- `apps/manager/src/lib/memory-seed.ts`
- `apps/manager/src/server.ts`
- `apps/web/app/create-ai-employee/CreateClient.tsx`
- `apps/web/app/dashboard/page.tsx`
- `packages/shared/src/routes.ts`
- `tests/unit/provisioning-runtime-backend.test.ts`
- `tests/unit/profile-context.test.ts`
- `tests/unit/fake-supabase.test.ts`
- `tests/unit/_helpers/fake-supabase.ts`

Seams:

- Public onboarding -> account creation -> Start Employee.
- Manager provision tool -> provisioner service -> employee runtime rows.
- Owner session -> owner dashboard -> employee work surface.
- Same owner phone across close-to-prod trial accounts.
- Multiple employee attempts under one account.

## Carry-forward / next

1. Rebuild/redeploy the production-like normal stack so the running Manager/Web containers include these changes.
2. Run the real public flow at `https://agent.amtechai.com/create-ai-employee`:
   - chat-first intake;
   - real Twilio Verify;
   - real account creation;
   - Start Employee;
   - open the returned employee route or `/dashboard`;
   - send one provider-backed web message;
   - verify SMS inbound/outbound if the employee has an SMS number.
3. Capture proof:
   - onboarding session id;
   - Twilio Verify SID/status;
   - account id and owner email;
   - employee id;
   - `amtech-hermes-<employee_id>` container id/status;
   - provisioning job id and logs;
   - runtime endpoint row;
   - Cloudflare tunnel id/container id;
   - provider-backed reply evidence;
   - dashboard/open-employee evidence.
4. Modifier checks:
   - create a second employee under the same account and verify separate employee/runtime/route/credential rows;
   - create another close-to-prod account using `+18058869173` with a fresh verified-phone proof row;
   - verify employee-specific SMS webhook routing remains unambiguous.

## Verification

Passed:

```bash
npm run test:unit -- tests/unit/provisioning-runtime-backend.test.ts tests/unit/profile-context.test.ts tests/unit/fake-supabase.test.ts tests/unit/create-account-error.test.ts tests/unit/onboarding-compile.test.ts
npm run build --workspace @amtech/shared
npm run typecheck --workspace @amtech/manager
npm run typecheck --workspace @amtech/web
npm run build --workspace @amtech/web
curl -sS http://127.0.0.1:8080/health
curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee
```

Not run yet:

- Rebuild/redeploy of the running production-like stack after these code changes.
- Full live owner onboarding through provider-backed employee reply.
- Second live employee under the same account.
- Second close-to-prod account with the founder phone.
