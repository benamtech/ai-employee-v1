import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { executeFrameworkProject, parseFrameworkManifest, prepareFrameworkProject } from "../dist/index.js";

const [command = "doctor", manifestPath = "../site-manifest.yaml", projectModulePath = "fixtures/orchestration-fixture.mjs", outputPath = "generated-framework"] = process.argv.slice(2);
const allowed = new Set(["doctor", "plan", "generate", "preview", "validate", "build"]);
if (!allowed.has(command)) throw new Error(`unknown framework command ${command}; expected ${[...allowed].join(", ")}`);
const manifest = parseFrameworkManifest(readFileSync(manifestPath, "utf8"));
const projectModule = await import(pathToFileURL(resolve(projectModulePath)).href);
if (typeof projectModule.createOrchestrationFixture !== "function") throw new Error("project module must export createOrchestrationFixture(manifest)");
const input = projectModule.createOrchestrationFixture(manifest);
const prepared = prepareFrameworkProject(input);

if (command === "doctor") {
  print({ command, projectId: prepared.project.input.id, projectHash: prepared.project.projectHash, missingInformation: prepared.project.missingInformation, contradictions: prepared.project.contradictions, sourceCount: prepared.project.sourceLedger.length, assetCount: prepared.project.assetLedger.length, validationPasses: prepared.project.validation.passes });
  process.exit(0);
}
if (command === "plan") {
  print({ command, projectId: prepared.project.input.id, preparedHash: prepared.preparedHash, contexts: prepared.contextCorpus.cases.length, candidates: prepared.coordinates.length, selected: prepared.selectedCorpus.selected.map((item) => item.id), rejected: prepared.selectedCorpus.rejected, validationCoverage: prepared.selectedCorpus.validationCoverage, testCoverage: prepared.selectedCorpus.testCoverage, jobs: prepared.generationJobs.map((item) => item.jobId) });
  process.exit(0);
}
if (typeof projectModule.createFixtureExecutor !== "function") throw new Error(`${command} requires project module to export an AgentPassExecutor factory`);
const executed = await executeFrameworkProject(prepared, projectModule.createFixtureExecutor(), { maximumRepairAttempts: 1 });
if (command === "generate") {
  print({ command, executionHash: executed.executionHash, runs: executed.generationRuns.map((run) => ({ jobId: run.jobId, status: run.status, checkpoints: run.checkpointHashes.length, hardFailures: run.validation.hardFailures })) });
  process.exit(0);
}
if (command === "validate") {
  const failures = executed.preview.validations.flatMap((report) => report.hardFailures.map((attributeId) => ({ scope: report.scope, attributeId })));
  print({ command, passes: failures.length === 0, failures, reportHashes: executed.preview.validations.map((report) => [report.scope, report.reportHash]) });
  if (failures.length > 0) process.exitCode = 1;
  process.exit();
}
await emit(outputPath, executed);
print({ command, outputPath: resolve(outputPath), executionHash: executed.executionHash, previewHash: executed.preview.previewHash, pages: executed.preview.pages.length, rejected: executed.preview.rejectedPages.length, validationPasses: executed.preview.validation.passes });

async function emit(directory, executed) {
  const root = resolve(directory); await mkdir(root, { recursive: true });
  const files = { "project.json": executed.project, "context-corpus.json": executed.contextCorpus, "calibration.json": executed.calibration, "coordinates.json": executed.coordinates, "selected-corpus.json": executed.selectedCorpus, "jobs.json": executed.generationJobs, "runs.json": executed.generationRuns, "preview.json": executed.preview };
  for (const [name, value] of Object.entries(files)) await writeFile(resolve(root, name), `${JSON.stringify(value, null, 2)}\n`);
  await writeFile(resolve(root, "index.html"), executed.previewHtml);
}
function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
