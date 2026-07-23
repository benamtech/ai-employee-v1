# Prompt Compression Implementation Plan

Status: proposed Trace014 input; implementation not yet admitted.

## Agent directive

```text
R:=repo@HEAD; S:=mvp-build; Q:=prompt-compression+forced-dreaming.
Read active authority + research/prompt-compression/{README,RESEARCH,LONGLMLINGUA_INTEGRATION,FORCED_DREAMING}.md.
Run repoctl start with research/prompt-compression/task.json before source edits.

Goal:
(q,F,A,G,H)->Dmust->C0->πr->Br->C1->V->Prompt*->RecoveryMap;
(q,F,A,G,H)->DreamEnvelope->IndependentCandidates->DiversityVerify->QDArchive->ParetoPlan.
Minimize tokens/cost/latency while preserving exact authority and expand mechanism coverage before convergence.

Trust:
Dmust:=cl_H(q)∪authority(q)∪output(q); ∀ranker,Dmust⊆candidate.
Learned/perplexity/HV/latent/lens/diversity scores=P0 search controls only; never authority or P2 proof.

Implement compression core:
1 PromptIR schema with typed atoms, digests, protected classes, scores, budgets, positions, expansion map.
2 deterministic extraction from capsule+facts+authority DAG+dependency graph+invariant hypergraph.
3 C0 coarse selector: structural/BM25/embedding?/small-LM p(q+restrict|d)? with reversed/no-restrict controls.
4 πr scheduler: objective/prohibitions at head; dependency context middle; verification+stop tail.
5 Br ledger: dynamic relevance budgets with risk/closure floors.
6 C1 protected atom/span compression; optional contrastive s(a)=ℓ(a|h)-ℓ(a|q,h).
7 renderers+exact tokenizer adapters.
8 static verifier: digest/authority parity, required hyperedges, exact argv/path/SHA, forbidden effects, recovery bijection.
9 deterministic expansion/recovery.

Implement forced dreaming:
B={bug,feature,user,operator,architecture,protocol,market,weird,constraint,test,failure,recovery};
C={c1..ck}, k>=8; zi∈[-1,1]^12;
max_i!=j cos(zi,zj)<=τ; mechanismFamilies(C)>=5.
Generate slots independently; later explorers cannot see earlier candidate text; forbid early ranking and peer coupling.
Each ci emits {mechanism,evidence,invariants,effects<=4,prediction,falsifier,maxPatch,argv,counterfactual,novelty,unknowns}.
Reject lexical paraphrases, incomplete candidates, unsupported novelty, and candidates that fail mandatory closure.

Selection:
valid(ci)⇔digestParity∧authorityParity∧requiredHyperedgesClosed∧forcedFieldsComplete;
C*=Pareto{repoFidelity↑,mechanismDiversity↑,predictedValue↑,testability↑,patchBoundedness↑};
archive best valid candidate per cell=(mechanism,blastRadius,verificationType,userCapability,riskClass) before final integration.

Required implementation paths:
- decision/engine/compress/{prompt-ir,coarse-select,position-schedule,budget-allocate,fine-compress,recover,render,verify};
- decision/engine/explore/{compile-dream-envelope,verify-diversity,quality-diversity-archive};
- schemas for PromptIR, evaluation, recovery, dream envelope, candidate, diversity report;
- repoctl {compress,dream,verify-dream,verify-prompt,benchmark-prompts};
- adversarial/factorial benchmark + contracts + docs.

Baselines:
B0 full canonical prose; B1 hand compact; B2 symbolic; B3 reference-only; B4 deterministic compressor; B5 query-conditioned compressor; B6 B5+independent forced dreaming; B7 B6+QD archive; B8 optional learned/HV/context-space mutation.

Ablations:
no-phase-slice; no-p(q|d); p(d|q); no-restrict; uniform-budget; no-position; no-contrastive; no-recovery; no-dreaming; coupled-explorers; lexical-only-diversity; no-QD-archive.

Predictions:
P1 compression core reduces median tokens>=50% with zero critical invariant loss.
P2 q-conditioned ranking improves gold Recall@k.
P3 dynamic budgets and position scheduling reduce waste/variance.
P4 independent forced dreaming increases mechanism-family/effect-frontier coverage vs equal-compute repeated sampling.
P5 dense explorer communication reduces semantic diversity.
P6 QD archive preserves useful mechanisms omitted by scalar top-k.
P7 forced dreaming improves selected plans only when executable verification discriminates candidates.
P8 symbolic/HV/latent methods remain model-dependent and non-authoritative.

Falsify forced dreaming if it only increases prose/tokens/lexical variation, does not change selected mechanism/proof/tests, reduces execution quality, or fails to beat independent ordinary sampling at equal compute.

Proof:
P0 token/ranking/diversity/latent/context-space hypotheses;
P1 exact schema/separation/archive verifier properties;
P2 exact IR/candidate↔repo/authority/hyperedge correspondence;
P3 exact-candidate tests/benchmark execution;
P4 external model/provider/production acceptance only.

Verify argv-only:
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
node research/prompt-compression/compile-forced-dreaming.mjs --task <task> --out <envelope> --count 8
npm test -- prompt-compression-contract.test.ts forced-dreaming-contract.test.ts
node decision/engine/repoctl.mjs benchmark-prompts --suite decision/benchmarks/prompt-compression --ablations all
node scripts/verify-agentic-repository.mjs
npm test
npm run build

Finish only with exact-head evidence; unavailable provider/model/production runs remain explicit blockers.
```

## Ordered implementation

1. Start Trace014 and inspect generated diffusion/effect frontier.
2. Define Prompt IR, recovery, forced-dreaming, candidate, diversity, and archive schemas.
3. Implement deterministic extraction, mandatory closure, structural compression baseline, and protected verification.
4. Implement query-conditioned ranking, positions, budgets, fine compression, renderers, and recovery.
5. Promote the research envelope compiler into `decision/engine/explore/` with schema validation.
6. Add independent explorer packets, mechanism-family coverage, vector separation, and semantic duplicate rejection.
7. Add quality-diversity cells and delayed fidelity-first integration.
8. Add complete adversarial/factorial benchmark across models, seeds, coupling topologies, and ablations.
9. Evaluate embeddings, hypervectors, symbols, and context-space mutation only after deterministic baselines.
10. Admit defaults only from held-out Pareto evidence; evaluate, finish, verify, and record P4 exclusions.
