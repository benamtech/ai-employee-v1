import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { executeFrameworkProject, parseFrameworkManifest, prepareFrameworkProject } from "../dist/index.js";

const [command = "doctor", manifestPath = "../site-manifest.yaml", projectModulePath = "fixtures/orchestration-fixture.mjs", outputPath = "generated-framework"] = process.argv.slice(2);
const allowed = new Set(["doctor", "plan", "generate", "preview", "validate"]);
if (!allowed.has(command)) throw new Error(`unknown framework command ${command}; expected ${[...allowed].join(", ")}`);
const manifest = parseFrameworkManifest(readFileSync(manifestPath, "utf8"));
const projectModule = await import(pathToFileURL(resolve(projectModulePath)).href);
const createInput = projectModule.createFrameworkInput ?? projectModule.createOrchestrationFixture;
if (typeof createInput !== "function") throw new Error("project module must export createFrameworkInput(manifest)");
const input = await createInput(manifest);
const prepared = prepareFrameworkProject(input);

if (command === "doctor") {
  print({
    command,
    projectId: prepared.project.input.id,
    projectHash: prepared.project.projectHash,
    missingInformation: prepared.project.missingInformation,
    contradictions: prepared.project.contradictions,
    sourceCount: prepared.project.sourceLedger.length,
    evidenceCount: prepared.project.evidenceLedger.length,
    assetCount: prepared.project.assetLedger.length,
    validation: summarizeReports([prepared.project.validation, prepared.contextCorpus.validation, prepared.calibration.validationReport]),
  });
  process.exit(0);
}
if (command === "plan") {
  print({
    command,
    projectId: prepared.project.input.id,
    preparedHash: prepared.preparedHash,
    contexts: prepared.contextCorpus.cases.length,
    splitHashes: prepared.contextCorpus.splitHashes,
    candidates: prepared.coordinates.length,
    selected: prepared.selectedCorpus.selected.map((item) => item.id),
    rejected: prepared.selectedCorpus.rejected,
    validationCoverage: prepared.selectedCorpus.validationCoverage,
    testCoverage: prepared.selectedCorpus.testCoverage,
    jobs: prepared.generationJobs.map((item) => item.jobId),
    validation: summarizeReports(prepared.validationReports),
  });
  process.exit(0);
}

const createExecutor = projectModule.createAgentPassExecutor ?? projectModule.createFixtureExecutor;
if (typeof createExecutor !== "function") throw new Error(`${command} requires project module to export createAgentPassExecutor()`);
const executor = await createExecutor();
const executed = await executeFrameworkProject(prepared, executor, { maximumRepairAttempts: 1 });
if (command === "generate") {
  print({ command, executionHash: executed.executionHash, runs: executed.generationRuns.map((run) => ({ jobId: run.jobId, status: run.status, checkpoints: run.checkpointHashes.length, hardFailures: run.validation.hardFailures, hardPending: run.validation.hardPending })) });
  if (executed.generationRuns.some((run) => run.status === "rejected" || !run.validation.passes)) process.exitCode = 1;
  process.exit();
}
if (command === "validate") {
  const validation = summarizeReports(executed.preview.validations);
  const rejectedRuns = executed.generationRuns.filter((run) => run.status === "rejected").map((run) => run.jobId);
  const passes = validation.hardFailures.length === 0 && validation.hardPending.length === 0 && rejectedRuns.length === 0;
  print({ command, passes, rejectedRuns, ...validation });
  if (!passes) process.exitCode = 1;
  process.exit();
}
await emit(outputPath, executed);
print({ command, outputPath: resolve(outputPath), executionHash: executed.executionHash, previewHash: executed.preview.previewHash, pages: executed.preview.pages.length, rejected: executed.preview.rejectedPages.length, validationPasses: executed.preview.validation.passes });

async function emit(directory, executed) {
  const root = resolve(directory);
  await mkdir(root, { recursive: true });
  const files = {
    "project.json": executed.project,
    "context-corpus.json": executed.contextCorpus,
    "calibration.json": executed.calibration,
    "coordinates.json": executed.coordinates,
    "selected-corpus.json": executed.selectedCorpus,
    "jobs.json": executed.generationJobs,
    "runs.json": executed.generationRuns,
    "preview.json": executed.preview,
  };
  for (const [name, value] of Object.entries(files)) await writeFile(resolve(root, name), `${JSON.stringify(value, null, 2)}\n`);
  await writeFile(resolve(root, "index.html"), executed.previewHtml);
}
function summarizeReports(reports) {
  const hardFailures = reports.flatMap((report) => report.hardFailures.map((attributeId) => ({ scope: report.scope, attributeId })));
  const hardPending = reports.flatMap((report) => report.hardPending.map((attributeId) => ({ scope: report.scope, attributeId })));
  const softFailures = reports.flatMap((report) => report.softFailures.map((attributeId) => ({ scope: report.scope, attributeId })));
  const softPending = reports.flatMap((report) => report.softPending.map((attributeId) => ({ scope: report.scope, attributeId })));
  return { hardFailures, hardPending, softFailures, softPending, reportHashes: reports.map((report) => [report.scope, report.reportHash]) };
}
function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
