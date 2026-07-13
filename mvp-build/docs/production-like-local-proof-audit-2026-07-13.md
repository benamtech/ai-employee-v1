# Production-Like Local Proof Audit - July 13, 2026

Status: senior audit document for the normal contractor onboarding / Work Surface path after live-Anthropic local testing paused for lack of funded provider credits.

Scope: the `mvp-build` production-like local path, with the Manager control plane, Next Work Surface, Supabase-backed state, per-employee Hermes runtimes, Caddy/Docker deploy scaffold, and the current proof scripts. This document revisits six findings from the July 13 audit, including the corrected requirement that the AMTECH-owned Anthropic key must be usable by both Manager orchestration and Hermes employee runtimes.

## Pass / Fail Criteria

The proof path passes when all of these are true:

- The normal contractor onboarding path can run with live Anthropic and `LOCAL_MODEL_BRIDGE` unset.
- The Work Surface can send an owner message to a Hermes employee and capture the response, relevant run/job IDs, and any artifact IDs.
- Anthropic credential propagation is explicit, tested, redacted in proofs, and documented as an AMTECH-owned runtime/provider secret rather than a tenant-owned employee credential.
- Consequential database writes fail loudly instead of reporting success after a Supabase/PostgREST error.
- Owner/session secrets are not sent through URL query strings where proxy/server logs can capture them.
- Local and deploy proof scripts report the same provider/runtime reality as `.env`.
- A new operator can reproduce the production-like stack from committed docs and example env files without private handoff notes.

Current result: fail. The core architecture is viable, but the proof is not yet trustworthy enough to be a production-like gate.

## Summary Of Findings

1. Hermes and Manager both need the AMTECH provider key, but the credential contract is not written or tested clearly enough.
2. Manager's Docker socket access is likely intentional for this architecture, but it must be treated as a host-orchestrator trust boundary with explicit controls.
3. Consequential Supabase writes still bypass the project's own `mustWrite` discipline.
4. The Work Surface SSE path forwards owner session tokens to Manager in a query string.
5. Local proof/status scripts are split between old bridge assumptions and the new live-provider path.
6. The production deploy scaffold has missing/stale operator inputs.

## 1. AMTECH Provider Key Propagation To Hermes Runtime

Status: issue confirmed, but reframed. The problem is not that the employee runtime needs no key. Hermes does need a model provider credential at runtime. The problem is that the repo mixes three stories: "employee model provider key", "Manager-injected secret ref", and direct `ANTHROPIC_API_KEY` rendering into per-profile env.

Local evidence:

- `apps/manager/src/lib/orchestrator-model.ts` now correctly treats a blank `ORCHESTRATOR_API_KEY` as absent and falls back to `ANTHROPIC_API_KEY` for Anthropic.
- `apps/manager/src/lib/profile-renderer.ts` renders `ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? ""` into the per-profile template.
- `packages/agent-template/.env.tpl` says provider secrets are provided as Manager secret references, but also renders `ANTHROPIC_API_KEY={{ANTHROPIC_API_KEY}}`.
- `packages/agent-template/distribution.yaml` calls `ANTHROPIC_API_KEY` an "Employee model provider key."
- `infra/scripts/local/start-hermes-container.sh` passes the rendered profile `.env` to the employee container through Docker `--env-file`.
- The current live proof failure shape was `No Anthropic credentials found...`, while `.env` had an AMTECH-side Anthropic key and the profile config had `provider: anthropic`.

External/source evidence:

- Nous Research Hermes docs/source describe config in `config.yaml` and secrets in `.env` under `$HERMES_HOME`, and troubleshooting model/provider issues says to check `.env` for the right API key.
- The same Hermes docs state that some tools only appear when required env vars are present and that provider setup is part of Hermes model configuration.

Why this matters:

This is a credential custody and reproducibility problem. The desired design is an AMTECH-managed provider key that powers both Manager's onboarding/orchestration model calls and the Hermes runtime's model calls. That is valid for this architecture. What is unsafe is leaving the contract implicit. Without a written contract, future agents will repeatedly "fix" this in opposite directions: either removing the runtime key and breaking Hermes, or treating the key as per-tenant/per-employee and overexposing it.

Recommended fix:

Define a single model credential contract:

- Name the key as an AMTECH-owned runtime/provider secret, not an employee-owned key.
- Make the renderer comments match reality: Manager may render the shared provider key into the runtime env because Hermes needs it to call the LLM.
- Keep the key out of browser, logs, proof JSON, Caddy snippets, profile manifests, and database rows.
- Add an explicit redacted proof step that checks Manager and the employee runtime both see a non-empty key without printing the value.
- Update `distribution.yaml` and `.env.tpl` language from "Employee model provider key" to "AMTECH-managed model provider key available to this runtime."
- Decide and document rotation semantics: changing `ANTHROPIC_API_KEY` requires employee runtime restart/reprovision, not only Manager restart.

Reasoning:

Hermes is a runtime, not only a profile artifact. A provider-backed runtime needs the provider credential at runtime. Since this product intentionally runs isolated resident employee agents, the correct boundary is not "only Manager can ever hold the key"; the correct boundary is "only trusted AMTECH control/runtime processes hold the key, and it is never tenant-controlled or browser-visible."

Acceptance criteria:

- `live:status` reports Anthropic provider/model from `.env` with the bridge unset.
- A redacted env probe shows `ANTHROPIC_API_KEY=present` in Manager and in the target Hermes runtime process/container, without printing the secret.
- Profile package files and proof JSON never contain the raw key.
- The Work Surface proof no longer fails with missing Anthropic credentials once funded API access exists.

## 2. Manager Docker Socket And Host-Orchestrator Boundary

Status: intentional architecture with high blast radius. Do not treat this as accidental spaghetti. The product needs Manager to provision, restart, and route resident Hermes employee containers. A Docker-control plane is a reasonable Pod Alpha design. The missing piece is explicit threat modeling and operational guardrails.

Local evidence:

- `infra/deploy/docker-compose.yml` mounts `/var/run/docker.sock:/var/run/docker.sock` into Manager.
- `docs/production-networking-and-dns.md` already acknowledges that Manager compromise equals full host control.
- `apps/manager/src/lib/command-runner.ts` runs env-configured command strings for lifecycle and Caddy operations with the full Manager env.
- `apps/manager/src/lib/profile-renderer.ts` calls `runCommandString(process.env.HERMES_RUNTIME_COMMAND, ...)`.
- `apps/manager/src/lib/caddy-activation.ts` calls env-configured Caddy validate/reload/smoke commands.

External/source evidence:

- Docker's official daemon docs warn that unauthorized Docker daemon access can lead to root access on the host.
- Docker's official socket-protection docs say client credentials that can instruct the daemon should be guarded like a root password.
- Docker's rootless-mode docs describe rootless Docker as a mitigation that runs the daemon and containers without root privileges.

Why this matters:

If Manager is compromised, Docker socket access gives an attacker a path to host control. That may be acceptable for a single-host Pod Alpha if Manager is the trusted orchestrator, but it changes the security model: Manager is not just an app server; it is host control software. That affects dependency review, logging, admin access, command configuration, deployment hardening, and incident response.

Recommended fix:

Keep the architecture for Pod Alpha, but formalize it:

- Document Manager as a trusted host orchestrator in deploy docs and runbooks.
- Replace generic command strings over time with typed lifecycle adapters: `startRuntime(profilePath)`, `validateCaddy(path)`, `reloadCaddy()`, and `smokeCaddy(route)`.
- Stop passing the entire Manager `process.env` to command children where not required. Build minimal env maps per command.
- Restrict who can edit production env vars containing lifecycle commands.
- Pin and review the Manager image and dependencies as the top-priority security surface.
- Keep employee containers unable to reach the Docker socket; only Manager should hold Docker control.
- Evaluate rootless Docker or a small host-side runtime supervisor for post-Pod-Alpha. A supervisor could expose only the lifecycle verbs AMTECH needs instead of full daemon access.

