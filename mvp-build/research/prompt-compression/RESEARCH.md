# Repository-Native Prompt Compression via Dynamic Manifold Scheduling

Status: research hypothesis; implementation not yet admitted  
Branch: `agent/prompt-compression-research-v3`  
Primary stimulus: Chun, Polo, Chung, *Emergent Manifold Separability during Reasoning in Large Language Models*, arXiv:2602.20338v2 (2026)

## 0. Claim boundary

This document does **not** claim that mathematical glyphs directly control hidden-state manifolds, that prompt compression preserves behavior across models, or that the repository already implements a compressor. The paper measures latent geometry in controlled reasoning traces; it does not evaluate repository-agent prompts or symbolic metalanguages. We use its findings to derive testable engineering hypotheses, not to promote them beyond P0.

## 1. Problem

Current coding-agent onboarding and task prompts repeat authority, workflow, evidence rules, and future-phase instructions in natural language. This creates four costs:

1. token cost and latency;
2. interference from concepts irrelevant to the current phase;
3. authority drift when copied prose diverges from repository files;
4. weak computability because instructions remain untyped and unaddressed.

The target is not minimum characters. It is minimum model-token cost subject to invariant-preserving execution:

\[
\min_{p'}\;T_m(p')+\lambda_r R(p')+\lambda_c C(p')
\]

subject to

