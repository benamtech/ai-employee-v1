# Artifact Workbench, Runtime Capability Evidence, and Golden Employees

Status: **source implementation; target-host and provider-backed acceptance incomplete**  
Standard: v0.2 ratified  
Active program: `../../production-readiness-program/`  
Current WS-05/WS-06 supplement: `../../production-readiness-program/19-ws05-ws06-owner-runtime-source-transaction.md`

This slice does not introduce a new workflow engine, authority plane, or lifecycle launcher. It composes existing assignment, approval, durable command/effect, work-resource, generated-view, connector-custody, and Hermes runtime boundaries into artifact-centered owner journeys.

## Production sequence

1. Run the exact pinned Hermes image filesystem proof.
2. Collect effective-capability evidence from runtime reporting, dependencies, credentials, network, connector health, policy/entitlement, and a recent live probe.
3. Create an assignment-scoped artifact and immutable revision.
4. Revise the same artifact; the canonical `artifacts` row points to the current immutable revision.
5. Validate only the current revision and retain validator evidence.
6. Render revision metadata, diff, validation, approval, effect, publication, and verification through the existing work-resource/generated-view grammar.
7. Request approval for the exact current revision/hash.
8. Resolve approval through an authorized human assignment principal.
9. Publish through the existing durable command/effect path.
10. Verify the observed target and retain the post-publish receipt.
11. Preserve the same work/revision/approval/effect/receipt/proof identity across Web, SMS, and signed Review projections.
12. Reconnect or recover without replaying accepted owner intent or duplicating the external effect.

## Runtime filesystem contract

The rendered profile remains immutable at `/opt/amtech/profile:ro`. Hermes receives an employee-scoped writable data root at `/opt/data` and writable `/workspace`.

`infra/scripts/acceptance/hermes-exact-image-filesystem-proof.mjs` pins `nousresearch/hermes-agent:v2026.7.1`, records the resolved OCI digest, and proves:

- `/opt/data` and `/workspace` are writable and persistent across recreation;
- `/opt/amtech/profile` and the root filesystem are read-only;
- package plugins are visible inside the employee data root;
- session, memory, checkpoint, and workspace markers survive a second container.

The launcher materializes only the selected profile package's plugins. It does not expose a host-global plugin directory or erase runtime-installed plugins.

## Effective capability truth

A capability is effective only when all dimensions pass:

- advertised by selected profile/product surface;
- reported by the exact running Hermes runtime;
- dependency installed/configured;
- credential present through approved custody;
- provider/network route reachable;
- assignment policy and entitlement allow it;
- required connector is healthy;
- recent capability-specific live probe passed.

Profile YAML, environment-key presence, tool discovery, or provider branding alone is not truth. Unknown, skipped, stale, or failed evidence remains ineffective.

## Connector and authorization protocol

Owner setup is generated from the shared managed connector manifest. The manifest declares canonical identity/aliases, actual authorization protocol, setup flow, exact Manager tools, readiness source, permissions/scopes, permitted hosts, continuation, credential posture, and owner-safe language.

Current adapters:

- Gmail — OAuth authorization code;
- QuickBooks — OAuth authorization code;
- Stripe — provider-hosted Connect onboarding;
- reviewed read-only MCP — direct only when every risk axis is explicitly false;
- unknown or consequential connector — discoverable but Manager-mediated and fail-closed for self-service.

The browser starts an approved setup through an assignment-authorized Manager route. It does not choose a Manager tool, permission scope, credential mode, authorization host, or provider continuation.

OAuth state is HMAC-bound to employee/provider and a safe relative return path. Provider onboarding/authorization hosts are exact HTTPS allowlists. Tokens and platform credentials remain in Manager/provider custody.

## Capability-to-provider binding

Broad categories such as `communication`, `accounting`, or `money` organize owner UX and task matching. They are not provider identity.

