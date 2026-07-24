# Repository-Native Prompt Compression via Dynamic Manifold Scheduling

Status: research hypothesis; implementation not yet admitted  
Branch: `agent/prompt-compression-research-v3`

## 0. Claim boundary

This program does not claim that mathematical glyphs directly control hidden-state manifolds, that compression preserves behavior across models, or that the repository already implements a compressor. Dynamic Manifold Management and LongLLMLingua supply engineering hypotheses and methods; every transferred mechanism remains P0 until isolated by repository-specific ablation.

## 1. Objective

Current coding-agent prompts repeat authority, workflow, evidence rules, and future phases. The target is not minimum characters but minimum model-token and execution cost under invariant-preserving behavior:

\[
\min_{\tilde p,\pi,B}\;T_m(\tilde p)+\lambda_lL(\tilde p)+\lambda_vVar(\tilde p)+\lambda_rRisk(\tilde p)
\]

subject to

\[
A(\tilde p)=A(p),\quad H_{required}\subseteq\tilde p,\quad E(\tilde p)\subseteq E_{allowed},\quad
Pr[\mathcal I(\tilde p)=\mathcal I(p)]\ge1-\epsilon.
\]

A visually dense symbolic prompt may tokenize badly or increase ambiguity. Tokenizer measurement and behavior dominate character count.

## 2. Combined research synthesis

### 2.1 Dynamic Manifold Management

The manifold paper reports transient separability: a concept becomes prepared immediately before computation, compresses afterward, and reactivates when recalled. Decodability can persist without computation-readiness. Engineering analogue:

\[
retain\ globally\ne activate\ globally.
\]

A session prompt should activate only the current phase frontier; content-addressed repository artifacts retain everything else.

### 2.2 LongLLMLingua

LongLLMLingua contributes a concrete coarse-to-fine pipeline:

1. rank contexts by how well each context predicts the question, not vice versa;
2. reorder retained contexts to reduce middle-position loss;
3. assign nonuniform budgets from coarse relevance;
4. use question-conditioned contrastive importance for fine pruning;
5. recover exact subsequences/entities after compressed execution;
6. evaluate every component by ablation.

The full repository adaptation is normative research input in `LONGLMLINGUA_INTEGRATION.md`.

### 2.3 Repository-native trust boundary

The existing compiler already constructs:

\[
F\to A\oplus G\oplus H\to C_{P2}\to D_q\to\Phi_{\le4}\to X.
\]

- `F`: content-addressed repository facts;
- `A`: authority DAG;
- `G`: dependency graph;
- `H`: invariant hypergraph;
- `C_P2`: verified source/model correspondence;
- `D_q`: task diffusion;
- `Φ`: bounded effect frontier;
- `X`: experiment contract.

Learned relevance, perplexity, embeddings, and hypervectors operate only after mandatory closure and cannot override this chain.

## 3. Revised Prompt IR

Define:

\[
\Pi=(q,\sigma,V,H,B,\rho,\delta,\chi),
\]

where `q` is task+phase query, `σ` exact repository coordinates/digests, `V` typed atoms, `H` constraint hypergraph, `B` tokenizer-specific budget ledger, `ρ` retrieval/position schedule, `δ` renderer/decoder, and `χ` expansion/recovery map.

Each atom includes identity, kind, canonical reference, mandatory/protected classes, coarse and fine scores, budget floor/allocation, position band, provenance, and proof ceiling.

Mandatory closure:

\[
V_{must}=cl_H(q)\cup authority(q)\cup output(q).
\]

For every candidate `c`:

\[
valid(c)\iff digest\ parity\land authority\ parity\land V_{must}\subseteq c\land forbidden(c)=\varnothing.
\]

## 4. Phase-local activation

For transaction DAG phase `z_t`:

\[
M_t=\{z_t\}\cup pa(z_t)\cup cl_H(z_t)\cup O(z_t).
\]

Onboarding activates only:

\[
M_0=\{root,branch,bootstrap,doctor,selftest,stop\}.
\]

Task compilation, candidate search, implementation, evaluation, and external gates remain retrievable but inactive until their transition fires.

## 5. Query-conditioned coarse-to-fine compiler

