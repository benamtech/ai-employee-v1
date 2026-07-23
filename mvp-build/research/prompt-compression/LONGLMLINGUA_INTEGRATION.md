# LongLLMLingua Integration for Repository-Native Prompt Compression

Status: design revision; P0 hypotheses only until benchmarked  
Source: Jiang et al., *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression*, ACL 2024.

## 1. What transfers and what does not

LongLLMLingua optimizes long-context prompts containing an instruction, documents, and a question. Its central objective is

\[
\min_{\tilde x}D_\phi(y,\tilde y)+\lambda\|\tilde x\|_0,
\]

jointly with document permutation. The paper demonstrates that question-aware coarse selection, contrastive token importance, document reordering, dynamic budgets, and subsequence recovery each contribute to downstream quality.

For coding agents, the analogous objects are:

\[
x=(x^{ctl},x^{auth}_{1:K},x^{task},x^{state}),
\]

where `ctl` is the session/control contract, `auth` are repository authority/source/test/evidence artifacts, `task` is the exact user task or task capsule, and `state` is branch/worktree/transaction state.

The transfer is architectural, not literal. We must not use a small LM to override repository authority, delete mandatory hyperedge members, or claim that conditional perplexity proves semantic correctness. Learned scores remain P0 ranking signals inside a deterministic closure and verifier.

## 2. Revised compressor: Query-Conditioned Coarse-to-Fine Prompt Compiler

\[
(q,F,A,G,H)\xrightarrow{C_0}D'\xrightarrow{\pi_r}D''\xrightarrow{B_r}B_{1:K'}\xrightarrow{C_1}\tilde x\xrightarrow{V}\tilde x^*\xrightarrow{R}y_{rec}
\]

- `q`: exact task-phase query;
- `F`: content-addressed facts;
- `A`: authority DAG;
- `G`: dependency graph;
- `H`: invariant hypergraph;
- `C0`: question-aware coarse selector;
- `πr`: position scheduler;
- `Br`: relevance-conditioned budget allocator;
- `C1`: fine-grained compressor;
- `V`: static semantic/invariant verifier;
- `R`: output/reference recovery.

The mandatory closure `cl_H(q)` is computed before any learned or lexical pruning:

\[
D_{must}=cl_H(q)\cup A_q\cup O_q,
\]

where `Aq` is task-local authority and `Oq` is the required output/stop contract. No score may remove `Dmust`.

## 3. Question-aware coarse selection

LongLLMLingua ranks a document by the negative average log probability of the question plus a restrictive statement conditioned on that document:

\[
r_k=-\frac1{N_c}\sum_i\log p(q_i^{restrict}\mid d_k).
\]

The direction matters. Ranking `p(q|d)` asks whether a context predicts the task, while `p(d|q)` is diluted by irrelevant material and document length.

Repository adaptation:

\[
r_k^{repo}=\alpha r_k^{struct}+\beta r_k^{query}+\gamma r_k^{risk},
\]

subject to `Dmust` inclusion.

- `r_struct`: exact authority/dependency/hypergraph reachability;
- `r_query`: optional conditional task-likelihood or contrastive score;
- `r_risk`: safety/evidence/negation rarity prior.

Use a repository-specific restrictive suffix only as a measured ranking regularizer, for example:

`The exact repository evidence required to execute this task is contained in this candidate context.`

Ablate it. Do not assume it helps every model or task.

### Coarse selector baselines

- structural diffusion only;
- BM25/lexical;
- embedding retrieval;
- deterministic hybrid;
- `p(q|d)` small-model ranker;
- reversed `p(d|q)` control;
- `p(q|d)` without restrictive suffix.

Measure Recall@k of exact gold authority/source/test/invariant nodes, not only final task success.

## 4. Contrastive fine-grained importance

Ordinary perplexity retains surprising tokens, not necessarily task-relevant tokens. LongLLMLingua uses the distribution shift induced by the question:

\[
s_i=PPL(x_i\mid x_{<i})-PPL(x_i\mid q,x_{<i}),
\]

which the paper relates to conditional pointwise mutual information.

Repository adaptation should score **instruction atoms or spans**, not blindly delete arbitrary subword tokens:

\[
s(a_i)=\ell(a_i\mid h_i)-\ell(a_i\mid q,h_i),
\]

where `a_i` is a typed Prompt IR atom or recoverable lexical span and `h_i` is local context. High positive shift means the task makes the atom more predictable/relevant.

Guardrails:

1. mandatory atoms are non-prunable regardless of score;
2. negation, branch rules, exact commands, evidence classes, path/SHA identifiers, and stop conditions are protected token classes;
3. pruning occurs first at atom/span boundaries;
4. subword pruning is an optional later ablation, never the initial implementation;
5. the small model score cannot establish P2 correspondence.

## 5. Position scheduling

LongLLMLingua reorders retained documents because relevant information placed in the middle is less reliably used. Our previous plan said only “put important information at salient boundaries.” Replace that with an explicit renderer policy and positional ablation.

For a U-shaped position prior `u(j,n)`, place high-relevance/high-risk atoms near the beginning and end while respecting dependency order:

\[
\pi^*=\arg\max_\pi\sum_i r_i u(\pi(i),n)-\lambda_d Viol_{dep}(\pi)-\lambda_g Frag(\pi).
\]

Default coding-agent arrangement:

