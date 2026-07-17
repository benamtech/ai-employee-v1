# WS1/WS2 production boundary pass

Date: 2026-07-16
Branch: `research`
Status: source-wired; no build/test/live acceptance run in this environment

## Implemented

### WS1 — Model Gateway and Credential Custody

- Added shared `ModelGatewayPolicy`, token-claim, credential, and usage-audit contracts in `packages/shared/src/model-gateway.ts`.
- Extended `ProfileBuildParams` so every production profile render requires a `model_gateway` policy and scoped `render_secrets.model_gateway_token`.
- Replaced direct provider-key rendering in `apps/manager/src/lib/profile-renderer.ts` with gateway-only rendering:
  - `model.provider=custom`
  - `model.base_url=<host-private gateway URL>`
  - `model.api_key=<employee-scoped gateway token>`
  - `model.default=<gateway model alias>`
- Removed rendered `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `ANTHROPIC_API_KEY` profile env slots from `packages/agent-template/.env.tpl`.
- Added fail-closed rendered profile integrity checks for forbidden secret slot names, configured provider master values, unresolved `{{TOKENS}}`, unsafe permissions, deterministic checksum, and read-only freeze.
- Added `apps/manager/src/lib/model-gateway.ts` with HMAC-bound gateway credential mint/verify/revoke, DB-backed active credential validation, expiry/revocation/version checks, request policy enforcement, rate-limit guard, model/provider routing, and redacted usage audit.
- Added `apps/manager/src/model-gateway-server.ts`, an OpenAI-compatible host-private gateway with bounded retries, provider timeout, redacted errors, usage/cost audit, and employee-actionable outage response.
- Added `model-gateway` to `infra/deploy/docker-compose.production.yml`, loopback-bound on host port `8092`.
- Updated `infra/scripts/local/start-hermes-container.sh` so employee containers can resolve `host.docker.internal` for the host-private model gateway and record model gateway credential version as a runtime label.

### WS2 — Provisioning Reconciler, State Machine, and Compensation

- Expanded `provisioning-state-machine.ts` into a reconciler contract layer:
  - canonical resource graph;
  - command vocabulary;
  - retry classification;
  - compare-and-swap transition evidence;
  - resource-state persistence;
  - lease claim helper;
  - reverse compensation order helper.
- Added migration `0032_gateway_reconciler_inbox_foundations.sql` with:
  - `model_gateway_credentials`;
  - `model_gateway_request_audit`;
  - provisioning job lease/retry/drift columns;
  - `provisioning_resource_states`;
  - `provisioning_commands`;
  - canonical `ambient_event_inbox` for WS3 migration groundwork;
  - RLS enabled and anon/authenticated grants revoked.
- Updated `provisioning.stub.ts` to mint both scoped Manager MCP credentials and scoped Model Gateway credentials before host provisioning.
- Provisioning now passes only scoped gateway token + scoped MCP token to the host provisioner.
- Provisioning records resource graph state and transition evidence through resource reservation, credential minting, profile render, runtime start, routing activation, channel configuration, health acceptance, and ready state.
- Host setup no longer treats welcome delivery as part of runtime provisioning; welcome is represented as the final idempotent business-effect-ready resource.
- Host provisioner now supports explicit operations for inspect, drift inspection, drift repair, credential rotation, suspend, remove, replace, and restore in addition to ensure runtime.
- Host provisioner requires `model_gateway_token` for runtime ensure/replace/restore and credential rotation.
- Host provisioner can rotate the model gateway credential in a rendered profile without regenerating the full profile package, recompute checksum, and refreeze the profile tree.

### WS3 groundwork

- Added canonical `ambient_event_inbox` with source/provider/external id, account/employee binding, schema version, event/subject/correlation/causation/dedupe/ordering keys, payload/header/verification metadata, lease/retry/dead-letter state, and processing timestamps.
- Existing provider-specific webhook paths are not yet migrated to the ambient inbox worker.

## Not accepted yet

No build, typecheck, unit, migration, or live runtime/provider acceptance was run in this environment by instruction. This pass is source-wired only.

Required next proof:

1. Apply migrations through `0032` against a disposable production-shaped DB.
2. Run typecheck/build/unit locally.
3. Build production Compose with Manager, model-gateway, host-provisioner, Web, and Caddy.
4. Provision two fresh employees.
5. Verify rendered profiles contain no provider master values.
6. Verify cross-employee gateway token substitution fails.
7. Verify expired/revoked gateway credentials fail closed.
8. Verify duplicate provisioning requests converge and failed retry resumes safely.
9. Verify drift inspection/repair reports orphan/missing profile/container/network cases.
10. Migrate Stripe/Twilio/Gmail ingress to `ambient_event_inbox` in WS3.

## Important caveat

This pass deliberately does not mark the product provider-accepted, runtime-accepted, or release-eligible. The gateway and reconciler boundaries are now source-wired, but production acceptance still requires live host/provider proof IDs.
