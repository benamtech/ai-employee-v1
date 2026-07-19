# Artifact Workbench, Runtime Capability Evidence, and Golden Employees

Status: **[VERIFIED] source implementation; [INCOMPLETE] target-host and provider-backed acceptance**

This slice does not introduce a new workflow engine, agent authority plane, or lifecycle launcher. It composes the existing Manager assignment, approval, durable command, effect receipt, work-resource, generated-view, connector-custody, and Hermes runtime boundaries into one artifact-centered owner journey.

## Production sequence

1. Run the exact pinned Hermes image filesystem proof.
2. Collect effective-capability evidence from runtime reporting, dependencies, credentials, network reachability, connector health, policy, and a live probe.
3. Create an assignment-scoped artifact and immutable revision.
4. Revise the same artifact; the canonical `artifacts` row points to the current immutable revision.
5. Validate only the current revision and retain validator evidence.
6. Render revision metadata, before/after diff, validation evidence, and receipts through the existing `WorkResource` and Manager-owned `WorkView` grammar.
7. Request approval for the exact current revision. The existing approval snapshot hashes the revision content and source manifest.
8. Resolve approval through an authorized human assignment principal.
9. Publish through the existing durable command/effect execution path.
10. Verify the observed sandbox target and retain the post-publish receipt.

## Runtime filesystem contract

The rendered profile remains immutable at `/opt/amtech/profile:ro`. Hermes receives an employee-scoped writable data root at `/opt/data` for native sessions, memory, checkpoints, caches, lazy dependencies, and plugins. The employee workspace remains writable at `/workspace`.

`infra/scripts/acceptance/hermes-exact-image-filesystem-proof.mjs` pins `nousresearch/hermes-agent:v2026.7.1`, records the resolved OCI digest, and proves:

- `/opt/data` and `/workspace` are writable and persistent across container recreation;
- `/opt/amtech/profile` and the root filesystem are read-only;
- package plugins are visible inside the employee data root;
- session, memory, checkpoint, and workspace markers survive a second container.

The normal launcher materializes only the selected profile package's plugins into the employee data root. It does not expose a host-global plugin directory and does not remove runtime-installed plugins.

## Effective capability truth

A capability is effective only when all of these dimensions pass:

- advertised by the selected profile or product surface;
- reported by the exact running Hermes runtime;
- required dependency installed/configured;
- credential present through an approved custody path;
- provider/network route reachable from the employee runtime;
- assignment policy and entitlement allow the capability;
- required connector is healthy;
- a recent capability-specific live probe passed.

Profile YAML and host environment-key presence are evidence inputs, never a sufficient decision. Unknown, skipped, or failed live probes remain ineffective. `effective_capability_evidence` retains each dimension and the failed-dimension list for one assignment/report.

## Connector consent return

The owner consent surface keeps the existing permission language. Its Connect action now enters the existing Manager `connect_email` tool through an owner-authenticated route. OAuth state is HMAC-signed, employee/provider-bound, short-lived, and optionally includes only a safe relative owner-web return path. The provider callback uses the existing token exchange, secret sealing, health/binding, and audit path, then returns to the initiating work path with an explicit connected/error result. Absolute or protocol-relative return URLs are rejected.

## Artifact data model

`artifacts` remains the canonical identity and current-head projection. Additive tables provide immutable evidence:

- `artifact_revisions`: parent link, revision number, payload, content SHA-256, source manifest, storage reference, creator/run provenance;
- `artifact_validations`: validator key, status, summary, evidence, revision binding;
- existing `approvals`, durable commands, effect receipts, audit records, and work resources remain the authority/effect system;
- `effective_capability_evidence` records capability decisions separately from artifact state.

Revision updates use compare-and-swap against the current head. Validation rejects a stale revision. Publish approval snapshots the current revision hash. Any later revision changes the snapshot and invalidates execution through the existing approval-authority assertion.

## Golden employee scenarios

All scenarios use `amtech-artifact-v1`, the same revision/validation/approval/publish grammar, and the same acceptance harness.

### Website Employee A

Produces one responsive webpage project with initial and revised HTML/CSS, a generated diff, semantic/responsive/keyboard/external-dependency validation, exact-revision approval, sandbox publish, post-publish verification, replay/idempotency proof, and owner receipts.

### Contractor Office Employee B

Produces one job packet with customer/site, labor/material math, assumptions/exclusions, tentative schedule, and approval-gated outbound draft. No customer message is sent and no schedule is committed by the artifact journey.

### Bookkeeping Employee C

Produces one bounded monthly review packet with reconciliation, exception provenance, proposed-versus-observed write separation, sensitive-data scan, and an uncommitted approval-gated accounting proposal. No payroll, tax filing, bank transfer, or QuickBooks write is performed by the artifact journey.

## Acceptance commands

These extend existing acceptance families; they are not stack launchers:

```text
npm run prod:boundary:hermes-filesystem
npm run prod:boundary:capabilities
npm run acceptance:golden:website
npm run acceptance:golden:contractor
npm run acceptance:golden:bookkeeping
```

The capability and golden scripts write exact-SHA JSON evidence under `AMTECH_PROOF_DIR`. The golden journeys require a live current assignment, employee MCP credential, owner session, and Manager internal credential. A source or unit-test pass is not a substitute for those target-host proofs.

## Release gate

Launch clearance requires all of the following against the same deployed SHA and pinned Hermes digest:

- exact-image filesystem proof passes;
- effective capability report contains no capability advertised as effective without a passing live probe;
- real Gmail consent starts, completes, binds to the initiating employee, and returns to the initiating work path;
- Website A passes manually before its automated journey is accepted;
- automated Website A, Contractor B, and Bookkeeping C journeys pass with revision, validation, approval snapshot, effect receipt, publication reference, verification receipt, and idempotent replay evidence;
- viewer principals retain read-only surface grants and cannot connect, revise, validate, approve, or publish.