\[
\Pr_m[\mathcal I(p')=\mathcal I(p)]\ge 1-\epsilon,
\quad A(p')=A(p),
\quad E(p')\subseteq E_{allowed}.
\]

- \(T_m\): tokens under tokenizer/model \(m\);
- \(R\): behavioral failure risk;
- \(C\): decompression/retrieval overhead;
- \(\mathcal I\): required invariant outcomes;
- \(A\): authority resolution;
- \(E\): enabled effects.

A visually dense string can have high \(T_m\), high ambiguity, or both. Unicode and LaTeX are candidates only after tokenizer measurement and behavioral evaluation.

## 2. Research synthesis

### 2.1 Dynamic Manifold Management

Chun et al. report a transient capacity pulse: a concept manifold becomes linearly separable immediately before computation, compresses afterward, and partially re-separates when recalled by a parent. Probe decodability persists longer than manifold capacity, distinguishing *retrievable* information from information *prepared for processing*. Only the current node and immediate dependencies remain strongly separable, while estimated intrinsic/global dimensionality stays near ten in their studied traces.

Engineering hypothesis:

\[
\text{retain globally} \ne \text{activate globally}.
\]

A session prompt should activate only the current computation frontier; repository artifacts retain everything else. The prompt becomes a capacity scheduler rather than a miniature repository manual.

### 2.2 Question-conditioned compression

LLMLingua formulates compression as output-distance plus token-budget minimization. LongLLMLingua improves this with question-aware coarse selection, contrastive token importance, dynamic budgets, position-aware reordering, and subsequence recovery. Its relevant abstraction is:

\[
\min_{\tilde x}D_\phi(y,\tilde y)+\lambda\|\tilde x\|_0.
\]

For repository work, “question” becomes the exact task capsule; “documents” become authority/source/test/evidence nodes; relevance must be constrained by repository correspondence rather than inferred only from perplexity.

### 2.3 Hypergraph correspondence

The existing engine already constructs:

\[
F\to A\oplus G\oplus H\to C_{P2}\to D_q\to \Phi_{\le4}\to X.
\]

- \(F\): content-addressed repository facts;
- \(A\): authority DAG;
- \(G\): dependency graph;
- \(H\): invariant hypergraph;
- \(C_{P2}\): source/model correspondence;
- \(D_q\): task-local diffusion;
- \(\Phi_{\le4}\): bounded effect frontier;
- \(X\): experiment contract.

This is a stronger substrate than free-form prompt compression because required invariants can be represented as hyperedges whose members cannot be independently deleted.

## 3. Proposed representation

Define a prompt transaction:

\[
\Pi=(q,\sigma,V,H,B,\rho,\delta).
\]

- \(q\): task/phase query;
- \(\sigma\): exact repository coordinate and artifact digests;
- \(V\): atomic instruction nodes;
- \(H=(V,E,w)\): constraint hypergraph;
- \(B\): model/tokenizer-specific budget;
- \(\rho\): retrieval schedule;
- \(\delta\): decoder/renderer contract.

Each node \(v_i\) contains:

```json
{
  "id": "branch.non-main",
  "kind": "invariant",
  "payload_ref": "mvp-build/decision/SESSION_ONBOARDING.md#branch",
  "phase": "onboard",
  "must_preserve": true,
  "token_cost": {"model": 0},
  "ambiguity_risk": 0,
  "provenance": {"sha": "...", "path": "..."}
}
```

Each hyperedge \(e_j\) encodes joint semantics, for example:

\[
e_{branch}=\{origin/main,\ new\ branch,\ \Delta main=0,\ preserve\ worktree\}.
\]

Deleting one member without a registered rewrite invalidates the candidate.

## 4. Phase-local activation

Let the transaction DAG be \(G_T=(N,D)\), with phase \(z_t\in N\). The active prompt frontier is:

\[
M_t=\{z_t\}\cup pa(z_t)\cup I(z_t)\cup O(z_t),
\]

where \(I\) is the invariant closure and \(O\) the required output contract. Everything else remains retrievable by digest.

For onboarding:

\[
M_0=\{root,branch,bootstrap,doctor,selftest,stop\}.
\]

Task compilation, candidate search, implementation, evaluation, and P4 gates are inactive until their transition fires.

This is not a claim about manipulating neural geometry. It is a prompt-architecture analogue whose causal value must be measured.

## 5. Compression operators

Operators are typed rewrites, not arbitrary deletion:

1. **Reference folding**: replace stable prose with `(path,digest,section)`.
2. **Phase slicing**: retain only \(M_t\).
3. **Invariant closure**: include all members of touched mandatory hyperedges.
4. **Alias substitution**: use registry aliases only when a decoder is already in authority.
5. **Structural packing**: encode repeated fields as deterministic JSON/CBOR-like tuples.
6. **Query retrieval**: replace context dumps with exact `repoctl query` calls.
7. **Position scheduling**: place current objective and stop contract at high-salience boundaries.
8. **Lossless canonicalization**: normalize paths, commands, evidence classes, and branch rules.
9. **Model-aware lexical compression**: choose shorter equivalent strings by measured tokenizer cost.
10. **Optional learned pruning**: admissible only after deterministic closure and held-out evaluation.

Forbidden rewrites include removing negation, weakening evidence classes, replacing exact paths with ambiguous names, eliding branch ancestry, shell-stringifying argv commands, or inventing symbol semantics inline.

## 6. Symbol policy

Symbols are useful when they are:

- conventional (`¬`, `∧`, `→`, `Δ`, `:=`);
- tokenizer-measured;
- defined once in a stable codec;
- structurally decisive;
- accompanied by a deterministic expansion.

Symbols are harmful when they are visually exotic, model-specific, undefined, or require a glossary larger than the prose they replace.

Define utility:

\[
U(s)=\frac{I_{preserved}(s)}{T_m(s)+\lambda A(s)+\mu D(s)},
\]

where \(A\) is ambiguity and \(D\) decoder burden. A symbol is admitted only when \(U(s)>U(phrase)\) on held-out tasks.

## 7. Hypervector role

Hypervectors should represent retrieval and similarity hypotheses, not authority. Let atomic nodes map to high-dimensional vectors \(h_i\in\{-1,+1\}^d\). Use binding \(\otimes\), bundling \(\oplus\), and permutation \(\pi\):

\[
h_{task}=\bigoplus_i w_i(h_{role_i}\otimes h_{entity_i}\otimes \pi^{k_i}h_{phase_i}).
\]

Potential uses:

- approximate retrieval of related prompt atoms;
- duplicate/near-duplicate rule detection;
- task-to-historical-transaction similarity;
- candidate diversity and cross-lens resonance.

Non-uses:

- deciding current authority;
- proving source correspondence;
- promoting P0 similarity into P2/P3 evidence.

The existing registry’s `embedding.code-change.v1` remains future/P0; a prompt analogue should inherit the same held-out evaluation constraint.

## 8. Compressor architecture

```text
exact task + phase
  -> repo facts / authority / dependency / invariant hypergraph
  -> mandatory closure
  -> candidate retrieval (deterministic first; hypervector optional)
  -> model-tokenizer cost table
  -> constrained rewrite search
  -> render candidates: prose | compact text | symbolic | structured
  -> static verifier
  -> behavioral harness across agents/models
  -> Pareto selector
  -> content-addressed prompt artifact + expansion map
```

Optimization is multi-objective:

\[
\max_c\;(F_c,\ -T_c,\ -L_c,\ -V_c)
\]

where \(F\) is behavioral fidelity, \(T\) tokens, \(L\) latency/cost, and \(V\) variance. No scalar score should hide a fidelity regression.

## 9. Evaluation design

### Baselines

- B0: canonical full prose;
- B1: hand-compressed prose;
- B2: current symbolic prompt;
- B3: reference-only phase prompt;
- B4: deterministic graph/hypergraph compressor;
- B5: B4 + model-aware lexical selection;
- B6: B5 + optional learned/hypervector retrieval.

### Task corpus

Use completed repository transactions and synthetic adversarial variants:

- clean versus dirty worktree;
- agent starts on `main`;
- stale base versus current `origin/main`;
- missing dependencies;
- conflicting historical memory;
- red `doctor` or `self-test`;
- task requests premature implementation;
- exact versus ambiguous path names;
- negation and evidence-boundary traps.

### Metrics

\[
CR=T(B0)/T(c)
\]

\[
IF=\frac{\sum_j w_j\mathbf1[e_j\ preserved]}{\sum_j w_j}
\]

\[
ER=\Pr[required\ actions\ correct\land forbidden\ actions\ absent]
\]

Also record latency, input cost, output-token cost, retries, tool calls, branch violations, authority violations, unsupported claims, and model variance.

### Admission threshold

A compressed codec is not default unless:

- zero critical invariant loss on adversarial tests;
- non-inferior execution rate with confidence interval bounded by a declared margin;
- meaningful token/cost reduction on at least two target tokenizers;
- deterministic expansion and digest verification pass;
- improvement survives held-out repository tasks.

## 10. Exact repo integration

Proposed additive paths:

```text
mvp-build/decision/engine/compress/
  compile-prompt.mjs
  render-prompt.mjs
  verify-prompt.mjs
  tokenizer-adapters.mjs
  symbol-registry.json
mvp-build/decision/engine/schemas/
  prompt-ir.schema.json
  prompt-candidate.schema.json
  prompt-evaluation.schema.json
mvp-build/decision/engine/templates/
  prompt-codec.json
mvp-build/tests/
  prompt-compression-contract.test.ts
mvp-build/decision/benchmarks/prompt-compression/
  cases/*.json
  expected/*.json
```

Extend `repoctl` with:

```bash
repoctl compress --transaction <path> --phase <phase> --model <tokenizer> --out <dir>
repoctl verify-prompt --candidate <file>
repoctl benchmark-prompts --suite <dir> --models <matrix>
```

Do not replace `task-capsule.json` or canonical authority. The compressed prompt is a derived, content-addressed projection.

## 11. Key falsifiers

Reject or narrow the approach if:

1. reference-only prompts cause agents not to read/execute referenced files;
2. symbolic variants tokenize worse than compact prose;
3. behavior varies strongly across Codex/Claude/open models;
4. compression removes low-frequency but safety-critical constraints;
5. hypervector retrieval fails to beat deterministic task diffusion;
6. position scheduling has no repeatable effect;
7. decompression/tool overhead exceeds saved inference cost;
8. the mathematical layer does not change selection or verification.

## 12. Research references

- Chun, Polo, Chung. *Emergent Manifold Separability during Reasoning in Large Language Models*. arXiv:2602.20338v2, 2026.
- Jiang et al. *LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models*. arXiv:2310.05736, 2023.
- Jiang et al. *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression*. arXiv:2310.06839, 2023.
- Chung et al. *Classification and Geometry of General Perceptual Manifolds*. Physical Review X 8, 031003, 2018.

## 13. Decision

Admit a deterministic, repository-grounded **Prompt IR + phase-local renderer + invariant verifier + benchmark harness** as the first implementation candidate. Treat symbolic and hypervector layers as measured optional dialects. Do not begin with a bespoke esoteric language or learned compressor.