# Website Framework Durable Memory

format: TOON-oriented Markdown
status: active
scope: GTM-RESEARCH/website-framework
updated_at: 2026-07-17T20:05:00-04:00

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
  agent/ui-metaprogramming-pass-1,17,"draft; source-level compiler pass; agent orchestration/relevance/runtime/field blocked",a15327cf99cbd628b96e936b1043523bbdf9d152,9ef48b97308e09d5a97f4978820255e3c8b53c7e,29577907501

compiled{manifest_version,pages,indexable,prototypes,namespace,symbol_version,tests}:
  1.1.0,6,0,7,amtech-hyper-site-v1,1,"22/22"

product_boundary:
  "user operates framework through coding agent; agent generates and maintains manifest/site program from business+brand+asset+source inputs; compiler validates/emits; this orchestration is not implemented"

## handoffs

handoffs[7]{at,file,status,scope}:
  2026-07-17T20:05:00-04:00,2026-07-17-2005-agent-operated-generation-wasm-research.md,current,"canonical agent-operated lifecycle; Wasm research; search-scale rejection boundary"
  2026-07-17T08:15:00-04:00,2026-07-17-0815-comprehensive-reorientation.md,current-code-review,"full codebase review; coverage qualification; runtime findings"
  2026-07-17T07:30:00-04:00,2026-07-17-0730-vector-native-reorientation.md,superseded-interpretation,"compiler corrections; overstates proposal coverage acceptance; retained immutable"
  2026-07-17T06:30:00-04:00,2026-07-17-ui-metaprogramming-pass-1.md,historical-source-pass,"browser-first CSS; semantic UI; bounded R3F"
  2026-07-17T02:00:00-04:00,../../../mvp-build/memory/2026-07-17-website-framework-phase-1-closure.md,historical,"Phase 1 spec closure"
  2026-07-17T00:55:00-04:00,../../../mvp-build/memory/2026-07-17-holographic-website-framework-v0.1.md,historical,"initial HRR/VSA Request Mirror"
  2026-07-17T00:22:00-04:00,../../../mvp-build/memory/2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md,historical,"GTM/source reconciliation"

## authority

read_order[14]{order,file,role}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scope identity"
  3,../../CODEGRAPH.md,"root map"
  4,../AGENTS.md,"operating/memory rules"
  5,../CODEGRAPH.md,"current source/product graph"
  6,../README.md,"current reality"
  7,MEMORY.md,"current durable state"
  8,2026-07-17-2005-agent-operated-generation-wasm-research.md,"current product/execution handoff"
  9,../20-agent-operated-vector-site-generation-and-wasm.md,"canonical usage + Wasm model"
  10,../18-vector-node-path-web-framework-model.md,"three planes"
  11,../19-vector-native-corrections-and-csi-validation.md,"academic validation"
  12,../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md,"full findings"
  13,../validation/reports/2026-07-17-vector-native-corrections.md,"exact source proof"
  14,../site-manifest.yaml,"single compiled-project/corpus authority"

## architecture

interface:
  "user -> coding agent -> ProjectInput/source/evidence/asset ledgers -> context corpus/ontology/candidate site program -> vector compiler/optimizer -> content/UI/task proposals -> deterministic emissions"

planes[3]{plane,state}:
  publication,"all-prototype compiler implemented; agent intake/orchestration and relevance calibration absent"
  navigation,"untyped similarity page IDs only"
  interaction,"public AI Employee task IR absent"

compute:
  "typed pruning -> lexical/semantic/facet/graph prefilter -> bounded multi-prototype vector scoring -> facility-location/CSI selection -> generated stable nodes"

wasm:
  "candidate portable SIMD math kernel for binding/scoring/top-k/duplicates/facility/CSI/parity; native Zig control may win locally; canonical pages remain static and Wasm-free"

## decisions

decisions[18]{id,decision,ref}:
  D01,"coding agent is primary framework interface","../20-agent-operated-vector-site-generation-and-wasm.md"
  D02,"user supplies business/brand/assets/source/goals; agent generates site program","../README.md"
  D03,"manifest is sole compiled-project/corpus authority, not user-facing authoring surface","../site-manifest.yaml"
  D04,"HTML/UI are emissions","../README.md"
  D05,"vector chunks are reusable prospect situations, not people","../18-vector-node-path-web-framework-model.md"
  D06,"namespace/symbol_version alter actual symbols","../reference/src/benchmark.ts"
  D07,"all prototypes survive packed compilation","../reference/src/framework.ts"
  D08,"coverage mechanics compare current vs proposed corpus","../reference/src/manifest.ts"
  D09,"coverage mechanics are not relevance acceptance","../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md"
  D10,"CSI is batch/split control, not single-page oracle","../reference/src/csi.ts"
  D11,"context paper is baseline, not SEO validation","../19-vector-native-corrections-and-csi-validation.md"
  D12,"page/node-path/public-session are separate planes","../18-vector-node-path-web-framework-model.md"
  D13,"UI static/browser-first; 3D optional/noncanonical","2026-07-17-ui-metaprogramming-pass-1.md"
  D14,"Wasm requires repeated data-parallel workload and portability, not merely vectors","../20-agent-operated-vector-site-generation-and-wasm.md"
  D15,"dual kernel controls: TS oracle, Zig native, Wasm scalar/SIMD","../20-agent-operated-vector-site-generation-and-wasm.md"
  D16,"page count is not objective; marginal useful coverage is","../AGENTS.md"
  D17,"static canonical delivery must not require Wasm","../20-agent-operated-vector-site-generation-and-wasm.md"
  D18,"timestamped memories immutable","../AGENTS.md"

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

