# Website Framework Durable Memory

format: TOON-oriented Markdown
status: active
scope: GTM-RESEARCH/website-framework
updated_at: 2026-07-17T20:45:00-04:00

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
  agent/ui-metaprogramming-pass-1,17,"draft; authority/source-level pass; executable orchestration/generation/relevance/runtime/field blocked",44e0a669096215ada26ce387a8db460a40dbc0a5,9ef48b97308e09d5a97f4978820255e3c8b53c7e,29623142884

note:
  "latest_validated_authority_head is the exact commit validated before this cumulative index update; MEMORY does not attempt impossible self-hash recording"

compiled{manifest_version,pages,indexable,prototypes,namespace,symbol_version,tests}:
  1.1.0,6,0,7,amtech-hyper-site-v1,1,"22/22"

product_boundary:
  "user operates through coding agent; agent forms project/vector/corpus and executes vector-derived PageGenerationJobs; current executable package begins near manifest/compiler end of lifecycle"

## handoffs

handoffs[9]{at,file,status,scope}:
  2026-07-17T20:45:00-04:00,2026-07-17-2045-agent-generation-workflow-ci-closure.md,current-proof,"authority head 44e0a66; workflow 29623142884 success"
  2026-07-17T20:30:00-04:00,2026-07-17-2030-agent-generation-jobs-workflow-validation.md,current,"agent at intake+generation; PageGenerationJobs; full workflow validation matrix"
  2026-07-17T20:05:00-04:00,2026-07-17-2005-agent-operated-generation-wasm-research.md,current-foundation,"agent-operated lifecycle; Wasm research; search-scale rejection boundary"
  2026-07-17T08:15:00-04:00,2026-07-17-0815-comprehensive-reorientation.md,current-code-review,"full codebase review; coverage qualification; runtime findings"
  2026-07-17T07:30:00-04:00,2026-07-17-0730-vector-native-reorientation.md,superseded-interpretation,"compiler corrections; overstates proposal coverage acceptance; retained immutable"
  2026-07-17T06:30:00-04:00,2026-07-17-ui-metaprogramming-pass-1.md,historical-source-pass,"browser-first CSS; semantic UI; bounded R3F"
  2026-07-17T02:00:00-04:00,../../../mvp-build/memory/2026-07-17-website-framework-phase-1-closure.md,historical,"Phase 1 spec closure"
  2026-07-17T00:55:00-04:00,../../../mvp-build/memory/2026-07-17-holographic-website-framework-v0.1.md,historical,"initial HRR/VSA Request Mirror"
  2026-07-17T00:22:00-04:00,../../../mvp-build/memory/2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md,historical,"GTM/source reconciliation"

## authority

read_order[18]{order,file,role}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scope identity"
  3,../../CODEGRAPH.md,"root map"
  4,../AGENTS.md,"operating/memory rules"
  5,../CODEGRAPH.md,"current product/source graph"
  6,../README.md,"current reality + workflow"
  7,MEMORY.md,"current durable state"
  8,2026-07-17-2045-agent-generation-workflow-ci-closure.md,"latest proof handoff"
  9,2026-07-17-2030-agent-generation-jobs-workflow-validation.md,"current architecture handoff"
  10,../20-agent-operated-vector-site-generation-and-wasm.md,"product/use/Wasm model"
  11,../21-vector-to-generation-job-compiler.md,"vector -> agent generation jobs"
  12,../22-agent-operated-framework-workflow-validation-matrix.md,"whole-system validation/pass/fail matrix"
  13,../18-vector-node-path-web-framework-model.md,"three planes"
  14,../19-vector-native-corrections-and-csi-validation.md,"academic validation"
  15,../validation/reports/2026-07-17-agent-operated-generation-workflow-reorientation.md,"current architecture report"
  16,../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md,"full findings"
  17,../validation/reports/2026-07-17-vector-native-corrections.md,"exact compiler proof"
  18,../site-manifest.yaml,"single compiled-project/corpus authority"

## architecture

interface:
  "user -> coding agent -> ProjectInput/ledgers -> independent contexts -> ontology/vector space -> candidate coordinates -> selected corpus -> PageGenerationJobs -> specialized agent passes -> manifest/compiler -> emissions"

agent_roles[2]{stage,work}:
  formation,"inspect, normalize, research, context corpus, ontology, candidate program, selection"
  generation,"research, concept, content, utility/task, SEO/graph, UI, critic, repair per accepted job"

workflow:
  "init -> inspect/doctor -> research -> plan -> generate -> dev/preview -> validate -> build -> publish -> measure"

planes[3]{plane,state}:
  publication,"all-prototype compiler implemented; intake/candidate/job/generation orchestration absent"
  navigation,"untyped similarity page IDs only"
  interaction,"public AI Employee task IR absent"