Reasoning:

The right question is not "is Docker socket access always wrong?" It is "is the component with Docker access intentionally trusted to control the host?" For AMTECH, Manager appears to be that component. Therefore the fix is not necessarily to remove Docker access now; the fix is to remove ambiguity, reduce command/env footguns, and make any future narrowing straightforward.

Acceptance criteria:

- Deploy docs explicitly label Manager as the host orchestrator and list the blast radius.
- Production env examples do not rely on arbitrary shell-like command strings without documented ownership.
- A proof confirms employee containers do not mount `/var/run/docker.sock`.
- A future hardening milestone exists for rootless Docker or a constrained supervisor.

## 3. Consequential Supabase Writes Bypass `mustWrite`

Status: confirmed correctness issue.

Local evidence:

- `apps/manager/src/lib/db.ts` states that PostgREST calls return `{ data, error }`, and ignored write errors can produce no-op writes that still report success.
- `apps/manager/src/tools/provisioning.stub.ts` has direct `insert` / `update` calls for `employees`, `employee_manifests`, `business_brain_facts`, `provisioning_jobs`, `employee_profile_builds`, `runtime_endpoints`, and failure-state updates.
- Similar raw mutations appear in connector and tool surfaces such as Stripe, Gmail, QBO, identity, estimate, admin actions, delivery routing, event triage, and event delivery.
- Some writes are intentionally best-effort telemetry. The issue is that the code does not consistently distinguish telemetry from state transitions.

External/source evidence:

- Supabase JavaScript docs show query and mutation calls returning `{ data, error }`.
- Supabase examples check `error` after write calls.
- Supabase docs also state that RLS can make writes affect zero visible rows depending on policies, making explicit error and row-count handling important.

Why this matters:

Provisioning and tool execution are user-visible workflows. If a write fails and the code ignores `error`, the system can say an employee was provisioned, a connector was linked, an artifact was created, or an approval was updated when the database did not persist that fact. That leads to orphaned runtime containers, missing audit trails, duplicate retries, and hard-to-debug pilot failures.

Recommended fix:

Make write handling explicit across Manager:

- Use `mustWrite` for every state transition that affects user-visible workflow correctness.
- Keep best-effort writes non-fatal only when they are truly telemetry, and mark them with a helper such as `bestEffortWrite(..., "audit_log.insert")` so omissions are intentional.
- For updates that must affect a row, chain `.select("id")` and assert at least one row was returned.
- Add a lint or test scan that fails on raw `.insert(`, `.update(`, `.delete(`, or `.upsert(` in Manager unless the call is wrapped in `mustWrite`, `insertDedup`, or `bestEffortWrite`.
- Prioritize provisioning first, then estimate/artifact/approval writes, then connector state machines.

Reasoning:

The repo already has the right abstraction and the right comment. The implementation has drifted. This is a low-architecture-change fix with high reliability impact.

Acceptance criteria:

- Provisioning cannot return success if any required employee/profile/runtime DB row failed to persist.
- Estimate/artifact/approval creation cannot return success without persisted rows.
- Tests inject Supabase write errors into provisioning and at least one provider tool and assert the tool fails loudly.
- A scan documents every intentionally best-effort write.

## 4. Owner Session Token In Work Surface SSE URL

Status: confirmed security/logging risk.

Local evidence:

- `apps/web/app/api/employee/[employeeId]/events/route.ts` reads the `amtech_owner_session` httpOnly cookie and appends it as `owner_session_token` in the Manager SSE URL.
- `apps/manager/src/server.ts` authorizes the stream from `c.req.query("owner_session_token")`.
- The browser does not receive the token directly, but the token can appear in Next, Manager, proxy, tracing, or error logs as part of a URL.

External/source evidence:

- WHATWG's EventSource interface takes a URL and only has `withCredentials` in `EventSourceInit`; it does not expose arbitrary request headers.
- MDN documents `EventSource` as opening a persistent connection to a URL, with optional credential mode.

