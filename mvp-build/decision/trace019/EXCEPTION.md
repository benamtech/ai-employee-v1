# Trace019 Exception

Trace019 intentionally self-hosts with the pre-repair engine pinned at `decision/trace019/.engine-pinned/repoctl.mjs`. The pinned lifecycle ledger proves only that the old lifecycle executed the admitted commands against the Trace019 candidate.

It is not evidence that the new evaluator gates are sound. The new gate evidence is the exact-candidate negative suite: `node --test decision/engine/self-test/negative-cases.mjs`, plus `node decision/engine/repoctl.mjs self-test`, `node decision/engine/repoctl.mjs doctor`, the focused Vitest contract, repository governance, full repository verification, and historical Trace018 verification as retained in `evidence-ledger.json` and `self-check.json`.

Evidence ceiling: P3 local executable evidence. P4 remains blocked by human/external acceptance of the self-modifying compiler repair.