compute:
  "typed pruning -> lexical/semantic/facet/graph prefilter -> bounded multi-prototype vector scoring -> facility-location/CSI selection -> generation jobs -> reviewed stable nodes"

wasm:
  "candidate portable SIMD math kernel for binding/scoring/top-k/duplicates/facility/CSI/parity; native Zig control may win locally; canonical pages remain static and Wasm-free"

## decisions

decisions[23]{id,decision,ref}:
  D01,"coding agent is primary framework interface","../20-agent-operated-vector-site-generation-and-wasm.md"
  D02,"agent is integral at project formation and page generation","../21-vector-to-generation-job-compiler.md"
  D03,"user supplies business/brand/assets/source/goals; agent generates site program","../README.md"
  D04,"manifest is sole compiled-project/corpus authority, not user-facing authoring surface","../site-manifest.yaml"
  D05,"accepted vector coordinates compile to typed PageGenerationJobs","../21-vector-to-generation-job-compiler.md"
  D06,"specialized agent passes write/build content, utility, SEO/graph, UI, criticism, repair","../21-vector-to-generation-job-compiler.md"
  D07,"framework operation follows init/inspect/research/plan/generate/preview/validate/build/publish/measure","../22-agent-operated-framework-workflow-validation-matrix.md"
  D08,"every feature/workflow/algorithm/UX/UI/runtime stage requires validation+pass+fail vectors","../22-agent-operated-framework-workflow-validation-matrix.md"
  D09,"HTML/UI are emissions","../README.md"
  D10,"vector chunks are reusable prospect situations, not people","../18-vector-node-path-web-framework-model.md"
  D11,"context attributes belong only when they change useful output and pass policy","../21-vector-to-generation-job-compiler.md"
  D12,"namespace/symbol_version alter actual symbols","../reference/src/benchmark.ts"
  D13,"all prototypes survive packed compilation","../reference/src/framework.ts"
  D14,"coverage mechanics compare current vs proposed corpus","../reference/src/manifest.ts"
  D15,"coverage mechanics are not relevance acceptance","../validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md"
  D16,"CSI is batch/split control, not single-page oracle","../reference/src/csi.ts"
  D17,"context paper is baseline, not SEO validation","../19-vector-native-corrections-and-csi-validation.md"
  D18,"page/node-path/public-session are separate planes","../18-vector-node-path-web-framework-model.md"
  D19,"UI static/browser-first; 3D optional/noncanonical","2026-07-17-ui-metaprogramming-pass-1.md"
  D20,"Wasm requires repeated data-parallel workload and portability, not merely vectors","../20-agent-operated-vector-site-generation-and-wasm.md"
  D21,"dual kernel controls: TS oracle, Zig native, Wasm scalar/SIMD","../20-agent-operated-vector-site-generation-and-wasm.md"
  D22,"page count is not objective; held-out useful coverage and distinct utility are","../AGENTS.md"
  D23,"timestamped memories immutable","../AGENTS.md"

## proof

compiler_proof{head,run,tests,pages,indexable,prototypes,artifact}:
  9ef48b97308e09d5a97f4978820255e3c8b53c7e,29576487817,"22/22",6,0,7,sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d

authority_proof{head,run,result,stages}:
  44e0a669096215ada26ce387a8db460a40dbc0a5,29623142884,success,"install; tests; manifest emit; UI emit; browser check; R3F build; artifacts"

passed[5]:
  namespaced-versioned-symbols
  all-prototype-packed-parity
  source-order-stable-build-space-hashes
  all-prototype-agent-context
  mechanical-distinct-vs-duplicate-and-csi-fixtures

architecture_authority[4]:
  agent-at-formation-and-generation
  vector-to-PageGenerationJob-bridge
  framework-operator-lifecycle
  27-feature-workflow-validation-matrix

partial[2]:
  proposal-coverage,"computed; shifted cosine + self-supplied contexts"
  primary-page-vector,"all prototypes preserved; primary alias implicit"

research_only[5]:
  agent-operated-project-generation
  PageGenerationJob-compiler
  specialized-agent-runner
  Zig-native-vs-Wasm-performance
  search-scale-corpus-value

## academic_platform

