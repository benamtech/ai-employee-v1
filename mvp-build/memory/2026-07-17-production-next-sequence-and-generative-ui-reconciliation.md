# Production next sequence and generative UI reconciliation

Date: 2026-07-17  
Branch: `research`  
Status: docs-only reconciliation; source-wired product state unchanged; no build/runtime/provider acceptance run

## Session grounding and branch state

- Read `identity.md`, root and MVP CODEGRAPH files, MVP agent instructions, durable memory and the newest relevant WS1/WS2 handoffs, canonical runbook/GTM/security/wiki records, and the active UX packet.
- Ignored website-framework handoffs for product sequencing as instructed.
- Initial GitHub comparison showed `research` had zero unique commits and was one commit behind `main`.
- Fast-forwarded `research` to `main` commit `29d9a4081b8c07e1a56103e3d1f4159a6a336a32` through the GitHub app. `main` was not modified.
- The local shell could not resolve GitHub, so the literal local `git fetch && checkout && rebase` command could not run. With no unique research commits, the connector fast-forward is equivalent in branch result.

## Review result

The canonical runtime/product documentation was already coherent:

- one normal-employee launch path through public onboarding, isolated runtime, owner web, provider reply, and useful connected-tool proof;
- WS1 model-gateway custody and profile integrity are source-wired only;
- WS2 resource/retry/drift/command foundations are source-wired, while the true DB-backed reconciler worker is pending;
- WS3 ambient inbox is groundwork only;
- Start free plus Managed AI Employee from $400 is canonical;
- the public estimator is outdated and non-canonical.

The remaining contradictions were in UX documentation:

- `docs/ux/02-current-ux-system-map.md` still named a website estimator as an alignment target;
- `docs/ux/07-post-release-ui-roadmap.md` still listed a public estimator conversation as future product work;
- generative-UI docs stated the acceptance gate, but did not give the exact position in the now-to-live sequence or name the current template/design mismatch.

## Documentation changes

- Replaced estimator-led future-surface language with canonical create/claim/login/account onboarding, customer portal, marketing demonstrations, and a clear non-canonical estimator rule.
- Clarified that generative UI is source-wired but not provider/runtime accepted.
- Recorded the exact Manager-owned boundary: typed `WorkView`, escaped AMTECH template, sandboxed iframe, approval-id binding, host-routed intents, and fallback.
- Recorded the current source-level visual mismatch in `apps/manager/src/lib/ui-resources.ts`: legacy dark-mode branch and blue primary action versus the canonical light-only Avery system and AMTECH red.
- Defined the release order: baseline normal-employee acceptance first, then one narrow provider-backed generative work-object proof, then richer interaction/direct manipulation.

## Exact next execution sequence

### P0-A — prove the static/database boundary

1. Apply migrations `0031`–`0033` to a disposable production-shaped database.
2. Verify constraints, partial uniqueness, indexes, RLS, grants, existing-row compatibility, and generated row shapes.
3. Run targeted TypeScript/type/API checks for shared exports, the Hono model-gateway entrypoint, production image inclusion, Supabase shapes, and `ProvisionerResult` contracts.

### P0-B — prove model/profile isolation

1. Prove employee-runtime reachability to the loopback host-private Model Gateway and public non-reachability.
2. Prove missing, malformed, cross-employee, expired, and revoked credentials fail closed.
3. Render and scan a disposable profile for forbidden secret names/values, unresolved tokens, unsafe permissions, and checksum drift.
4. Rotate a credential, prove the new token/checksum is live, and prove the old credential is revoked safely.

### P0-C — finish durable lifecycle control

1. Implement the continuously running DB-backed provisioning reconciler worker.
2. Route bounded transitions through inspect -> decide -> apply -> verify -> persist with leases and compare-and-swap evidence.
3. Repair host-provisioner filesystem idempotency-marker behavior and compensated-job fresh-key retry semantics.
4. Implement fleet drift scans/repair for orphan containers/networks, stale Caddy, missing profile/checksum, expired credentials, stuck jobs, and reboot reconstruction.
5. Prove Twilio/provider binding and welcome/customer-facing effects cannot occur before runtime plus route acceptance.

### P1 — converge external events and operator commands

1. Migrate Twilio, Gmail, Stripe, and other provider ingress to verified atomic `ambient_event_inbox` insertion plus leased workers, retry, dead letter, and replay.
2. Route admin suspend/reprovision/rotate/repair through `provisioning_commands` and the reconciler.

### Acceptance run — normal employee

Provision one fresh normal employee through the real public browser path and retain migration, tunnel, onboarding, Twilio, account/employee, credential, profile, container/network, runtime health, provider response, approval, artifact, and useful connected-tool proof ids.

### Acceptance run — generative UI

After the normal-employee gate passes:

1. align the Manager-owned generated template to the light Avery system without relaxing typed templates or approval binding;
2. add an owner-readable explanation of why the view appeared, which business facts were used, what approval is requested, and what action follows;
3. run one narrow provider-backed Hermes slice from real business context -> typed work view -> Manager `ui://` resource -> owner action -> approval/proof path -> external result;
4. retain proof ids binding the generated view, approval, action, and external result;
5. only then expand beyond accept/reject/respond into richer generated work objects or direct manipulation.

## Files changed

- `mvp-build/docs/ux/02-current-ux-system-map.md`
- `mvp-build/docs/ux/04-implementation-coverage-audit.md`
- `mvp-build/docs/ux/05-generative-ui-frontier.md`
- `mvp-build/docs/ux/07-post-release-ui-roadmap.md`
- `mvp-build/memory/2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`
- `mvp-build/memory/MEMORY.md`

## Unresolved risks

- Migrations and generated DB/API shapes remain unvalidated.
- The true reconciler worker and complete drift/reboot recovery loop do not exist yet.
- Host-provisioner failed-operation idempotency markers can block same-key retry.
- Compensated-job retry semantics need deterministic fresh-key proof.
- Model-gateway rate limiting is process-local and spend enforcement is not transactional accumulated usage.
- Credential rotation runtime reload/restart and old-token revocation sequencing remain unproven.
- Provider ingress is not yet inbox-first.
- Generated MCP-UI visuals are not aligned to the canonical design system.
- No live provider-backed generated work object has been produced or acted on.

## Validation not run

No full build, typecheck, unit/integration suite, migration application, production Compose run, browser onboarding, provider call, hostile-runtime probe, credential rotation, drift/reboot test, accessibility audit, or proof artifact generation was run. Documentation and static source review only.
