# 2026-07-17 20:30 — Agent Generation Jobs and Framework Workflow Validation

format: TOON-oriented Markdown
status: architecture-authority-pass; implementation pending
branch: agent/ui-metaprogramming-pass-1

refs[8]{file,role}:
  ../20-agent-operated-vector-site-generation-and-wasm.md,"product/use/Wasm model"
  ../21-vector-to-generation-job-compiler.md,"accepted vectors -> agent page-generation jobs"
  ../22-agent-operated-framework-workflow-validation-matrix.md,"whole-system validation/pass/fail authority"
  ../AGENTS.md,"scoped operating invariants"
  ../README.md,"product reality and workflow"
  ../CODEGRAPH.md,"authority/generation graph"
  ../validation/reports/2026-07-17-agent-operated-generation-workflow-reorientation.md,"session report"
  MEMORY.md,"cumulative current-state index"

correction:
  "coding agent is first-class at project formation and during every page-generation job; vector math defines/selects/validates the page program, while agents research, write, build utilities/tasks, generate SEO/graph/UI state, criticize, and repair"

workflow:
  "init -> inspect/doctor -> research -> plan -> generate -> dev/preview -> validate -> build -> publish -> measure"

pipeline:
  "ProjectInput + ledgers -> independent ContextCorpus -> ontology/vector space -> candidate PageCoordinates -> SelectedCorpusPlan -> PageGenerationJobs -> specialized agent passes -> manifest/SiteSource/PageIR -> emissions"

changes[6]:
  C01,"added 21 vector-to-generation job compiler authority"
  C02,"added 22 workflow/feature/algorithm/UX/DX/UI/runtime validation matrix"
  C03,"updated AGENTS: agent writes/builds pages from accepted jobs"
  C04,"updated README: agent at intake and generation; target framework workflow"
  C05,"updated CODEGRAPH: generation-job and specialized-agent bridge before current compiler"
  C06,"added validation report and framework-ergonomic research references"

validation_matrix:
  "27 feature/workflow vectors; each records purpose/effect, user contract, agent/dev contract, baseline, validation vector, pass, fail, current state"

research[9]{id,use}:
  Kong-2309.05113,"context-doc compatibility and graded relevance"
  Kleyko-2112.15424,"HDC/VSA compositional representation"
  CSI-2605.24779,"batch/split head-tail and outlier research arm"
  W3C-Wasm,"portable SIMD execution semantics"
  Cloudflare-Wasm,"edge SIMD/single-thread constraints"
  R3F-scaling,"demand-render/resource-reuse UI constraint"
  Vite-Next-Astro,"expected init/dev/build framework lifecycle"
  Playwright,"user-facing isolated multi-browser validation"
  Google-AI-guidance,"scaled low-value/query-variation hard boundary"

current_state:
  "architecture and validation authority coherent; executable package still starts near manifest/compiler end of lifecycle"

not_implemented[8]:
  ProjectInput-ledgers
  independent-context-corpus
  candidate-coordinate-compiler
  selected-corpus-plan
  PageGenerationJob-compiler
  specialized-agent-runner
  preview-corpus-review-UX
  real-end-to-end-site-generation

risks[5]:
  R01,"demographic/context axes can become stereotyped or regulated targeting without governance"
  R02,"agent may self-confirm page opportunity without independent contexts"
  R03,"complexity may leak to user if framework workflow/diagnostics are poor"
  R04,"generation jobs may degrade into generic prompts if typed bindings are incomplete"
  R05,"page count may substitute for held-out coverage and distinct utility"

next[8]{order,task}:
  1,"ProjectInput + source/evidence/asset contracts"
  2,"independent ContextCorpus + frozen splits"
  3,"primary prototype + calibrated compatibility + typed paths"
  4,"candidate PageCoordinate compiler and staged funnel"
  5,"SelectedCorpusPlan + PageGenerationJob compiler"
  6,"specialized agent runner/checkpoints/repair"
  7,"dev/preview/corpus-review UX"
  8,"first 20–40 noindex agent-generated cohort after gates"

proof:
  "documentation/authority changes only; exact-head CI pending at handoff creation"