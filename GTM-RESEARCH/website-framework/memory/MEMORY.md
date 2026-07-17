# Website Framework Durable Memory

format: TOON-oriented Markdown
status: active
scope: GTM-RESEARCH/website-framework
updated_at: 2026-07-17T07:30:00-04:00

## protocol

memory_model{index,handoffs,mutation}:
  "memory/MEMORY.md","memory/YYYY-MM-DD-HHMM-<slug>.md","append new handoff; update index/current facts; never overwrite timestamped handoffs"

rules[8]:
  read-MEMORY-before-historical-files
  read-newest-timestamped-handoff-next
  timestamped-handoffs-are-immutable
  never-repurpose-or-compress-away-prior-handoff
  update-this-index-newest-first
  use-file-reference-heavy-TOON-style-summaries
  do-not-duplicate-source-or-validation-report-content
  TOON-is-context-encoding-not-canonical-application-data

status_vocab[5]{term,meaning}:
  source-wired,"source/schema exists; list exact checks"
  source-level-pass,"strict build/tests/emissions pass on exact commit"
  provider-accepted,"real external provider proof exists"
  field-accepted,"deployed browser/search/commercial evidence passes declared gate"
  pending,"not run, blocked, or missing proof"

## current

state{branch,pr,status,head,validated_head,workflow_run}:
  agent/ui-metaprogramming-pass-1,17,"source-level-pass; draft; field pending",96148ad690bdbad28cce1339b5f034fc139e4ebd,9ef48b97308e09d5a97f4978820255e3c8b53c7e,29576487817

product_boundary:
  "vector-native offline corpus compiler + deterministic static/UI emissions; typed navigation paths and public AI Employee execution remain separate incomplete planes"

compiled_truth{manifest_version,pages,indexable,prototypes,namespace,symbol_version,tests}:
  1.1.0,6,0,7,amtech-hyper-site-v1,1,"22/22"

## handoffs

handoffs[5]{at,file,status,scope}:
  2026-07-17T07:30:00-04:00,2026-07-17-0730-vector-native-reorientation.md,source-level-pass,"deep review corrections; academic reorientation; vector-native compiler; CSI; memory protocol"
  2026-07-17T06:30:00-04:00,2026-07-17-ui-metaprogramming-pass-1.md,source-level-pass-at-recorded-head,"browser-first CSS; semantic UI renderer; optional bounded R3F"
  2026-07-17T02:00:00-04:00,../../../mvp-build/memory/2026-07-17-website-framework-phase-1-closure.md,historical,"Phase 1 research/spec closure; implementation pending at that time"
  2026-07-17T00:55:00-04:00,../../../mvp-build/memory/2026-07-17-holographic-website-framework-v0.1.md,historical,"initial HRR/VSA Request Mirror Lab direction"
  2026-07-17T00:22:00-04:00,../../../mvp-build/memory/2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md,historical,"GTM/source reconciliation and website frontier"

note:
  "older mvp-build memories remain product/repo history; website-framework/memory owns this subtree's ongoing handoffs from this point"

## authority

read_order[15]{order,file,reason}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scoped identity"
  3,../../CODEGRAPH.md,"root source map"
  4,../AGENTS.md,"scoped rules + memory protocol"
  5,../CODEGRAPH.md,"current framework map"
  6,../README.md,"current reality/proof/next"
  7,MEMORY.md,"current durable state"
  8,2026-07-17-0730-vector-native-reorientation.md,"newest immutable handoff"
  9,../18-vector-node-path-web-framework-model.md,"three-plane model"
  10,../19-vector-native-corrections-and-csi-validation.md,"academic + validation authority"
  11,../validation/reports/2026-07-17-vector-native-corrections.md,"exact correction proof"
  12,../site-manifest.yaml,"single corpus authority"
  13,../reference/README.md,"package map"
  14,../reference/UI-DESIGN-SYSTEM-HANDOFF.md,"UI consumer contract"
  15,../00-scientific-and-feasibility-validation.md,"historical research when needed"

## architecture

planes[3]{plane,state,authority}:
  publication,"vector-native source path implemented; external relevance/field pending","../reference/src/manifest.ts; ../reference/src/framework.ts"
  navigation,"raw untyped similarity links only","../18-vector-node-path-web-framework-model.md"
  interaction,"public employee task surface absent from website IR","../../../mvp-build/docs/public-interaction-standard.md"

pipeline:
  "approved source + explicit context cases -> unified manifest -> namespace/version symbols -> all prototypes -> computed coverage + neighbors -> evidence modules -> SiteSource -> PageIR -> packed prototype arrays + CSR -> HTML/schema/sitemap/instruction/UI/agent emissions"

## decisions