research_only[3]:
  agent-operated-project-generation
  Zig-native-vs-Wasm-performance
  search-scale-corpus-value

## academic_platform

sources[7]{id,url,use,boundary}:
  Kong-2023,https://arxiv.org/abs/2309.05113,"explicit context-doc relevance + graded labels","not HRR/corpus/search/revenue proof"
  Kleyko-2021,https://arxiv.org/abs/2112.15424,"HDC/VSA compositional computing","not SEO/UI/commercial proof"
  Iyer-2026,https://arxiv.org/abs/2605.24779,"CSI batch/split balance","preprint; no single-page authority"
  W3C-Wasm,https://www.w3.org/TR/wasm-core/,"portable low-level SIMD execution","not automatic speedup"
  Cloudflare-Wasm,https://developers.cloudflare.com/workers/runtime-apis/webassembly/,"Workers supports SIMD; single-threaded; size/startup boundary","not production acceptance"
  Google-AI,https://developers.google.com/search/docs/fundamentals/using-gen-ai-content,"automation allowed when useful","scaled low-value pages fail"
  Google-AI-Search,https://developers.google.com/search/docs/fundamentals/ai-optimization-guide,"avoid separate page for every query variation","platform constraint not design objective"

## blockers

p0[6]{id,item,ref}:
  R-00,"ProjectInput/source/evidence/asset and coding-agent orchestration","../20-agent-operated-vector-site-generation-and-wasm.md"
  R-01,"primary prototype semantics","../reference/src/manifest.ts; ../reference/src/framework.ts"
  R-02,"shifted-cosine compatibility calibration","../reference/src/manifest.ts"
  R-03,"independent graded context corpus","../19-vector-native-corrections-and-csi-validation.md"
  R-04,"typed semantic graph paths","../18-vector-node-path-web-framework-model.md"
  R-05,"realistic TS/Zig-native/Wasm benchmark harness","../reference/src/wasm.ts; ../reference/zig/kernel.zig"

p1[8]{id,item,ref}:
  R-06,"candidate staged filtering/optimizer integration","../reference/src/optimizer.ts"
  R-07,"learned semantic baseline","../reference/src/benchmark.ts"
  R-08,"public employee task IR","../../../mvp-build/docs/public-interaction-standard.md"
  R-09,"resolver identity/mask/prototype support","../reference/src/resolver.ts"
  R-10,"Worker/TS resolver parity","../reference/worker/src/index.ts"
  R-11,"Wasm memory-grow view safety","../reference/src/wasm.ts"
  R-12,"experiment/window/event correctness","../reference/src/distribution.ts"
  R-13,"browser/accessibility/CWV","../validation/reports/2026-07-17-ui-metaprogramming-pass-1.md"

not_claimed[9]:
  agent-can-yet-generate-complete-site
  reviewed-2000-page-corpus
  search-ranking-lift
  AI-citation-lift
  zero-volume-value
  conversion-revenue-lift
  Zig-Wasm-win
  Cloudflare-acceptance
  browser-beauty-acceptance

## next

next[10]{order,task,gate}:
  1,"ProjectInput + source/evidence/asset contracts","agent can normalize real business/brand package"
  2,"agent orchestration/checkpoint/repair lifecycle","full dry-run without hand-authored pages"
  3,"primary prototype semantics","explicit deterministic invariant"
  4,"compatibility calibration + frozen contexts","independent grades + reliability"
  5,"typed node paths","edge types + provenance + usefulness"
  6,"kernel benchmark","TS vs Zig native vs Wasm scalar/SIMD realistic matrices"
  7,"candidate funnel/optimizer","pruning + coverage + batch comparison"
  8,"content/UI/public-task packets","bounded generation with evidence and utility"
  9,"first cohort","20–40 noindex agent-generated pages"
  10,"field gate","browser/accessibility then matched publication"

## write_next

template:
  "create immutable YYYY-MM-DD-HHMM-<slug>.md; add newest handoffs row; reconcile current/decisions/proof/blockers/next; never edit prior timestamped files"