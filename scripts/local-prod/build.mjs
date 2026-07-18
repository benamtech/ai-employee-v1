#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, directoryBytes, runMeasured, writeProof } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm build\nRuns the canonical mvp-build npm workspace build, measures elapsed time and process-tree RSS, and enforces a 30s/4GB/100MB local-production budget. It does not deploy.");
  process.exit(0);
}
if (!existsSync(join(ROOT, "mvp-build", "node_modules"))) {
  console.error("mvp-build/node_modules missing. Run: npm --prefix mvp-build ci");
  process.exit(1);
}
const result = await runMeasured({
  label: "build",
  command: "npm",
  args: ["--prefix", "mvp-build", "run", "build"],
  budgetSeconds: Number(process.env.LOCAL_PROD_BUILD_BUDGET_SECONDS ?? 30),
  maxRssMb: Number(process.env.LOCAL_PROD_BUILD_MAX_RSS_MB ?? 4096),
});
const candidates = [
  join(ROOT, "mvp-build", "apps", "manager", "dist"),
  join(ROOT, "mvp-build", "apps", "web", ".next"),
  join(ROOT, "mvp-build", "packages", "shared", "dist"),
  join(ROOT, "mvp-build", "packages", "db", "dist"),
];
const bytes = candidates.reduce((sum, path) => sum + directoryBytes(path), 0);
const maxBytes = Number(process.env.LOCAL_PROD_BUILD_MAX_ARTIFACT_MB ?? 100) * 1024 * 1024;
const artifactPass = bytes > 0 && bytes <= maxBytes;
const proof = writeProof("build-artifacts", {
  status: result.status === "pass" && artifactPass ? "pass" : "fail",
  artifact_bytes: bytes,
  artifact_mb: Math.round(bytes / 1024 / 1024 * 10) / 10,
  max_artifact_mb: maxBytes / 1024 / 1024,
  artifact_pass: artifactPass,
  paths: candidates.filter(existsSync).map((path) => path.slice(ROOT.length + 1)),
});
console.log(`artifact_proof_json:${proof.latest}`);
if (!artifactPass) process.exit(1);