decisions[12]{id,decision,ref}:
  D01,"site-manifest.yaml is the only corpus authority","../site-manifest.yaml"
  D02,"HTML is an emission; vectors/evidence/modules/dependencies are authoritative","../README.md"
  D03,"vector chunks describe reusable situations, not hidden person profiles","../18-vector-node-path-web-framework-model.md"
  D04,"namespace + symbol_version are part of actual symbol identity","../reference/src/benchmark.ts"
  D05,"every declared prototype survives packed compilation","../reference/src/framework.ts"
  D06,"proposal admission uses computed marginal coverage, not prose","../reference/src/manifest.ts"
  D07,"proposal contexts must be explicit, sourced, weighted, and noindex","../site-manifest.yaml"
  D08,"CSI is batch/split control, not single-page novelty oracle","../reference/src/csi.ts"
  D09,"context-ranking paper is baseline, not validation of corpus SEO","../19-vector-native-corrections-and-csi-validation.md"
  D10,"static canonical page, node path, and public employee session are separate planes","../18-vector-node-path-web-framework-model.md"
  D11,"UI is browser-first static semantic rendering; 3D optional/noncanonical","2026-07-17-ui-metaprogramming-pass-1.md"
  D12,"timestamped memories are immutable; only MEMORY.md is cumulative","../AGENTS.md"

## proof

proofs[2]{kind,ref,facts}:
  compiler-ui-ci,"run:29576487817 head:9ef48b97308e09d5a97f4978820255e3c8b53c7e","22/22; manifest/UI/browser/R3F pass; 6 pages; 0 indexable; 7 prototypes"
  emissions,"artifact sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d","build ae1695...; space 934ac0...; namespace amtech-hyper-site-v1; symbols v1"

passed[6]:
  namespaced-versioned-symbols
  all-prototype-packed-parity
  source-order-stable-build-and-space-hashes
  all-prototype-agent-context
  computed-distinct-proposal-pass-and-duplicate-fail
  csi-head-tail-fixture-rejects-isolated-noise

## research

papers[3]{paper,url,use,boundary}:
  Kong-et-al-2023,https://arxiv.org/abs/2309.05113,"explicit context-document compatibility; graded relevance; lexical+semantic controls","not HRR/corpus/search/revenue proof"
  Kleyko-et-al-2021,https://arxiv.org/abs/2112.15424,"HDC/VSA applications and compositional distributed computation","not SEO/UI/commercial proof"
  Iyer-2026,https://arxiv.org/abs/2605.24779,"CSI batch/split balance and robust outlier suppression","new preprint; assumptions unverified; not single proposal gate"

## open

blockers[9]{priority,item,owner_files}:
  P0,"explicit primary_prototype_id or removal of primary alias authority","../site-manifest.yaml; ../reference/src/manifest.ts; ../reference/src/framework.ts"
  P0,"typed semantic edge/path schema and validation","../reference/src/manifest.ts; ../18-vector-node-path-web-framework-model.md"
  P0,"independent graded query/context/document benchmark","../19-vector-native-corrections-and-csi-validation.md"
  P1,"learned semantic baseline and held-out/out-of-domain evaluation","../reference/src/benchmark.ts"
  P1,"public AI Employee task-surface IR","../../../mvp-build/docs/public-interaction-standard.md; ../reference/src/framework.ts"
  P1,"browser visual/accessibility/CWV proof","../validation/reports/2026-07-17-ui-metaprogramming-pass-1.md"
  P1,"field experiment/window and event identity correctness","../reference/src/distribution.ts"
  P2,"ontology allowed-values/merge governance","../site-manifest.yaml"
  P2,"claim-evidence applicability/freshness semantics","../reference/src/framework.ts"

not_claimed[8]:
  reviewed-2000-page-corpus
  Google-or-Bing-ranking-lift
  AI-citation-lift
  zero-volume-strategy-value
  conversion-or-revenue-lift
  Zig-Wasm-performance-win
  Cloudflare-production-acceptance
  invariably-beautiful-browser-output

## next

next[8]{order,task,acceptance}:
  1,"primary prototype semantics","explicit deterministic schema + parity/reorder tests"
  2,"typed graph paths","edge type/rationale/eligibility + human usefulness fixture"
  3,"external relevance corpus","independent cases + Perfect/Good/Fair/Bad judgments + disagreement"
  4,"ranking arms","lexical + learned semantic + facets + graph + HRR + hybrid"
  5,"selection arms","facility location + random/stratified + diversity + CSI"
  6,"public task surface","static fallback + secure controls + stream + artifact + approval/proof"
  7,"browser/accessibility","Chromium/Firefox/WebKit + keyboard/zoom/tree + budgets"
  8,"first field cohort","20–40 noindex proposals; human review; separate publication gate"

## write_next

template:
  "create memory/YYYY-MM-DD-HHMM-<slug>.md with metadata, refs[], changes[], proof{}, risks[], next[]; then prepend one handoffs row and reconcile current/open/next here"
