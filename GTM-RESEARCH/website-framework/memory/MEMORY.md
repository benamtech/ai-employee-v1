# Website Framework Durable Memory

format: TOON-oriented Markdown
status: active
scope: GTM-RESEARCH/website-framework
updated_at: 2026-07-17T08:20:00-04:00

## protocol

memory_model{index,handoffs,mutation}:
  "memory/MEMORY.md","memory/YYYY-MM-DD-HHMM-<slug>.md","append immutable handoff; reconcile this index; never rewrite timestamped files"

rules[8]:
  read-MEMORY-first
  read-newest-handoff-next
  timestamped-handoffs-immutable
  never-repurpose-prior-handoff
  index-newest-first
  file-reference-heavy-TOON-style
  no-source-report-duplication
  TOON-context-encoding-not-app-data

## current

state{branch,pr,status,latest_validated_authority_head,validated_code_head,workflow_run}:
  agent/ui-metaprogramming-pass-1,17,"draft; source-level-pass; relevance/runtime/field blocked",a15327cf99cbd628b96e936b1043523bbdf9d152,9ef48b97308e09d5a97f4978820255e3c8b53c7e,29577907501

note:
  "latest_validated_authority_head includes source, review, documentation, and append-only memory through the prior MEMORY update; this index does not attempt impossible self-hash recording"

compiled{manifest_version,pages,indexable,prototypes,namespace,symbol_version,tests}:
  1.1.0,6,0,7,amtech-hyper-site-v1,1,"22/22"

boundary:
  "vector-native source compiler + static/UI emissions; proposal relevance partial; typed paths/public employee/runtime/field pending"

## handoffs

handoffs[6]{at,file,status,scope}:
  2026-07-17T08:15:00-04:00,2026-07-17-0815-comprehensive-reorientation.md,current,"full codebase review; coverage qualification; runtime findings; corrected next path"
  2026-07-17T07:30:00-04:00,2026-07-17-0730-vector-native-reorientation.md,superseded-interpretation,"compiler corrections; overstates proposal coverage acceptance; retained immutable"
  2026-07-17T06:30:00-04:00,2026-07-17-ui-metaprogramming-pass-1.md,historical-source-pass,"browser-first CSS; semantic UI; bounded R3F"
  2026-07-17T02:00:00-04:00,../../../mvp-build/memory/2026-07-17-website-framework-phase-1-closure.md,historical,"Phase 1 spec closure"
  2026-07-17T00:55:00-04:00,../../../mvp-build/memory/2026-07-17-holographic-website-framework-v0.1.md,historical,"initial HRR/VSA Request Mirror"
  2026-07-17T00:22:00-04:00,../../../mvp-build/memory/2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md,historical,"GTM/source reconciliation"

## authority

read_order[13]{order,file,role}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scope identity"
  3,../../CODEGRAPH.md,"root map"
  4,../AGENTS.md,"operating/memory rules"
  5,../CODEGRAPH.md,"current source graph"
  6,../README.md,"current reality"
  7,MEMORY.md,"current durable state"
  8,2026-07-17-0815-comprehensive-reorientation.md,"current handoff"
  9,../18-vector-node-path-web-framework-model.md,"three planes"
  10,../19-vector-native-corrections-and-csi-validation.md,"academic validation"
  11,../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md,"full findings"
  12,../validation/reports/2026-07-17-vector-native-corrections.md,"exact source proof boundary"
  13,../site-manifest.yaml,"single corpus authority"

## architecture

planes[3]{plane,state}:
  publication,"all-prototype compiler implemented; proposal relevance uncalibrated"
  navigation,"untyped similarity page IDs only"
  interaction,"public AI Employee task IR absent"

pipeline:
  "source + explicit contexts -> manifest -> namespace/version symbols -> all prototypes -> mechanical coverage + neighbors -> modules -> SiteSource/PageIR -> packed prototypes/CSR -> static/UI/agent emissions"

## decisions

