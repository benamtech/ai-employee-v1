# trace003 — destructive Host Provisioner Docker failure decision trace

Status: computed before production patching  
Branch: `agent/ws04-target-host-lifecycle`  
Task boundary: destructive lifecycle operations must fail closed on Docker/provisioner failure, timeout, malformed output, or ambiguity.

## Inspection finding

The current Host Provisioner uses `bestEffortCommand()` for destructive Docker calls. That helper converts command exceptions into strings prefixed with `failed:`. `removeRuntime()` returns `status: "ok"` without rejecting those strings, `suspend_runtime` does the same, and `replace_runtime` / `restore_runtime` ignore the removal result before ensuring a replacement. The Manager therefore trusts a false `ok`, can complete a teardown or suspension command as succeeded, and can project lifecycle health that was never verified.

## Computed model

- Basis: `B96 = S12 x I8`, with 96 source/invariant coordinates.
- Hypergraph: 19 vertices; 6 pair edges, 6 triple edges, 4 quadruple edges, and 2 quintuple edges.
- Spectral gap proxy: `0.30311562`.
- Kernel spectral entropy `VNE_p`: `1.10651271`.
- Koopman proxy: accepted because `z0..z4` are explicitly defined eight-dimensional checkpoints; ridge `lambda=0.05`; fitted residual `||z4-Kz3||_2 = 0.05222413`.
- Selected `D*`: `T1_destructive_executor`, `T2_host_evidence`, `T3_manager_projection_guard`, `T4_red_and_regression_tests`.
- Selected objective: `13.498753`.

## Selected design

1. Replace best-effort destructive Docker execution with a typed executor that records exit, timeout, output, and verification evidence.
2. Treat timeout, missing exit status, malformed success output, or unverifiable postcondition as `ambiguous`; treat explicit non-zero/spawn failure as `failed`.
3. Throw on every failed or ambiguous destructive step so `remove_runtime`, `suspend_runtime`, and the remove phase of replace/restore cannot return `ok`.
4. Preserve evidence in the Host Provisioner failure response and audit record.
5. Preserve that evidence through `requireHostProvisioner()` into durable Manager job/command failure evidence and mark the employee non-healthy before any WS-05 projection can call the lifecycle healthy.
6. Add executable unit contracts for classifier semantics, destructive step aggregation, Host Provisioner source wiring, Manager durable evidence, and no healthy projection after destructive failure.

## Rejected modes

- Full WS-04 acceptance: broader than this source/CI invariant and still requires target-host proof.
- DNS/TLS: non-adjacent.
- Real secret store: explicitly excluded.
- Registry/digest release evidence: non-adjacent.
- DB-P0-02..07: not a prerequisite for this patch.
- Broad WS-05: only the lifecycle health projection guard is admitted.

## Rollout checkpoints

- `z0`: current projection; false-success leak is present.
- `z1`: inspection; exact leak and Manager propagation path identified.
- `z2`: red test; failure, timeout, malformed output, ambiguity, and false healthy projection are asserted.
- `z3`: patch; destructive executor, evidence propagation, and Manager projection guard implemented.
- `z4`: verification; focused contracts and applicable regressions must pass without broadening acceptance claims.

## Unresolved nodes

Full target-host mutation proof, production Docker daemon/timeout proof, full WS-04 acceptance, DNS/TLS, managed secret store, immutable registry evidence, DB-P0-02..07, and broad WS-05 remain unresolved and are not claimed by this patch.
