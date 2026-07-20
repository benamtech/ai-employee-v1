# 2026-07-20 — WS-01 Green and WS-02 Provider-Authority Lock

Status: **WS-01 source/CI accepted; WS-02 provider-authority control source/CI accepted; remaining protocol/live gates open**

## Coordinates

- Repository: `benamtech/ai-employee-v1`
- Base: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`
- Branch: `agent/amtech-p0-ws01-ws02-lock`
- PR: `#30`
- Implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`
- Standard: ratified v0.2; unchanged
- Migration head: `0072`; unchanged
- Hermes pin: unchanged

## Purpose and invariant

Close WS-01 without weakening tests, remove redundant CI, and eliminate caller-manufactured model-provider authority.

Invariant: browser, model, runtime, MCP Apps, AG-UI, or other caller input may request work through a stable AMTECH model alias, but only Manager may resolve provider identity, endpoint, upstream model, headers, master credentials, and current credential policy.

## WS-01 diagnosis

The first canonical broad run showed 66 failed files. The apparent scale was misleading but the failure was real:

- 63 files failed at module load because `test:unit` generated Manager source but did not build `@amtech/shared` or `@amtech/db`;
- three reusable assertions referenced superseded names or topology markers.

After fixing workspace build order, the aggregate exposed 28 historical files / 114 tests. Twenty-seven files asserted pre-ratification architectures: account-owned owner sessions, unassigned preview links, direct-provider profile rendering, old wake/turn queues, and obsolete webhook/RPC fakes.

## Test repair and de-bloat

- `test:unit` now builds shared and database workspaces before Vitest.
- Main Integration has one independent required `broad-unit` job with retained diagnostics.
- The Standard workflow no longer duplicates broad unit/build or historical branch triggers.
- Twenty-seven obsolete suites were deleted atomically, not skipped or excluded.
- Current replacement contracts remain in assignment enforcement, approval authority, artifact workbench, signed links, ambient inbox/event adapters, strict stream, model/profile isolation, provisioner idempotency, production topology, connector-commercial, command/effect, and owner-turn suites.
- Reusable assertions were repaired for the fixed container capability allowlist, full employee network topology, and managed connector setup descriptor.

## WS-02 provider-authority control

Added `apps/manager/src/lib/model-provider-registry.ts` and changed the Model Gateway so:

- runtime requests must use the exact stable AMTECH model alias;
- Manager resolves a registered provider profile;
- the registered provider and configured upstream model must be inside signed allowed policy;
- the provider endpoint must be HTTPS except explicit loopback development;
- the provider master API key remains in the host-private Manager process;
- caller fields for provider, provider profile, upstream model, endpoint/base URL, API key, headers, authorization, token, credential, extra body, or routing are rejected and audited before dispatch;
- caller `model` and `stream` values are removed before Manager inserts the upstream model and non-streaming contract;
- signed claims must match the current durable credential row for alias, providers, models, limits, commercial relationships, version, expiry, and token hash;
- production legacy unbound routes remain absent.

## Exact implementation-head evidence

Implementation head `1460960f415fafc20582313b1dd2117b781a63f7` passed:

- Ratified Standard and Production Plan Integrity — `29725298168`;
- Hermes Upstream Review — `29725298172`;
- Main Integration Gates — `29725298163`:
  - source/governance/type/lint contracts;
  - named onboarding, assignment, release, production-boundary, and UI suites;
  - broad unit: **106 files / 613 tests**;
  - production build;
  - repository archaeology;
  - compiled Chromium adaptive/product-shell fixture matrices;
  - integration summary.

No test exclusion, quarantine, or blind retry was added.

## Failed attempts retained

1. Initial broad run produced 63 module-loader failures because workspace dependencies were not built. The harness was fixed before classifying assertions.
2. A temporary rewrite of `task-capability-catalog.test.ts` used the wrong API. The original task-matching coverage was restored and only the managed connector ontology assertions were updated.
3. One CODEGRAPH update failed with a stale/incorrect blob SHA and was retried with the exact current blob; no content was lost.

## Evidence boundary

Accepted:

- WS-01 repository/test source-and-CI scope;
- broad aggregate execution and canonical merge gating;
- Model Gateway provider-authority manufacture lock for source/CI;
- path-aware Hermes compatibility review with unchanged production pin.

Not accepted:

- remote protected MCP authorization;
- official MCP Apps host conformance;
- complete AG-UI replay/state mapping;
- persisted hash-bound effective-capability truth;
- live connector authorization/health/revocation/failure paths;
- managed database, target host, fixture-free provider/channel, commercial, recovery, accessibility, capacity, deployment, pilot, or production acceptance.

## Remaining dependency order

1. finish remaining WS-02 remote protocol/effective-capability/live connector boundaries without reopening provider authority;
2. WS-03 database authority and managed-platform proof;
3. WS-04 secret/target-host/runtime custody;
4. WS-05 fixture-free owner/channels;
5. WS-06 golden governed work;
6. WS-07 budgets/shared rates/provider ambiguity/commercial reconciliation;
7. WS-08 recovery/rollback/signed release;
8. WS-09 human surfaces/capacity/pilot preparation.

## Final-head rule

This handoff and authority synchronization create a later documentation head. They do not inherit implementation-head workflow evidence. Final PR-head workflows must pass after branch movement stops, and exact final run IDs belong in PR `#30` rather than another metadata-only commit.