\[
(q,F,A,G,H)\xrightarrow{closure}D_{must}\xrightarrow{C_0}D'\xrightarrow{\pi_r}D''\xrightarrow{B_r}B_{1:K'}\xrightarrow{C_1}\tilde p\xrightarrow{V}\tilde p^*\xrightarrow{\chi}y_{rec}.
\]

### 5.1 Coarse selection

LongLLMLingua ranks a document using negative average log probability of the question plus restrictive suffix conditioned on that document:

\[
r_k=-\frac1{N_c}\sum_i\log p(q_i^{restrict}\mid d_k).
\]

Repository composite:

\[
r_k^{repo}=\alpha r_k^{struct}+\beta r_k^{conditional}+\gamma r_k^{risk},
\]

with mandatory closure always retained. Compare structural diffusion, lexical/BM25, embeddings, conditional ranker, reversed conditional control, and no-restrict control using gold-node Recall@k.

### 5.2 Fine importance

Ordinary perplexity rewards surprise, not task relevance. Contrastive importance measures distribution shift from conditioning on the task:

\[
s(a_i)=\ell(a_i\mid h_i)-\ell(a_i\mid q,h_i).
\]

Apply initially to typed atoms/recoverable spans, not arbitrary subwords. Negation, branch rules, argv commands, paths, SHAs, evidence classes, and stop conditions are protected regardless of score.

### 5.3 Position scheduler

Explicitly optimize placement under a measured position prior:

\[
\pi^*=\arg\max_\pi\sum_i r_i u(\pi(i),n)-\lambda_dViol_{dep}(\pi)-\lambda_gFrag(\pi).
\]

Default: mode/goal/prohibition at head; task-local context in dependency-preserving groups; verification/output/stop contract at tail. Position benefit is accepted only if head-to-tail sweep shows reduced variance.

### 5.4 Dynamic budgets

Use relevance-ranked allocation rather than uniform compression:

\[
\tau_k=clip\left(\tau_0+\delta_\tau\left(1-\frac{2I(r_k)}{K'}\right),\tau_{min},\tau_{max}\right),
\]

then enforce repository floors:

\[
\tau_k^{repo}=\max(\tau_k,\tau_{risk}(k),\tau_{closure}(k)).
\]

The budget ledger records score, rank, original/retained tokens, floor, reason, tokenizer, and rejected alternatives.

### 5.5 Expansion and recovery

Maintain a digest-bound bidirectional map from compact aliases/symbols/references to canonical atoms. Expand before execution or tool invocation when required. Post-generation repair is allowed only for exact provenance-bound commands, identifiers, paths, SHAs, and aliases; ambiguous mappings fail closed.

## 6. Compression operators

Admissible typed rewrites:

1. reference folding `(path,digest,section)`;
2. phase slicing to `M_t`;
3. mandatory hyperedge closure;
4. deterministic alias substitution;
5. structural tuple packing;
6. exact query retrieval instead of context dumps;
7. task-conditioned coarse selection;
8. position scheduling;
9. dynamic relevance/risk budgets;
10. atom/span contrastive pruning;
11. tokenizer-aware lexical choice;
12. deterministic expansion/recovery;
13. optional learned/HV retrieval after deterministic baselines.

Forbidden rewrites include dropping negation, weakening evidence classes, corrupting argv, replacing exact paths with ambiguity, eliding ancestry, or inventing symbol semantics inline.

## 7. Symbols and hypervectors

Symbol utility:

\[
U(s)=\frac{I_{preserved}(s)}{T_m(s)+\lambda A(s)+\mu D(s)}.
\]

Admit only conventional, tokenizer-measured, registry-defined symbols with deterministic expansion and held-out benefit.

Hypervectors may support P0 retrieval, duplicate detection, historical-task similarity, and candidate diversity:

\[
h_q=\bigoplus_iw_i(h_{role_i}\otimes h_{entity_i}\otimes\pi^{k_i}h_{phase_i}).
\]

They cannot decide authority, prove correspondence, or promote evidence.

## 8. Architecture

```text
exact task+phase
 -> repository facts/authority/dependency/invariant hypergraph
 -> mandatory closure
 -> coarse rankers and Recall@k ledger
 -> position scheduler
 -> dynamic budget allocator
 -> deterministic atom/span compressor
 -> optional contrastive scorer
 -> renderers + exact tokenizer counts
 -> static verifier
 -> execution harness
 -> deterministic expansion/recovery
 -> factorial ablations
 -> fidelity-first Pareto selector
 -> content-addressed prompt artifact
```

Optimize the vector

\[
\max_c(F_c,-T_c,-L_c,-Var_c),
\]

without scalarizing away any fidelity failure.

## 9. Evaluation

### Baselines

- B0 canonical prose;
- B1 hand compact;
- B2 symbolic;
- B3 reference-only phase;
- B4 deterministic structural/hypergraph;
- B5 B4 + position + dynamic budgets;
- B6 B5 + conditional coarse ranker;
- B7 B6 + contrastive atom scorer;
- B8 B7 + recovery;
- B9 optional hypervector retrieval.

### Required ablations

- no question-aware coarse selector;
- reversed conditional direction;
- no restrictive suffix;
- no contrastive fine scoring;
- uniform budgets;
- no reordering;
- no recovery;
- alternate/smaller rankers;
- deterministic-only versus learned hybrid.

### Corpus

Use completed repository transactions and adversarial variants: dirty worktree, direct-main start, stale base, red doctor/self-test, conflicting historical memory, premature coding, negation/evidence traps, ambiguous paths, and corrupted commands. Sweep the decisive atom across head, early-middle, center, late-middle, and tail.

### Metrics

Coarse: gold-node Recall@k, authority recall, mandatory-edge recall, noise density.  
Fine: protected-token recall, exact command/path/SHA retention, atom-kind compression.  
End-to-end: required action success, forbidden action absence, token/cost/latency including compressor overhead, retries, tool calls, recovery accuracy, and model/position/seed variance.

A codec is not default unless critical invariant loss is zero, execution is non-inferior within a predeclared margin, token reduction is meaningful on at least two target tokenizers, expansion/digest verification passes, and benefit survives held-out tasks.

## 10. Exact repo integration

Additive targets:

```text
mvp-build/decision/engine/compress/
  prompt-ir.mjs
  extract-atoms.mjs
  coarse-select.mjs
  position-schedule.mjs
  allocate-budget.mjs
  fine-compress.mjs
  render-prompt.mjs
  tokenizer-adapters.mjs
  recover-prompt.mjs
  verify-prompt.mjs
  symbol-registry.json
mvp-build/decision/engine/schemas/
  prompt-ir.schema.json
  prompt-candidate.schema.json
  prompt-budget-ledger.schema.json
  prompt-expansion-map.schema.json
  prompt-evaluation.schema.json
mvp-build/decision/benchmarks/prompt-compression/
  cases/ expected/ ablations/
mvp-build/tests/prompt-compression-contract.test.ts
```

CLI:

```bash
repoctl compress --transaction <path> --phase <phase> --tokenizer <model> --ranker <ranker> --budget <n> --out <dir>
repoctl verify-prompt --candidate <file>
repoctl benchmark-prompts --suite <dir> --models <matrix> --ablations all
```

Do not replace canonical authority or `task-capsule.json`. Every compressed prompt is a derived, content-addressed projection.

## 11. Decision

The first implementation candidate is now:

**query-conditioned coarse-to-fine Prompt IR compiler + mandatory hypergraph closure + position scheduler + dynamic budget ledger + protected atom/span compression + tokenizer-specific renderers + deterministic expansion/recovery + factorial benchmark.**

Learned conditional/contrastive rankers are pluggable P0 treatments behind a deterministic trust boundary. Symbolic and hypervector dialects remain optional measured ablations. Arbitrary subword deletion and bespoke esoteric languages are explicitly deferred.

## 12. References

- Jiang et al. *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression*. ACL 2024, 2024.acl-long.91.
- Chun, Polo, Chung. *Emergent Manifold Separability during Reasoning in Large Language Models*. arXiv:2602.20338v2, 2026.
- Jiang et al. *LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models*. EMNLP 2023.
- Chung et al. *Classification and Geometry of General Perceptual Manifolds*. Physical Review X 8, 031003, 2018.