sources[12]{id,url,use,boundary}:
  Kong-2023,https://arxiv.org/abs/2309.05113,"explicit context-doc relevance + graded labels","not HRR/corpus/search/revenue proof"
  Kleyko-2021,https://arxiv.org/abs/2112.15424,"HDC/VSA compositional computing","not SEO/UI/commercial proof"
  Iyer-2026,https://arxiv.org/abs/2605.24779,"CSI batch/split balance","preprint; no single-page authority"
  W3C-Wasm,https://www.w3.org/TR/wasm-core/,"portable low-level SIMD execution","not automatic speedup"
  Cloudflare-Wasm,https://developers.cloudflare.com/workers/runtime-apis/webassembly/,"Workers SIMD + single-thread boundary","not production acceptance"
  R3F-scaling,https://r3f.docs.pmnd.rs/advanced/scaling-performance,"demand rendering/resource reuse","not visual-value proof"
  Vite,https://vite.dev/guide/,"scaffold/dev/build framework lifecycle","ergonomic baseline only"
  Next,https://nextjs.org/docs/app/getting-started/installation,"scaffold/dev/build framework lifecycle","ergonomic baseline only"
  Astro,https://docs.astro.build/en/install-and-setup/,"scaffold/dev/build framework lifecycle","ergonomic baseline only"
  Playwright,https://playwright.dev/docs/best-practices,"user-facing isolated browser tests","not accessibility completion"
  Google-AI,https://developers.google.com/search/docs/fundamentals/using-gen-ai-content,"automation allowed when useful","scaled low-value pages fail"
  Google-AI-Search,https://developers.google.com/search/docs/fundamentals/ai-optimization-guide,"avoid page per query variation","platform constraint not design objective"

## blockers

p0[9]{id,item,ref}:
  R-00,"ProjectInput/source/evidence/asset contracts","../22-agent-operated-framework-workflow-validation-matrix.md"
  R-01,"independent ContextCorpus + frozen splits","../22-agent-operated-framework-workflow-validation-matrix.md"
  R-02,"primary prototype semantics","../reference/src/manifest.ts; ../reference/src/framework.ts"
  R-03,"shifted-cosine compatibility calibration","../reference/src/manifest.ts"
  R-04,"typed semantic graph paths","../18-vector-node-path-web-framework-model.md"
  R-05,"candidate PageCoordinate compiler + staged funnel","../21-vector-to-generation-job-compiler.md"
  R-06,"SelectedCorpusPlan + PageGenerationJob compiler","../21-vector-to-generation-job-compiler.md"
  R-07,"specialized agent runner/checkpoints/repair","../21-vector-to-generation-job-compiler.md"
  R-08,"dev/preview/corpus-review framework UX","../22-agent-operated-framework-workflow-validation-matrix.md"

p1[8]{id,item,ref}:
  R-09,"realistic TS/Zig-native/Wasm benchmark harness","../reference/src/wasm.ts; ../reference/zig/kernel.zig"
  R-10,"learned semantic baseline","../reference/src/benchmark.ts"
  R-11,"public employee task IR","../../../mvp-build/docs/public-interaction-standard.md"
  R-12,"resolver identity/mask/prototype support","../reference/src/resolver.ts"
  R-13,"Worker/TS resolver parity","../reference/worker/src/index.ts"
  R-14,"Wasm memory-grow view safety","../reference/src/wasm.ts"
  R-15,"experiment/window/event correctness","../reference/src/distribution.ts"
  R-16,"browser/accessibility/CWV","../validation/reports/2026-07-17-ui-metaprogramming-pass-1.md"

not_claimed[10]:
  agent-can-yet-generate-complete-site
  generation-job-compiler-implemented
  reviewed-2000-page-corpus
  search-ranking-lift
  AI-citation-lift
  zero-volume-value
  conversion-revenue-lift
  Zig-Wasm-win
  Cloudflare-acceptance
  browser-beauty-acceptance

## next

next[12]{order,task,gate}:
  1,"ProjectInput + source/evidence/asset contracts","agent normalizes real business/brand package"
  2,"independent ContextCorpus + frozen splits","non-self-confirming opportunity/relevance authority"
  3,"primary prototype semantics","explicit deterministic invariant"
  4,"compatibility calibration","independent grades + reliability"
  5,"typed node paths","edge types + provenance + usefulness"
  6,"candidate PageCoordinate compiler","coherent conjunctions + hard pruning"
  7,"SelectedCorpusPlan + PageGenerationJob compiler","accepted vectors become executable jobs"
  8,"specialized agent runner/checkpoints/repair","traceable bounded generation"
  9,"dev/preview/corpus-review UX","framework-like operation without internal edits"
  10,"kernel benchmark","TS vs Zig native vs Wasm scalar/SIMD realistic loops"
  11,"first cohort","20–40 noindex agent-generated pages after gates"
  12,"field gate","browser/accessibility then matched publication"

## write_next

template:
  "create immutable YYYY-MM-DD-HHMM-<slug>.md; add newest handoffs row; reconcile current/decisions/proof/blockers/next; never edit prior timestamped files"