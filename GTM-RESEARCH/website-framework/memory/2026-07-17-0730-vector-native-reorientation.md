# Website Framework Memory — Vector-Native Reorientation

format: TOON-oriented Markdown
at: 2026-07-17T07:30:00-04:00
branch: agent/ui-metaprogramming-pass-1
status: source-level-pass; field-acceptance-pending
immutable: true

## summary

session{goal,result}:
  "deep review + fix vector-native blockers + academic reorientation + memory protocol","namespace/version symbols, full prototype packing, computed proposal coverage, CSI batch control, corrected authority docs, append-only memory model"

## source_changes

changes[8]{area,files,result}:
  vector_identity,"reference/src/benchmark.ts; site-manifest.yaml","namespace + symbol_version seed actual role/filler vectors"
  prototype_ir,"reference/src/framework.ts; reference/src/manifest.ts","all prototypes survive geometry -> SiteSource -> PageIR -> packed arrays"
  packed_artifacts,"reference/src/framework.ts; reference/scripts/emit-manifest.mjs","prototypeOffsets + prototypeIds + prototypeVectors emitted and hashed"
  deterministic_space,"reference/src/manifest.ts","broad spaceHash canonical under source collection reorder"
  proposal_gate,"reference/src/manifest.ts; site-manifest.yaml","sourced contexts + computed baseline/proposed coverage + duplicate ceiling"
  agent_context,"reference/src/agent-harness.ts","all page regions + symbol version + coverage policy"
  csi_control,"reference/src/csi.ts; reference/test/vector-native.test.mjs","FLCI batch selector; head/tail fixture rejects isolated noise"
  tests,"reference/test/manifest.test.mjs; reference/test/vector-native.test.mjs","distinct proposal passes; duplicate fails; identity and packed parity tested"

## academic_basis

papers[3]{id,url,applies,does_not_prove}:
  contextual-ranking,https://arxiv.org/abs/2309.05113,"separate query-doc/context-doc relevance; explicit cohort context; graded labels; lexical+semantic baselines","HRR; public corpus construction; Google/Bing lift; revenue"
  hdc-vsa-applications,https://arxiv.org/abs/2112.15424,"structured distributed representations; associative/compositional operations; hardware research","SEO; page distinctness; UI; commercial value"
  csi,https://arxiv.org/abs/2605.24779,"complement-aware batch/split selection; coherent tail preservation; isolated-outlier suppression","single-page admission; field SEO; production guarantee; assumptions not diagnosed"

## architecture

planes[3]{plane,input,output,current}:
  publication,"source + explicit context cases + prototypes","reviewed canonical nodes + emissions","materially source-wired; external relevance pending"
  navigation,"stable nodes + typed semantic edges","useful prospect/agent path","not implemented; raw cosine page IDs only"
  interaction,"canonical page + explicit task + secure controls","streamed work + typed artifact + approval/proof","not represented in website IR"

pipeline:
  "site-manifest.yaml -> namespaced/versioned symbols -> all-prototype vector space -> coverage/neighbor derivation -> evidence modules -> SiteSource -> PageIR -> packed prototype arrays + CSR graph -> static/UI/agent emissions"

## validation

proof{head,workflow_run,tests,pages,indexable,prototypes,namespace,symbol_version,build_hash,space_hash,artifact_digest}:
  9ef48b97308e09d5a97f4978820255e3c8b53c7e,29576487817,"22/22",6,0,7,amtech-hyper-site-v1,1,ae16957209827c1fbbc295992ab0aceeaf648b250521b03695b4f663cf6d241a,934ac02b434b0d583c131a15bbff79492ea8e27ca13a5ea2d07367b4fa8b6978,sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d

passed[6]:
  vector-identity-affects-symbols
  source-order-stable-space-and-build-hashes
  all-prototype-packed-parity
  all-prototype-agent-context
  computed-distinct-proposal-admission-and-duplicate-rejection
  csi-controlled-head-tail-selection-with-noise-rejection