1. current mode + goal + hard prohibition;
2. exact authority/bootstrap reference;
3. selected task-local context and commands;
4. verification/output contract + stop condition repeated compactly at the tail.

Do not reorder source fragments in a way that destroys executable or semantic sequence. Preserve original order within each atomic document unless a registered renderer proves equivalence.

## 6. Dynamic compression budgets

Uniform compression is wrong because authority nodes have unequal relevance and unequal failure cost. Adapt the paper's relevance-ranked scheduler:

\[
\tau_k=clip\left(\tau_0+\delta_\tau\left(1-\frac{2I(r_k)}{K'}\right),\tau_{min},\tau_{max}\right).
\]

Here `τk` is retained fraction, not compression ratio. Extend it with invariant risk:

\[
\tau_k^{repo}=\max(\tau_k,\tau_{risk}(k),\tau_{closure}(k)).
\]

- mandatory closure: `τclosure=1` for semantic atoms;
- high-risk authority/negation/evidence nodes receive a high floor;
- examples and historical provenance receive lower floors;
- budgets are tokenizer-specific and measured after rendering.

The optimizer must expose the allocation ledger: candidate, score, rank, initial tokens, retained tokens, floor cause, and excluded alternatives.

## 7. Recovery and integrity

LongLLMLingua repairs entities copied from compressed prompts by mapping generated subsequences back to the original prompt. Coding-agent compression needs a stronger **reference and command recovery layer**.

Create a bidirectional expansion map:

```json
{
  "candidate_digest": "...",
  "source_digest": "...",
  "spans": [
    {"compressed":"Δmain=0","canonical":"Do not modify main directly.","atom_id":"branch.main-immutable"},
    {"compressed":"@A7","canonical_ref":"mvp-build/decision/SESSION_ONBOARDING.md#...","atom_id":"authority.bootstrap"}
  ]
}
```

Recovery modes:

- pre-execution deterministic expansion for agents that do not support symbolic codecs;
- tool-time expansion when an alias is invoked;
- post-generation repair only for exact identifiers, commands, paths, SHAs, and registered aliases;
- reject ambiguous many-to-one recovery instead of guessing.

Unlike the paper's entity recovery, never rewrite arbitrary generated prose after the fact. Recovery must be provenance-bounded and auditable.

## 8. Revised Prompt IR

Add LongLLMLingua-derived fields:

```json
{
  "query": {"text":"...","phase":"onboard","restrictive_suffix":"..."},
  "atoms": [{
    "id":"...",
    "kind":"authority|invariant|command|context|output",
    "source_ref":"path#section",
    "mandatory":true,
    "protected_classes":["negation","exact-command"],
    "coarse_scores":{"structural":0,"conditional":null,"risk":1},
    "fine_scores":{"contrastive":null},
    "budget":{"floor":1,"allocated":1,"reason":"hyperedge-closure"},
    "position":{"band":"head|middle|tail","dependency_group":"..."}
  }],
  "expansion_map":"...",
  "ablation_coordinate":"..."
}
```

## 9. Evaluation protocol imported from the paper

The benchmark must separately evaluate components, not only the final pipeline.

### Factorial ablations

- no question-aware coarse selector;
- reversed conditional direction;
- no restrictive suffix;
- no contrastive fine scoring;
- no dynamic budget allocation;
- no position scheduling;
- no recovery/expansion;
- smaller/different ranker;
- deterministic-only versus learned hybrid.

### Metrics

Coarse stage:

- gold-node Recall@k;
- mandatory hyperedge recall;
- authority-route recall;
- noise density.

Fine stage:

- protected-token recall;
- exact command/path/SHA retention;
- task-conditioned information density;
- compression ratio by atom kind.

End-to-end:

- execution success and forbidden-action absence;
- token cost by target tokenizer;
- latency including compression;
- output recovery accuracy;
- variance across prompt positions, models, and seeds;
- Pareto dominance versus full prose, reference-only, and deterministic graph baselines.

Run position stress tests by moving the decisive authority/invariant node through head, early-middle, center, late-middle, and tail positions. Reordering is causal only if it reduces this variance.

Use deterministic decoding where available for reproducibility; when provider behavior is stochastic, record temperature, seed support, model revision, retries, and confidence intervals.

## 10. Architectural decision

Replace the previous initial target

`Prompt IR + generic phase renderer + tokenizer adapters`

with

`Query-conditioned coarse-to-fine Prompt IR compiler + mandatory hypergraph closure + dynamic budget ledger + position scheduler + deterministic expansion/recovery + component ablations`.

Still do **not** begin with arbitrary subword deletion, a bespoke esoteric language, or hypervector authority. The first implementation remains deterministic at its trust boundary; learned conditional/contrastive scoring is a pluggable P0 ranker evaluated against structural baselines.

## 11. New predictions and falsifiers

Predictions:

1. `p(q|d)` or an approximation will improve gold-node Recall@k over unconditioned lexical/perplexity ranking on ambiguous repository tasks.
2. Contrastive atom scoring will retain more task-relevant optional context than ordinary perplexity at equal token budgets.
3. Dynamic budgets will dominate uniform budgets when authority/context relevance is heterogeneous.
4. Position scheduling will reduce execution variance when critical context would otherwise fall in the middle.
5. Expansion/recovery will reduce corrupted paths, commands, SHAs, and aliases.
6. Deterministic structural closure plus learned ranking will outperform either alone at high compression.

Falsify or remove each component independently when its ablation shows no held-out benefit after accounting for latency and variance.