Why this matters:

The httpOnly cookie protects the owner session from browser JavaScript. Forwarding that same token in an internal URL weakens the protection because URLs are commonly logged by app servers, reverse proxies, error tooling, and diagnostic middleware. This is especially sensitive because owner sessions grant access to employee resources and live streams.

Recommended fix:

Keep the browser-facing EventSource pointed at the Next route, but change the Next-to-Manager hop:

- Next should authorize from the httpOnly cookie server-side.
- Manager should receive either:
  - the token in a POST-created short-lived stream ticket, then the SSE URL carries only the ticket ID; or
  - an internal header from Next to Manager, using `fetch` server-side, not browser EventSource headers.
- Prefer a short-lived, single-purpose stream ticket if the Manager SSE endpoint must remain GET-only.
- Ensure logs redact `owner_session_token`, `stream_ticket`, and any future session-like query parameters.

Reasoning:

The browser EventSource API explains why the current code chose a query string. But the architecture already has a Next server proxy. Use that server boundary to keep sensitive credentials out of URLs.

Acceptance criteria:

- No Manager route accepts `owner_session_token` from query string.
- Request logs for SSE URLs contain no owner session token.
- Browser still uses a simple EventSource to `/api/employee/:id/events`.
- SSE reconnect still works after token/ticket changes.

## 5. Local Proof And Status Scripts Are Split-Brain

Status: confirmed proof-quality issue.

Local evidence:

- `infra/scripts/local/test/_lib.sh` now preserves live provider env unless `LOCAL_MODEL_BRIDGE=1`, but comments still describe the local stack as having no funded model key.
- `infra/scripts/local/test/stack-up.sh` correctly calls `load_env`.
- `infra/scripts/local/test/status.sh` does not call `load_env`, so `npm run live:status` can show `provider=default model=claude-opus-4-8` even when `.env` says Anthropic/Haiku.
- `infra/scripts/local/acceptance/05-browser.mjs` waits for old UI text (`Talk to your employee`, `Employee:`) that the current Work Surface no longer renders.
- `infra/.local/proof/headed-work-surface-proof.mjs` targets the current Work Surface placeholder and message flow, but records only status, reply, response keys, body excerpt, and screenshots. It does not capture run/job/artifact IDs.

Why this matters:

A proof script is part of the product's safety case. If status misreports provider state or old acceptance waits for removed UI, agents and operators waste time chasing false failures. Worse, they may believe a live-provider proof passed when it actually used a bridge or skipped the runtime path.

Recommended fix:

Consolidate proof tooling:

- Make `status.sh` call `load_env` before printing provider/model.
- Update comments in `_lib.sh` and `stack-up.sh` to describe both modes: live provider by default, bridge only when `LOCAL_MODEL_BRIDGE=1`.
- Deprecate or rewrite `infra/scripts/local/acceptance/05-browser.mjs`; do not leave it as an attractive stale command.
- Promote `headed-work-surface-proof.mjs` into a named npm script once it captures:
  - employee_id
  - account_id
  - HTTP status
  - reply text
  - `turn_job_id`
  - `run_id`
  - any created artifact IDs
  - screenshots
  - provider/model summary
  - whether `LOCAL_MODEL_BRIDGE` was set
- Redact all tokens and provider keys in proof JSON.

Reasoning:

The current worktree is close. The missing work is not a new harness; it is aligning the existing scripts with the current UI and live-provider assumptions.

Acceptance criteria:

- `npm run live:status` reports the same provider/model as `.env` when run from a clean shell.
- The old browser acceptance is removed, renamed as legacy, or updated to current UI text.
- The final proof JSON includes the IDs needed to audit the path after the browser closes.
- The proof fails closed if `LOCAL_MODEL_BRIDGE=1` when the requested target is live Anthropic.

## 6. Deploy Scaffold Has Missing/Stale Operator Inputs

Status: confirmed reproducibility issue.

