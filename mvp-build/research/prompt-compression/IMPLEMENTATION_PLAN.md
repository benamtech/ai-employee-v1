# Prompt Compression Implementation Plan

Status: proposed Trace014 input; implementation not yet admitted.

## Agent directive

```text
R:=repo@HEAD; S:=mvp-build; Q:=prompt-compression.
Read active authority + research/prompt-compression/{RESEARCH,LONGLMLINGUA_INTEGRATION}.md.
Run repoctl start with research/prompt-compression/task.json before source edits.

Goal:
(q,F,A,G,H)->Dmust->C0->πr->Br->C1->V->Prompt*->RecoveryMap.
Minimize target-model tokens/cost/latency subject to exact authority, mandatory hyperedge, command, stop, effect, and P0..P4 fidelity.

Trust boundary:
Dmust:=cl_H(q)∪authority(q)∪output(q); ∀ranker,Dmust⊆candidate.
Learned/perplexity/HV scores=P0 ranking only; never authority or P2 proof.

Implement:
1 PromptIR schema with query/phase, typed atoms, source digests, mandatory/protected classes, coarse/fine scores, budgets, position bands, expansion map.
2 deterministic atom extractor from capsule+repo facts+authority DAG+dependency graph+invariant hypergraph.
3 C0 coarse selector:
  r_repo=α·structural+β·conditional+γ·risk;
  adapters={structural,BM25,embedding?,small-LM p(q+restrict|d)?};
  include reversed p(d|q) + no-restrict controls.
4 πr position scheduler:
  maximize Σ r_i·u(pos_i,n) subject to dependency/order/fragmentation constraints;
  render hard mode/prohibition at head; verification+stop at tail.
5 Br dynamic budget ledger:
  τ_k=clip(τ0+δτ(1-2I(r_k)/K'),min,max);
  τ_repo=max(τ_k,τrisk,τclosure);
  expose score/rank/input/retained/floor reason.
6 C1 fine compressor:
  deterministic atom/span pruning first;
  optional contrastive score s(a)=ℓ(a|h)-ℓ(a|q,h);
  never prune protected negation, branch, command, path/SHA, evidence, stop atoms.
7 renderers={full,compact,reference-folded,structured,symbolic}; exact tokenizer adapters.
8 V static verifier:
  digest+authority parity; complete required hyperedges; exact argv/path/SHA; forbidden effects absent; recovery map bijective where required.
9 RecoveryMap:
  deterministic alias/reference expansion before/tool-time execution;
  post-output repair only for provenance-bounded exact identifiers; reject ambiguity.
10 benchmark harness + component/factorial ablations + Pareto selector.

CLI:
repoctl compress --transaction <p> --phase <z> --tokenizer <m> --ranker <r> --budget <b> --out <d>
repoctl verify-prompt --candidate <f>
repoctl benchmark-prompts --suite <d> --models <matrix> --ablations all

Baselines:
B0 full canonical prose;
B1 hand compact;
B2 symbolic;
B3 reference-only phase;
B4 deterministic structural/hypergraph;
B5 B4+position+dynamic budgets;
B6 B5+conditional coarse ranker;
B7 B6+contrastive atom scorer;
B8 B7+recovery;
B9 optional HV retrieval ablation.

Required ablations:
¬query-aware-C0; conditional direction reversed; ¬restrict;
¬contrastive-C1; uniform budget; ¬reorder; ¬recovery;
small-ranker variants; deterministic-only vs learned hybrid.

Corpus:
completed traces + adversarial {clean,dirty,on-main,stale-base,red-doctor,conflicting-memory,premature-code,negation,evidence-promotion,ambiguous-path,corrupted-command};
position sweep critical atom across {head,early-mid,center,late-mid,tail}.

Metrics:
C0:{gold-node Recall@k,authority recall,mandatory-edge recall,noise density};
C1:{protected-token recall,exact command/path/SHA retention,atom-kind CR};
E2E:{required-action success,forbidden-action absence,tokens,cost,compression latency,total latency,retries,tool calls,recovery accuracy,position/model/seed variance}.

Admission:
zero critical invariant loss;
median token reduction≥50% on declared tokenizers;
non-inferior execution within predeclared margin;
component benefit survives held-out tasks;
compression+recovery overhead < saved inference cost;
exact-head tests/build green.
No scalar score may hide fidelity regression.

Predictions:
P1 q-conditioned C0 improves gold Recall@k vs unconditioned ranking.
P2 contrastive atom score beats ordinary perplexity at equal budget.
P3 dynamic budgets beat uniform when relevance/risk is heterogeneous.
P4 position scheduling lowers middle-position execution variance.
P5 recovery lowers corrupted identifiers/commands.
P6 structural closure+learned ranking beats either alone at high CR.
P7 symbolic/HV variants remain model-dependent and non-authoritative.

Falsify/remove any component lacking held-out benefit after latency+variance; reject candidate on any branch/worktree/authority/negation/command/stop/evidence invariant loss.

Max patch:
S/decision/engine/{compress,schemas,templates,repoctl.mjs,representation-registry.json,README.md};
S/decision/benchmarks/prompt-compression; S/tests; scoped research/docs.
No product runtime changes.

Verify argv-only:
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
npm test -- prompt-compression-contract.test.ts
node decision/engine/repoctl.mjs benchmark-prompts --suite decision/benchmarks/prompt-compression --ablations all
node scripts/verify-agentic-repository.mjs
npm test
npm run build

Finish only with exact-head evidence; provider/model results unavailable locally remain explicit blockers.
```

## Ordered implementation

1. Start Trace014 and inspect generated diffusion/effect frontier.
2. Define Prompt IR, evaluation, budget-ledger, and recovery-map schemas.
3. Implement deterministic extraction, mandatory closure, and structural baseline.
4. Implement coarse selector interfaces and gold-node Recall@k benchmark.
5. Implement position scheduler and position-sweep fixtures.
6. Implement dynamic budget allocation with risk/closure floors.
7. Implement atom/span fine compression and protected-token verifier.
8. Add optional conditional and contrastive small-model adapters behind deterministic interfaces.
9. Implement renderers, tokenizer accounting, and expansion/recovery.
10. Run factorial ablations; select only Pareto candidates with zero critical fidelity loss.
11. Evaluate, finish, verify, and record P4 exclusions.