decisions[13]{id,decision,ref}:
  D01,"manifest is sole corpus authority","../site-manifest.yaml"
  D02,"HTML/UI are emissions","../README.md"
  D03,"vector chunks are reusable situations, not people","../18-vector-node-path-web-framework-model.md"
  D04,"namespace/symbol_version alter actual symbols","../reference/src/benchmark.ts"
  D05,"all prototypes survive packed compilation","../reference/src/framework.ts"
  D06,"coverage mechanics compare current vs proposed corpus","../reference/src/manifest.ts"
  D07,"coverage mechanics are not relevance acceptance","../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md"
  D08,"CSI is batch/split control, not single-page oracle","../reference/src/csi.ts"
  D09,"context paper is baseline, not SEO validation","../19-vector-native-corrections-and-csi-validation.md"
  D10,"page/node-path/public-session are separate planes","../18-vector-node-path-web-framework-model.md"
  D11,"UI static/browser-first; 3D optional/noncanonical","2026-07-17-ui-metaprogramming-pass-1.md"
  D12,"timestamped memories immutable","../AGENTS.md"
  D13,"first real proposal cohort blocked by P0 relevance/path issues","../CODEGRAPH.md"

## proof

proof{head,run,tests,pages,indexable,prototypes,artifact}:
  9ef48b97308e09d5a97f4978820255e3c8b53c7e,29576487817,"22/22",6,0,7,sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d

passed[5]:
  namespaced-versioned-symbols
  all-prototype-packed-parity
  source-order-stable-build-space-hashes
  all-prototype-agent-context
  mechanical-distinct-vs-duplicate-and-csi-fixtures

partial[2]:
  proposal-coverage,"computed; shifted cosine + self-supplied contexts"
  primary-page-vector,"all prototypes preserved; primary alias implicit"

## academic

papers[3]{id,url,use,boundary}:
  Kong-2023,https://arxiv.org/abs/2309.05113,"explicit context-doc relevance + graded labels + lexical/semantic controls","not HRR/corpus/search/revenue proof"
  Kleyko-2021,https://arxiv.org/abs/2112.15424,"HDC/VSA compositional computing","not SEO/UI/commercial proof"
  Iyer-2026,https://arxiv.org/abs/2605.24779,"CSI batch/split head-tail balance/outlier suppression","preprint; no single-page authority"

## blockers

p0[4]{id,item,ref}:
  R-01,"primary prototype semantics","../reference/src/manifest.ts; ../reference/src/framework.ts"
  R-02,"shifted-cosine compatibility calibration","../reference/src/manifest.ts"
  R-03,"independent graded context corpus","../19-vector-native-corrections-and-csi-validation.md"
  R-04,"typed semantic graph paths","../18-vector-node-path-web-framework-model.md"

p1[9]{id,item,ref}:
  R-05,"synthetic benchmark validity","../reference/src/benchmark.ts"
  R-06,"CSI baseline/curvature/scale study","../reference/src/csi.ts"
  R-07,"optimizer validation/PSD policy","../reference/src/optimizer.ts"
  R-08,"resolver identity/mask/prototype support","../reference/src/resolver.ts"
  R-09,"Worker/TS resolver parity","../reference/worker/src/index.ts"
  R-10,"Wasm memory-grow view safety","../reference/src/wasm.ts"
  R-11,"experiment/window/event correctness","../reference/src/distribution.ts"
  R-12,"public employee task IR","../../../mvp-build/docs/public-interaction-standard.md"
  R-13,"browser/accessibility/CWV","../validation/reports/2026-07-17-ui-metaprogramming-pass-1.md"

p2[3]{id,item}:
  R-14,"ontology governance"
  R-15,"evidence applicability/freshness"
  R-16,"production schema derivation"

not_claimed[8]:
  reviewed-2000-page-corpus
  search-ranking-lift
  AI-citation-lift
  zero-volume-value
  conversion-revenue-lift
  Zig-Wasm-win
  Cloudflare-acceptance
  browser-beauty-acceptance

## next

next[8]{order,task,gate}:
  1,"primary prototype semantics","explicit deterministic invariant"
  2,"compatibility calibration","independent grades + reliability"
  3,"train/validation/test contexts","frozen splits; CSI/random/stratified/facility comparison"
  4,"typed node paths","edge types + provenance + usefulness"
  5,"ranking baselines","BM25 + learned semantic + facets + graph + HRR + hybrid"
  6,"runtime correctness","resolver/Worker/Wasm/distribution"
  7,"public task + browser","secure stream/artifact/approval then browser/accessibility"
  8,"first cohort","20–40 noindex proposals; separate publication gate"

## write_next

template:
  "create immutable YYYY-MM-DD-HHMM-<slug>.md; add newest handoffs row; reconcile current/decisions/proof/blockers/next; never edit prior timestamped files"
