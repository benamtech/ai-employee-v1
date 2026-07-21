#!/usr/bin/env node
import { readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const mvpRoot = resolve(dirname(scriptPath), "..");
const repoRoot = resolve(mvpRoot, "..");
const atMvp = (...parts) => resolve(mvpRoot, ...parts);
const atRepo = (...parts) => resolve(repoRoot, ...parts);

async function read(path) {
  return readFile(path, "utf8");
}

async function write(path, content) {
  await writeFile(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

async function writeJson(path, value) {
  await write(path, JSON.stringify(value, null, 2));
}

const promotedPath = atMvp("apps/manager/src/server.promoted.ts");
const promoted = await read(promotedPath);
if (!promoted.includes("export function buildApp(): Hono")) {
  throw new Error("promoted_manager_source_missing_build_app");
}
if (!promoted.includes("authorizePlatformAdminRequest") || !promoted.includes("buildEmployeeSnapshotStrict")) {
  throw new Error("promoted_manager_source_missing_production_boundaries");
}
await write(atMvp("apps/manager/src/server.ts"), promoted);

const managerPackagePath = atMvp("apps/manager/package.json");
const managerPackage = JSON.parse(await read(managerPackagePath));
managerPackage.main = "./dist/server.js";
managerPackage.scripts = {
  dev: "tsx watch src/server.ts",
  start: "node dist/server.js",
  build: "tsc -p tsconfig.json",
  typecheck: "tsc -p tsconfig.json --noEmit",
};
await writeJson(managerPackagePath, managerPackage);

const rootPackagePath = atMvp("package.json");
const rootPackage = JSON.parse(await read(rootPackagePath));
delete rootPackage.scripts["generate:production-sources"];
delete rootPackage.scripts.prepare;
for (const [name, command] of Object.entries(rootPackage.scripts)) {
  if (typeof command === "string") {
    rootPackage.scripts[name] = command.replaceAll("npm run generate:production-sources && ", "");
  }
}
await writeJson(rootPackagePath, rootPackage);

const tsconfigPath = atMvp("apps/manager/tsconfig.json");
const tsconfig = JSON.parse(await read(tsconfigPath));
delete tsconfig.exclude;
await writeJson(tsconfigPath, tsconfig);

const managerDockerfilePath = atMvp("infra/deploy/manager.Dockerfile");
let managerDockerfile = await read(managerDockerfilePath);
managerDockerfile = managerDockerfile.replace(
  /# Root npm prepare generates the canonical Manager server\.[\s\S]*?COPY apps\/manager\/src\/server\.template\.ts apps\/manager\/src\/server\.template\.ts\n/,
  "",
);
managerDockerfile = managerDockerfile.replaceAll("server.generated.js", "server.js");
await write(managerDockerfilePath, managerDockerfile);

const provisionerDockerfilePath = atMvp("infra/deploy/provisioner.Dockerfile");
let provisionerDockerfile = await read(provisionerDockerfilePath);
provisionerDockerfile = provisionerDockerfile.replaceAll("server.generated.js", "server.js");
await write(provisionerDockerfilePath, provisionerDockerfile);

const gitignorePath = atRepo(".gitignore");
let gitignore = await read(gitignorePath);
gitignore = gitignore
  .split(/\r?\n/)
  .filter((line) => line !== "mvp-build/apps/manager/src/server.generated.ts")
  .join("\n");
await write(gitignorePath, gitignore);

const candidateWorkflowPath = atRepo(".github/workflows/ws07-ws08-commercial-effect.yml");
let candidateWorkflow = await read(candidateWorkflowPath);
candidateWorkflow = candidateWorkflow.replace("permissions:\n  contents: write", "permissions:\n  contents: read");
candidateWorkflow = candidateWorkflow.replace(
  '          echo "== canonical production source generation =="\n          npm run generate:production-sources\n',
  "",
);
candidateWorkflow = candidateWorkflow.replace(
  /\n      - name: Retain generated Manager source for typed composition[\s\S]*?\n      - name: Enforce source and unit result/,
  "\n      - name: Enforce source and unit result",
);
await write(candidateWorkflowPath, candidateWorkflow);

const onboardingWorkflowPath = atRepo(".github/workflows/s10-onboarding-identity.yml");
let onboardingWorkflow = await read(onboardingWorkflowPath);
onboardingWorkflow = onboardingWorkflow
  .replaceAll('      - "mvp-build/apps/manager/src/server.template.ts"\n', "")
  .replaceAll('      - "mvp-build/apps/manager/src/server.generated.ts"\n', '      - "mvp-build/apps/manager/src/server.ts"\n')
  .replaceAll('      - "mvp-build/apps/manager/scripts/generate-production-server.mjs"\n', "")
  .replace("      - run: npm run generate:production-sources\n", "");
await write(onboardingWorkflowPath, onboardingWorkflow);

for (const path of [
  promotedPath,
  atMvp("apps/manager/src/server.template.ts"),
  atMvp("apps/manager/scripts/generate-production-server.mjs"),
  atMvp("apps/manager/scripts/patch-production-stream.mjs"),
  atMvp("apps/manager/scripts/production-admin-block.mjs"),
  atRepo(".github/workflows/finalize-manager-typed-source.yml"),
  scriptPath,
]) {
  await rm(path, { force: true });
}

console.log(JSON.stringify({
  status: "ok",
  canonical_source: "mvp-build/apps/manager/src/server.ts",
  entrypoint: "mvp-build/apps/manager/dist/server.js",
  removed_mutation_pipeline: true,
}));
