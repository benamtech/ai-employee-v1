# 2026-07-20 — WS-04 destructive Host failure verification

Status: source-wired; focused local harness proven; exact-head repository CI pending  
Branch: `agent/ws04-target-host-lifecycle`  
PR: `#33`  
Task: `AMTECH-P0-WS04-003`

## Purpose and invariant

Destructive Host Provisioner lifecycle operations must not return `status: "ok"` when Docker or the Host boundary fails, times out, returns malformed confirmation output, terminates without a determinate exit, or leaves a partial-effect state. Failed and ambiguous evidence must remain durable, and Manager must prevent a healthy WS-05 lifecycle projection.

## Decision trace

`mvp-build/decision/trace003/` was created before production edits. The dependency-free computation builds the 19-vertex higher-order hypergraph, incidence matrices, normalized hypergraph Laplacian, trajectory feature vectors, RBF kernel, utilities, DPP-style selected design, and an explicitly checkpointed ridge Koopman proxy.

Computed values:

- hyperedges: 6 pair, 6 triple, 4 quadruple, 2 quintuple
- spectral gap proxy: `0.30311562`
- `VNE_p`: `1.10651271`
- Koopman residual: `0.05222413`
- selected `D*`: destructive executor, Host evidence, Manager projection guard, focused tests
- rejected: full WS-04 acceptance, DNS/TLS, real secret store, registry release work, DB-P0-02..07, broad WS-05

## Before

`provisioner-host.ts` converted destructive Docker exceptions into `failed:*` strings through `bestEffortCommand()`. `removeRuntime()` and `suspend_runtime` still returned `status: "ok"`; replace/restore discarded the removal result before ensuring a replacement. Manager trusted the false success and could leave an employee projected healthy.

## After

- `destructive-docker.ts` executes Docker without a shell, enforces a bounded timeout, records exit/signal/stdout/stderr evidence, and classifies outcomes as `accepted`, `failed`, or `ambiguous`.
- Non-zero exit and spawn failure are `failed`; timeout, signal termination, missing exit status, absent confirmation, and malformed confirmation are `ambiguous`.
- Remove, suspend, restart, and the destructive phase of replace/restore throw on every non-accepted step.
- A later failure after an accepted destructive step is promoted to `docker_destructive_partial_failure` with all accepted and failed steps preserved.
- Restart requires post-destructive runtime inspection. Replace/restore preserve successful removal evidence and become ambiguous when recreation fails.
- Host responses and the append-only Host audit include structured outcome, failure state, and evidence.
- Manager rejects destructive `ok` responses lacking `outcome: "accepted"`, synthesizes ambiguous evidence for transport timeout/unavailability and malformed JSON/results, and embeds the structured summary into the existing durable provisioning job/command failure path.
- Before throwing, Manager updates the employee to `status: "failed"` with `needs_reprovision: true`, preventing a healthy lifecycle projection while failure or ambiguity is unresolved.

## Verification

Executed outside the repository dependency graph because the connected environment has no network checkout:

- `python3 mvp-build/decision/trace003/trajectory_scores.py` equivalent local artifact: passed; deterministic selected design and metrics reproduced.
- JSON parse validation for all three generated JSON outputs: passed.
- strict TypeScript `tsc --noEmit` harness with Node types and dependency stubs for the exact changed Host executor/Host boundary/Manager boundary source: passed with no diagnostics.
- executable classifier harness: 7 assertions passed for accepted output, non-zero failure, timeout ambiguity, signal ambiguity, unknown exit ambiguity, malformed confirmation ambiguity, and explicitly allowed empty output.
- exact-head GitHub workflow/status query at the implementation head returned no workflow runs or commit statuses. Repository Vitest/build/regression suites are therefore not claimed green.

## Posterior update

Source-level posterior after the focused harness:

- `theta_1` Docker failure can appear successful: `0.92 -> 0.08`
- `theta_2` Manager/Provisioner path fail-closes destructive failure: `0.58 -> 0.93`
- `theta_3` tests check routing but not destructive semantics: `0.91 -> 0.06`
- `theta_4` WS-05 can project partial lifecycle state healthy: `0.72 -> 0.12`

These are source/harness beliefs, not live-host acceptance probabilities.

## Unresolved

- exact-head repository CI and broad regressions
- production Docker daemon timeout/signal/partial-effect proof
- target-host mutation and neighbor-safety proof
- full WS-04 acceptance
- DNS/TLS, managed secret store, immutable registry release evidence
- DB-P0-02..07
- broad WS-05 owner/channel acceptance

No migration, DNS/TLS, secret-store backend, registry pipeline, broad WS-05 surface, or DB-P0-02..07 work was changed.
