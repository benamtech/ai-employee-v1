# Forced Dreaming and Latent-Space Exploration

Status: executable P0 exploration protocol; not authority, proof, or implementation selection.

## Purpose

`forced dreaming` means deliberately widening the candidate-mechanism space before ranking. It does **not** mean asking for verbose imagination, exposing private chain-of-thought, or treating latent similarity as repository truth.

The protocol separates:

\[
\text{diverge}\rightarrow\text{verify diversity}\rightarrow\text{converge}\rightarrow\text{prove}
\]

Immediate convergence is prohibited because repeated samples and densely coupled agents often collapse into the same semantic region. Independent generation, mechanism-family constraints, and delayed selection preserve disagreement. Recent work on divergent interactive agents, multi-agent diversity collapse, structured grammar search, quality-diversity software exploration, and context-space intention optimization motivates these testable operators; transfer to this repository remains P0 until benchmarked.

## Representation

For task \(q\), define a lens basis

\[
B=\{bug,feature,user,operator,architecture,protocol,market,weird,constraint,test,failure,recovery\}.
\]

Candidate \(c_i\) receives a sparse lens vector \(z_i\in[-1,1]^{12}\). The vector is a generation control, not an embedding claim. A batch is admissible only when it covers enough mechanism families and avoids trivial duplicates:

\[
|C|\ge k,\quad |families(C)|\ge m,\quad \max_{i\ne j}\cos(z_i,z_j)\le\tau.
\]

Each forced output must contain:

```text
mechanism
repository evidence
invariants
first–fourth-order effects
prediction
falsifier
maximum patch
argv verification
counterfactual
novelty claim
unknowns
```

Surface-level rewording does not satisfy diversity. Two candidates are distinct only when at least one of these changes materially:

- causal mechanism;
- architecture or state transition;
- invariant strategy;
- effect frontier;
- patch boundary;
- verification strategy;
- user/operator capability unlocked.

## Execution

Create a compact task file:

```json
{"id":"TASK-ID","goal":"...","phase":"design","source_sha":"..."}
```

Compile an eight-slot exploration envelope:

```bash
node research/prompt-compression/compile-forced-dreaming.mjs \
  --task task.json \
  --out forced-dreaming.json \
  --count 8
```

Run each slot independently. Later explorers must not see earlier candidate text. They may share only the exact task capsule, repository facts, authority, invariant closure, and their assigned lens vector.

After all slots are complete:

1. reject incomplete or unsupported candidates;
2. reject semantic duplicates;
3. verify mandatory hyperedge closure;
4. calculate mechanism-family and effect-frontier coverage;
5. retain a fidelity-first Pareto set;
6. use a high-budget integrator only after the above gates;
7. admit one implementation plan through `repoctl admit-plan`.

## Multi-agent topology

Use independent explorers and one late integrator:

\[
q\rightarrow\{E_1,\ldots,E_k\}\rightarrow V_{diversity}\rightarrow V_{repo}\rightarrow I.
\]

Do not allow dense peer-to-peer discussion during divergence. Structural coupling can contract diversity. Explorers submit typed artifacts to an append-only candidate set; they do not negotiate a shared answer.

## Quality-diversity archive

For larger searches, map candidates into behavioral cells:

\[
cell(c)=\big(mechanism,blast\ radius,verification\ type,user\ capability,risk\ class\big).
\]

Keep the strongest repository-grounded candidate per cell rather than only the globally highest provisional score. This preserves rare but useful mechanisms for later integration and adversarial testing.

## Evidence boundary

- lens vectors, similarity, novelty, diversity, and latent/context-space steering: P0;
- a verifier proving schema, separation, and archive rules: P1 for those exact formal properties;
- exact candidate-to-repository correspondence: P2;
- executable tests on an exact patch: P3;
- deployment and production outcomes: P4.

Forced dreaming is causal only when it changes candidate coverage, selected mechanism, proof obligations, or tests. If it only produces longer or stranger prose, record it as non-causal and disable it.