Exact managed-tool ownership and readiness source come from `packages/shared/src/connector-setup.ts`. `capability-registry.ts` and `tool-capability-catalog.ts` consume the manifest, so another accounting connector cannot silently inherit QuickBooks scopes, account rows, or setup behavior.

## Artifact data model

`artifacts` remains canonical identity/current-head projection. Additive tables provide immutable evidence:

- `artifact_revisions` — parent, revision number, payload, SHA-256, source manifest, storage reference, creator/run provenance;
- `artifact_validations` — validator, status, summary, evidence, revision binding;
- existing approvals, durable commands, effects, audits, and work resources remain the authority/effect system;
- `effective_capability_evidence` records capability decisions separately from artifact state.

Revision updates use compare-and-swap. Validation rejects stale revisions. Publish approval snapshots the current revision hash. Later revision invalidates stale execution through existing approval authority.

## Owner snapshot and projection contract

The Web owner surface installs a full snapshot only after exact account, employee, assignment, authority-version, operating-context, full-read-model, and tuple-cursor validation. The cursor is established before ordered deltas. Duplicate, stale, reordered, malformed, or cross-scope deltas fail closed. Reconnect clears projected authority and waits for a new validated snapshot; it does not resubmit accepted owner intent.

This source contract does not yet prove fixture-free Web, SMS, or signed Review convergence. All three must ultimately project the same durable work revision, approval snapshot, effect identity, terminal receipt, recovery state, and proof reference.

## Protocol adapters

- AMTECH generated views remain typed work projections with bounded host intents.
- Current `ui://`/iframe code is compatibility groundwork for official negotiated MCP Apps; it is not yet a full conformance claim.
- Current strict snapshot/SSE/work-event code is analogous groundwork for a versioned AG-UI adapter; shared state remains projection, not authority.
- Browser, MCP Apps, AG-UI, SMS, and signed Review clients cannot directly mutate authority, approval, connector custody, or provider state.

## Golden employee scenarios

All scenarios use `amtech-artifact-v1`, the same revision/validation/approval/publish grammar, and the same acceptance harness.

### Website Employee A

Produces one responsive webpage project with initial/revised HTML/CSS, generated diff, semantic/responsive/keyboard/external-dependency validation, exact-revision approval, sandbox publish, post-publish verification, replay/idempotency proof, and owner receipts.

### Contractor Office Employee B

Produces one job packet with customer/site, labor/material math, assumptions/exclusions, tentative schedule, and approval-gated outbound draft. No customer message is sent and no schedule is committed by the artifact journey.

### Bookkeeping Employee C

Produces one bounded monthly review packet with reconciliation, exception provenance, proposed-versus-observed write separation, sensitive-data scan, and uncommitted approval-gated accounting proposal. No payroll, tax filing, bank transfer, or QuickBooks write is performed by the artifact journey.

## Acceptance commands

```text
npm run prod:boundary:hermes-filesystem
npm run prod:boundary:capabilities
npm run acceptance:golden:website
npm run acceptance:golden:contractor
npm run acceptance:golden:bookkeeping
```

Capability and golden scripts write exact-SHA JSON evidence under `AMTECH_PROOF_DIR`. A source/unit pass is not target-host/provider acceptance.

## Release gate

Launch clearance requires, on the same deployed SHA and pinned Hermes digest:

- exact-image filesystem proof;
- no advertised capability marked effective without complete fresh evidence and a passing live probe;
- real managed connector setup, health, assignment binding, owner return, revocation, and failure-path proof for the adapters used by the journey;
- Website A passes manually before automated acceptance;
- Website A, Contractor B, and Bookkeeping C pass with exact account/employee/assignment identity, revision, validation, approval snapshot, one effect, terminal receipt, recovery, publication reference, verification receipt, refindable proof, and idempotent replay;
- Web, SMS, and signed Review converge on the same durable state without fixture substitution;
- viewer principals remain read-only and cannot connect, revise, validate, approve, or publish;
- protocol/channel adapters do not create authority.
