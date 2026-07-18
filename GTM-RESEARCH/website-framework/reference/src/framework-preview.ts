import { sha256 } from "./core.js";
import type { ContextCorpus } from "./context-corpus.js";
import type { SelectedCorpusPlan, RejectedCoordinate } from "./corpus-plan.js";
import type { NormalizedProject } from "./project-input.js";
import type { GenerationRunResult, PageGenerationJob } from "./page-generation.js";
import { PREVIEW_VALIDATION } from "./page-coordinate.js";
import { buildValidationReport, finding, type ValidationReport } from "./validation-contracts.js";

export interface FrameworkPreviewModel {
  project: { id: string; hash: string; businessPurpose: string; brandName: string };
  corpus: { id: string; hash: string; counts: Record<string, number> };
  plan: { hash: string; selectedCount: number; rejectedCount: number; objective: number; validationCoverage: number; testCoverage: number };
  pages: readonly { id: string; route: string; question: string; primaryPrototypeId: string; prototypeCount: number; generationStatus: "pending" | "completed" | "rejected"; hardFailures: readonly string[] }[];
  rejectedPages: readonly RejectedCoordinate[];
  validations: readonly ValidationReport[];
  validation: ValidationReport;
  previewHash: string;
}

export function buildFrameworkPreview(
  project: NormalizedProject,
  corpus: ContextCorpus,
  plan: SelectedCorpusPlan,
  jobs: readonly PageGenerationJob[],
  runs: readonly GenerationRunResult[],
  extra: readonly ValidationReport[] = [],
): FrameworkPreviewModel {
  const runByJob = new Map(runs.map((item) => [item.jobId, item]));
  const jobByPage = new Map(jobs.map((item) => [item.pageId, item]));
  const pages = plan.selected.map((coordinate) => {
    const job = jobByPage.get(coordinate.id);
    const run = job ? runByJob.get(job.jobId) : undefined;
    const generationStatus: "pending" | "completed" | "rejected" = run?.status ?? "pending";
    return { id: coordinate.id, route: coordinate.route, question: coordinate.canonicalQuestion, primaryPrototypeId: coordinate.primaryPrototypeId, prototypeCount: coordinate.prototypes.length, generationStatus, hardFailures: run?.validation.hardFailures ?? [] };
  }).sort((left, right) => left.id.localeCompare(right.id));
  const rejectedPages = plan.rejected.map((item) => ({ id: item.id, reasons: [...item.reasons] }));
  const base = [project.validation, corpus.validation, plan.validation, ...jobs.map((item) => item.validation), ...runs.map((item) => item.validation), ...extra];
  const counts = corpus.cases.reduce<Record<string, number>>((output, item) => { output[item.split] = (output[item.split] ?? 0) + 1; return output; }, {});
  const runnerState = runs.length === 0 ? "pending" : runs.length === jobs.length && runs.every((run) => run.status === "completed") ? "pass" : "fail";
  const validation = buildValidationReport(`preview:${project.input.id}`, PREVIEW_VALIDATION, [
    finding("coordinate.primary", pages.every((item) => Boolean(item.primaryPrototypeId)) ? "pass" : "fail", "primary identity visible"),
    finding("coordinate.eligibility", "pass", "selected corpus consumed"),
    finding("coordinate.specificity", pages.every((item) => Boolean(item.question.trim())) ? "pass" : "fail", "questions visible"),
    finding("selection.coverage", plan.validation.passes ? "pass" : "fail", "coverage status visible"),
    finding("selection.balance", "pass", "selected/rejected counts visible"),
    finding("job.contract", jobs.length === pages.length ? "pass" : "fail", `${jobs.length}/${pages.length} pages have jobs`),
    finding("runner.checkpoints", runnerState, runs.length === 0 ? "generation has not run" : `${runs.filter((run) => run.status === "completed").length}/${jobs.length} runs completed`),
    finding("preview.operator", rejectedPages.every((item) => item.reasons.length > 0) ? "pass" : "fail", `${rejectedPages.length} rejected coordinates have reasons`),
  ]);
  const validations = [...base, validation];
  const canonical = {
    project: { id: project.input.id, hash: project.projectHash, businessPurpose: project.input.business.purpose, brandName: project.input.brand.name },
    corpus: { id: corpus.id, hash: corpus.corpusHash, counts },
    plan: { hash: plan.planHash, selectedCount: plan.selected.length, rejectedCount: plan.rejected.length, objective: plan.objective, validationCoverage: plan.validationCoverage, testCoverage: plan.testCoverage },
    pages,
    rejectedPages,
    validations: validations.map((report) => ({ scope: report.scope, hash: report.reportHash, passes: report.passes, hardFailures: report.hardFailures, pending: report.pending })),
    previewValidationHash: validation.reportHash,
  };
  return { project: canonical.project, corpus: canonical.corpus, plan: canonical.plan, pages, rejectedPages, validations, validation, previewHash: sha256(JSON.stringify(canonical)) };
}

