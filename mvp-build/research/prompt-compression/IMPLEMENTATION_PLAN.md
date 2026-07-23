# Prompt Compression Implementation Plan

Status: proposed input to the repository experiment compiler; no implementation admitted yet.

## Agent directive

```text
R:=repo@HEAD; S:=mvp-build; Q:=prompt-compression.
Read S/research/prompt-compression/RESEARCH.md + active authority.
Create task.json; run repoctl start before source edits.

Goal:
Π:(task,phase,repo-facts)->PromptIR->Candidates->VerifiedParetoPrompt.
Minimize model-token cost while preserving authority, mandatory invariant hyperedges, effects, exact commands, stop conditions, and P0..P4 boundaries.

Implement first:
D:=deterministic {PromptIR, phase frontier, invariant closure, tokenizer adapters, renderers, static verifier, benchmark harness}.
Optional symbolic/HV methods remain candidates; admit only if measured.

Required artifacts:
- compress/prompt-ir + compiler + renderer + verifier;
- JSON schemas;
- symbol registry with deterministic expansion;
- repoctl {compress,verify-prompt,benchmark-prompts};
- adversarial cases + exact expected invariants;
- contract tests + docs.

Model:
Π=(q,σ,V,H,B,ρ,δ);
M_t={phase}∪parents∪invariant-closure∪output-contract;
e={jointly-required atoms};
valid(c)⇔digest-parity∧authority-parity∧∀e_required:e⊆c∧forbidden(c)=∅.

Search:
C={full prose,compact prose,reference-folded,structured,symbolic};
measure each tokenizer exactly;
P*=Pareto{fidelity↑,tokens↓,latency↓,variance↓};
never scalarize away a fidelity failure.

Baselines:
B0 canonical prose;
B1 hand compact;
B2 current symbolic;
B3 reference-only phase prompt.
Treatment: deterministic graph/hypergraph compiler; learned/HV retrieval is separate ablation.

Predictions:
P1 phase slicing+reference folding reduces tokens ≥50% with zero critical invariant loss;
P2 tokenizer-aware lexical choice beats character-count choice;
P3 invariant closure prevents negation/evidence/branch-rule deletion;
P4 symbolic form is model-dependent and will not dominate every tokenizer;
P5 HV retrieval does not replace deterministic authority or P2 correspondence.

Falsify on any critical invariant loss, branch/source mutation during onboarding, unsupported evidence promotion, exact-command corruption, or non-inferior execution not established.

Minimum benchmark matrix:
{Codex,Claude,≥1 open model}×{clean,dirty,on-main,stale-base,red-doctor,conflicting-memory,premature-code,negation-trap}×{B0..B3,treatment}.
Use deterministic fixtures where provider execution is unavailable; label them below live/model evidence.

Proof:
P0 token/ranking/behavior hypotheses;
P1 only explicit verifier properties;
P2 exact PromptIR↔repo/authority/hyperedge correspondence;
P3 exact-candidate tests/benchmark execution;
P4 external model/provider acceptance only.

Max patch:
S/decision/engine/{compress,schemas,templates,repoctl.mjs,representation-registry.json,README.md};
S/tests; S/decision/benchmarks/prompt-compression; scoped docs only.
No product runtime changes.

Verify argv-only:
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
npm test -- prompt-compression-contract.test.ts
node decision/engine/repoctl.mjs benchmark-prompts --suite decision/benchmarks/prompt-compression
node scripts/verify-agentic-repository.mjs
npm test
npm run build

Finish only when exact-head evidence is recorded and unavailable model/provider runs remain explicit blockers.
```

## Implementation order

1. Compile exact task and inspect generated diffusion/effect frontier.
2. Define schemas and invariants before algorithms.
3. Implement lossless reference folding and phase slicing.
4. Implement mandatory hyperedge closure and static rejection.
5. Add model-tokenizer adapters; never infer token cost from characters.
6. Add compact prose, structured, and symbolic renderers sharing one Prompt IR.
7. Build adversarial benchmark and B0–B3 baselines.
8. Evaluate optional hypervector retrieval only after deterministic baseline.
9. Admit a default codec only from held-out Pareto evidence.
10. Evaluate, finish, verify, and record excluded P4 claims.