not_run_or_not_passed[8]:
  independent-human-graded-context-document-benchmark
  learned-semantic-baseline
  typed-node-path-edges
  public-ai-employee-task-surface
  browser-visual-accessibility-cwv
  zig-wasm-cloudflare-production
  live-index-ranking-citation
  conversion-revenue-gross-profit-lifecycle-return

## review_disposition

findings[13]{id,state,ref}:
  F-01,closed,"reference/src/benchmark.ts; validation/reports/2026-07-17-vector-native-corrections.md"
  F-02,closed,"reference/src/manifest.ts; reference/test/vector-native.test.mjs"
  F-03,closed,"reference/src/framework.ts; reference/test/manifest.test.mjs"
  F-04,closed,"reference/src/manifest.ts; site-manifest.yaml"
  F-05,open,"typed semantic edges absent"
  F-06,closed,"reference/src/agent-harness.ts"
  F-07,open,"synthetic benchmark remains fixture-only"
  F-08,open-limitation,"UI primarily module-grammar-driven"
  F-09,open,"public employee task IR absent"
  F-10,open,"experiment/window aggregation"
  F-11,open,"business event idempotency"
  F-12,open,"ontology governance"
  F-13,open,"claim/evidence applicability semantics"

## residual_risks

risks[6]{risk,impact,next_gate}:
  primary-prototype-alias-implicit,"canonicalized first prototype may not express intended primary region","add primary_prototype_id or remove alias authority"
  raw-cosine-links-untyped,"nearby page may not be useful next step","typed edge schema + path review"
  coverage-context-self-confirmation,"agent-supplied contexts can rationalize own page","independent context corpus + assessor grades"
  semantic-baseline-is-token-hash,"cannot claim neural semantic comparison","Sentence-BERT/other learned control + held-out data"
  csi-preprint-assumptions,"greedy guarantee not transferable automatically","curvature/monotonicity diagnostic + simple baselines"
  product-runtime-gap,"static page compiler cannot host public employee work","bounded task-surface contract from mvp-build standards"

## authority_refs

refs[13]{file,role}:
  README.md,"current reality + commands + next path"
  CODEGRAPH.md,"source/authority graph"
  AGENTS.md,"operating and memory rules"
  site-manifest.yaml,"single declarative corpus authority"
  18-vector-node-path-web-framework-model.md,"three-plane conceptual model"
  19-vector-native-corrections-and-csi-validation.md,"academic + validate/pass/fail authority"
  validation/reports/2026-07-17-vector-node-path-deep-code-review.md,"original findings"
  validation/reports/2026-07-17-vector-native-corrections.md,"post-fix proof"
  reference/src/benchmark.ts,"vector identity and research scoring controls"
  reference/src/manifest.ts,"composer + geometry + computed proposal gate"
  reference/src/framework.ts,"semantic and packed all-prototype IR"
  reference/src/csi.ts,"complement-aware batch control"
  .github/workflows/website-framework-reference.yml,"source CI authority"

## next

next[7]{order,work,gate}:
  1,"explicit primary-prototype schema/alias semantics","packed + hash + reorder tests"
  2,"typed graph edges and node-path rules","semantic relationship + human usefulness"
  3,"independent query/context/document benchmark","graded Perfect/Good/Fair/Bad + disagreement"
  4,"learned semantic and simpler baseline arms","held-out + out-of-domain improvement"
  5,"facility-location vs CSI batch/split experiments","head/tail balance + outlier rate"
  6,"public AI Employee task-surface contract","secure input + stream + artifact + approval/proof"
  7,"browser/accessibility then 20–40 noindex proposals","field publication remains separate gate"

## memory_rule

rule:
  "never overwrite this file; create a new YYYY-MM-DD-HHMM-<slug>.md handoff and update memory/MEMORY.md newest-first"