export function renderFrameworkPreviewHtml(preview: FrameworkPreviewModel): string {
  const rows = preview.pages.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td><code>${escapeHtml(item.route)}</code></td><td>${escapeHtml(item.question)}</td><td>${escapeHtml(item.primaryPrototypeId)}</td><td>${item.prototypeCount}</td><td>${escapeHtml(item.generationStatus)}</td><td>${escapeHtml(item.hardFailures.join(", ") || "none")}</td></tr>`).join("");
  const rejected = preview.rejectedPages.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.reasons.join("; "))}</td></tr>`).join("");
  const reports = preview.validations.map((report) => `<tr><td>${escapeHtml(report.scope)}</td><td>${report.passes ? "pass" : "fail"}</td><td>${escapeHtml(report.hardFailures.join(", ") || "none")}</td><td>${escapeHtml(report.pending.join(", ") || "none")}</td><td><code>${escapeHtml(report.reportHash.slice(0, 16))}</code></td></tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Website Framework Project Preview</title><style>body{font-family:system-ui,sans-serif;margin:0;background:#f7f9fc;color:#111}main{max-width:1200px;margin:auto;padding:clamp(1rem,4vw,2rem)}section{background:#fff;border:1px solid #dbe3ef;border-radius:16px;padding:clamp(1rem,3vw,1.5rem);margin:1rem 0;overflow:auto}table{width:100%;border-collapse:collapse;min-width:720px}caption{text-align:left;font-weight:700;margin-bottom:.75rem}th,td{text-align:left;padding:.625rem;border-bottom:1px solid #e7edf5;vertical-align:top}th{background:#f7f9fc}.metric{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.75rem}.metric div{border:1px solid #e7edf5;border-radius:12px;padding:.75rem}code{overflow-wrap:anywhere}</style></head><body><main><h1>${escapeHtml(preview.project.brandName)} website framework preview</h1><p>${escapeHtml(preview.project.businessPurpose)}</p><section class="metric" aria-label="Corpus summary"><div><strong>Selected</strong><br>${preview.plan.selectedCount}</div><div><strong>Rejected</strong><br>${preview.plan.rejectedCount}</div><div><strong>Validation coverage</strong><br>${preview.plan.validationCoverage.toFixed(3)}</div><div><strong>Test coverage</strong><br>${preview.plan.testCoverage.toFixed(3)}</div></section><section><h2>Page generation jobs</h2><table><caption>Selected page jobs and generation state</caption><thead><tr><th scope="col">Page</th><th scope="col">Route</th><th scope="col">Question</th><th scope="col">Primary prototype</th><th scope="col">Prototypes</th><th scope="col">Status</th><th scope="col">Hard failures</th></tr></thead><tbody>${rows}</tbody></table></section><section><h2>Rejected coordinates</h2><table><caption>Candidate coordinates not selected</caption><thead><tr><th scope="col">Candidate</th><th scope="col">Reasons</th></tr></thead><tbody>${rejected}</tbody></table></section><section><h2>Validation reports</h2><table><caption>Validation, failure, pending, and hash state</caption><thead><tr><th scope="col">Scope</th><th scope="col">Status</th><th scope="col">Hard failures</th><th scope="col">Pending</th><th scope="col">Hash</th></tr></thead><tbody>${reports}</tbody></table></section></main></body></html>`;
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }
