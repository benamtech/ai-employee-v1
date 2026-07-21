#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/scripts/verify-repository-governance.mjs";
let source = await readFile(path, "utf8");
const anchor = "const report = {\n";
if (!source.includes(anchor)) throw new Error("repository_governance_report_anchor_missing");

const insertion = `const directManagerSource = await read("apps/manager/src/server.ts");
const managerPackage = parseJson("manager-package", await read("apps/manager/package.json"));
const managerDockerfile = await read("infra/deploy/manager.Dockerfile");
const provisionerDockerfile = await read("infra/deploy/provisioner.Dockerfile");
const focusedWorkflow = texts["../.github/workflows/ws07-ws08-commercial-effect.yml"];
const removedManagerAssembly = [
  "apps/manager/src/server.template.ts",
  "apps/manager/src/server.promoted.ts",
  "apps/manager/src/server.generated.ts",
  "apps/manager/scripts/generate-production-server.mjs",
  "apps/manager/scripts/patch-production-stream.mjs",
  "apps/manager/scripts/production-admin-block.mjs",
];
const lingeringManagerAssembly = [];
for (const path of removedManagerAssembly) if (await exists(path)) lingeringManagerAssembly.push(path);
const rootScriptText = Object.values(pkg.scripts ?? {}).map(String).join("\\n");
record("GOV-19",
  directManagerSource.includes("export function buildApp(): Hono")
  && directManagerSource.includes("validateProjectedProtocolAuthority")
  && directManagerSource.includes("subscribeProgress(streamScope")
  && managerPackage.main === "./dist/server.js"
  && managerPackage.scripts?.start === "node dist/server.js"
  && managerPackage.scripts?.build === "tsc -p tsconfig.json"
  && managerPackage.scripts?.typecheck === "tsc -p tsconfig.json --noEmit"
  && !managerPackage.scripts?.pretypecheck
  && !managerPackage.scripts?.["generate:production-server"]
  && !pkg.scripts?.prepare
  && !pkg.scripts?.["generate:production-sources"]
  && !rootScriptText.includes("server.generated")
  && managerDockerfile.includes("apps/manager/dist/server.js")
  && !managerDockerfile.includes("server.generated")
  && !provisionerDockerfile.includes("server.generated")
  && !focusedWorkflow.includes("generate:production-sources")
  && focusedWorkflow.includes("contents: read")
  && lingeringManagerAssembly.length === 0,
  \`Manager direct typed composition is canonical; lingering=\${lingeringManagerAssembly.join(",") || "none"}\`);

`;
source = source.replace(anchor, insertion + anchor);
source = source.replace('validator_version: "5.0.0-explicit-baseline-topology-split"', 'validator_version: "6.0.0-direct-typed-manager"');
await writeFile(path, source, "utf8");
console.log(JSON.stringify({ status: "ok", path, gate: "GOV-19" }));
