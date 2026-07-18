# 2026-07-18 01:05 ET — Graph-Learning Paper Triage Handoff

format: TOON-oriented Markdown  
status: immutable handoff  
scope: `GTM-RESEARCH/website-framework/`

## state

branch_pr{branch,pr,reviewed_head,reviewed_ci,status}:
  agent/ui-metaprogramming-pass-1,17,8fc397a38381474734cfe6e411d1f0bf81b31349,29631422126,pass

new_docs[2]:
  ../26-graph-learning-paper-triage-and-promotion-gates.md
  ../validation/reports/2026-07-18-graph-learning-paper-triage.md

job_boundary:
  "one job = one finite full-site generation run; current synthetic contract selects 10,000 page-region jobs and 400 bounded Stage-2 batches; not request-time serving"

canonical_pipeline:
  "ProjectInput -> Stage-1 AgentOntologyProposal -> ApprovedOntology -> TF-IDF/BM25 + typed graph + hard constraints -> bounded opportunity regions -> sparse selection -> HRR -> SiteGenerationPlan -> Stage-2 PageConceptProposal -> CandidatePageSeed -> existing PageCoordinate/PageGenerationJob/PageIR/static UI compiler"

## research intake

rule:
  "generated bibliography and conference-title lists are leads; exact identity + primary source + problem-class match + simpler baseline + validation/pass/fail vectors + measured framework result required before promotion"

verified[10]{paper,source,task,disposition}:
  GraphTARIF,https://arxiv.org/abs/2510.10631,"learned graph attention/node representation","future supervised comparison"
  VSAL,https://arxiv.org/abs/2602.13880,"vision graph-property detection","debug visualization only"
  node-feature-transfer-gfm,https://doi.org/10.1145/3774904.3792236,"cross-graph representation transfer","future multi-project research"
  unified-graph-clustering,https://doi.org/10.1145/3774904.3792266,"learned graph clustering","comparison after real labels"
  sustained-vertex-cover,https://doi.org/10.1145/3774904.3792250,"temporal coverage scheduling","no initial compiler role"
  delta-pu,https://doi.org/10.1145/3774904.3792251,"positive-unlabeled graph classification","future review-prioritization experiment"
  dp-dgad,https://arxiv.org/abs/2508.00664,"dynamic graph anomaly detection","future drift/maintenance comparison"
  e2sgnn,https://doi.org/10.1145/3774904.3792271,"spiking GNN efficiency",out-of-scope
  streaming-interaction-anomaly,https://doi.org/10.1145/3774904.3792282,"streaming graph anomaly detection","future field monitoring"
  graph-to-tree,https://doi.org/10.1145/3774904.3792286,"self-supervised graph representation","future multi-graph benchmark"

## decisions

decisions[10]{id,decision,ref}:
  GL01,"a graph paper is not applicable merely because the framework contains a graph",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL02,"current per-project ontology graph remains deterministic/evidence-bound",../reference/src/ontology-graph.ts
  GL03,"learned clustering cannot define prospects, intents, page families, or routes without external labels",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL04,"graph transformers/foundation models require many independently reviewed project graphs and an explicit held-out task",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL05,"PU learning requires accepted positives and truly unlabeled candidates; unreviewed is not negative",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL06,"temporal/anomaly models require versioned history and independent anomaly/drift labels",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL07,"VSAL may inform operator visualization only; rendered layouts are not compiler authority",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL08,"no learned graph code promoted from this paper set",../validation/reports/2026-07-18-graph-learning-paper-triage.md
  GL09,"graph-model choice and Wasm execution-target choice remain separate",../reference/src/acceleration-decision.ts
  GL10,"current next code path remains real ingestion/providers/reviewers/context/content transaction",../memory/MEMORY.md

## validation

pass[9]:
  exact-paper-identity-verified
  problem-class-mismatch-recorded
  deterministic-baseline-preserved
  evidence-and-safety-remain-hard-authority
  connected-components-remain-descriptive
  hrr-remains-structural-not-page-authority
  graph-learning-and-wasm-decoupled
  no-unjustified-model-feature-added
  promotion-gate-defined

pending[9]:
  real-multi-project-graph-corpus
  independent-segment-relevance-quality-labels
  learned-graph-baseline-comparison
  real-stage1-provider
  reviewer-workflow
  real-stage2-provider-transaction
  100-500-noindex-cohort
  complete-10000-content-ui-emission
  browser-crawler-search-commercial-field-proof

not_claimed[8]:
  graph-transformer-superiority
  graph-foundation-model-superiority
  learned-clustering-equals-market-segments
  pu-classifier-page-eligibility
  anomaly-model-drift-value
  graph-paper-proves-seo
  graph-paper-proves-wasm
  generated-bibliography-is-authority

## next

next[8]{order,task,gate}:
  1,"real repository/business/source ingestion","no invented ProjectInput truth"
  2,"Stage-1 schema-constrained provider + reviewer workflow","reviewed real ontology and observations"
  3,"independent ContextCorpus and labels","held-out compatibility and hidden-slice evidence"
  4,"Stage-2 schema-constrained provider","bounded region-faithful PageConceptProposals"
  5,"atomic output transaction","accepted proposals -> evidence/modules/tasks/PageIR/static emission"
  6,"100-500 real noindex cohort","information gain/cannibalization/content review"
  7,"10,000 complete static emissions","browser/crawler/accessibility/performance acceptance"
  8,"learned graph + 50k/100k acceleration comparisons","measured failure before model/native promotion"