Local evidence:

- `infra/deploy/README.md` tells operators to copy `infra/deploy/.env.production.example`.
- No `infra/deploy/.env.production.example` exists in the worktree.
- `.env.example` contains deploy/runtime values, but `HERMES_RUNTIME_COMMAND` is blank and comments still say employee runtime model keys can be supplied separately as Hermes/profile config needs.
- `docs/pod-alpha-runtime-runbook.md` says the provider-backed Hermes model proof is out of scope until funded creds land, which is accurate but leaves the eventual live proof as a separate gate.

Why this matters:

Production-like means a second operator can recreate the environment. Missing example files and scattered env instructions make the deploy path depend on handoff memory. That is fine during exploration, but not acceptable as a launch or proof gate.

Recommended fix:

- Add `infra/deploy/.env.production.example` with every required deploy variable, safe placeholders, and comments for the one-VPS Pod Alpha mode.
- Make `infra/deploy/README.md` copy path match the actual file location.
- Ensure the example contains a concrete `HERMES_RUNTIME_COMMAND` for production, likely the deploy wrapper around `infra/scripts/deploy/start-hermes-container.sh`.
- Add a preflight script that validates required env vars without printing secrets.
- Update the runbook to include the live provider/runtime proof as a launch blocker once credits exist.

Reasoning:

This is not mainly an architecture problem. It is an operator reproducibility problem. The code can be correct and still fail in production if the env contract lives only in prior chat context.

Acceptance criteria:

- Fresh checkout plus `.env.production.example` can run `docker compose ... up` after secrets are filled.
- Preflight reports missing required env keys and never prints secret values.
- Deploy docs and example env agree on paths and command names.

## Positive Findings To Preserve

- Per-employee MCP credentials are scoped, hashed, and stored separately from the global Manager bearer.
- Manager injects `account_id` and `employee_id` server-side for MCP tool calls, preventing model-supplied tenant spoofing.
- Turn queue claim/reaper logic uses service-role-only RPCs and lease-token guarded recovery paths.
- Later migrations harden RLS and revoke public/authenticated access from manager-only tables and sensitive RPCs.
- Dev owner login is double-gated out of production.
- Caddy activation has validate/reload and rollback behavior.

These are the bones to keep. The fixes above should tighten boundaries and proof quality without rewriting the system.

## Recommended Implementation Order

1. Documentation and env contract cleanup for the shared AMTECH provider key.
2. `live:status` and browser proof updates, because they unblock trustworthy live testing when credits return.
3. Provisioning `mustWrite` conversion and write-error regression tests.
4. SSE token transport fix.
5. Deploy `.env.production.example` and preflight.
6. Docker socket guardrail documentation now; supervisor/rootless exploration after Pod Alpha unless a threat model decision makes it launch-blocking.

## Research Sources

- Docker Docs, "Protect the Docker daemon socket": https://docs.docker.com/engine/security/protect-access/
- Docker Docs, "Configure remote access for Docker daemon": https://docs.docker.com/engine/daemon/remote-access/
- Docker Docs, "Rootless mode": https://docs.docker.com/engine/security/rootless/
- Supabase JavaScript reference, insert/select/update behavior and `{ data, error }`: https://supabase.com/docs/reference/javascript/insert
- WHATWG HTML Standard, EventSource interface: https://html.spec.whatwg.org/multipage/server-sent-events.html
- MDN, EventSource: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- Nous Research Hermes agent docs/source, provider and env troubleshooting: https://github.com/NousResearch/hermes-agent

## Verification Run During Audit

- `npm run test:unit -- tests/unit/orchestrator-model.test.ts tests/unit/runtime-backend.test.ts tests/unit/profile-renderer-security.test.ts tests/unit/caddy-activation.test.ts tests/unit/turn-drain.test.ts tests/unit/preview-action.test.ts tests/unit/event-bus.test.ts`
  - Result: 7 files, 60 tests passed.
- `npm run typecheck`
  - Result: passed across workspaces.

