#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cpus } from "node:os";
import { join } from "node:path";
import { ROOT, directoryBytes, gitSha, runMeasured, writeProof } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm build\nBuilds canonical npm workspaces and the full production manager/model-gateway/host-provisioner/web/caddy image set for the exact Git SHA. Enforces a 30s/4GB caller-process budget and a 100MB application-artifact budget. It never starts or deploys containers.");
  process.exit(0);
}
if (!existsSync(join(ROOT, "mvp-build", "node_modules"))) {
  console.error("mvp-build/node_modules missing. Run: npm --prefix mvp-build ci");
  process.exit(1);
}
const deployEnv = join(ROOT, "mvp-build", "infra", "deploy", ".env.production");
if (!existsSync(deployEnv)) {
  console.error("mvp-build/infra/deploy/.env.production missing. Prepare it from the documented example before building production images.");
  process.exit(1);
}
const trackedStatus = spawnSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: ROOT, encoding: "utf8", timeout: 5000 });
if (trackedStatus.status !== 0 || trackedStatus.stdout.trim()) {
  console.error("tracked working tree must be clean before an exact-SHA production build");
  process.exit(1);
}
const sha = gitSha();
if (sha === "unknown") {
  console.error("exact Git SHA is required for production image identity");
  process.exit(1);
}
const runner = join(ROOT, "scripts", "local-prod", "build-runner.mjs");
const result = await runMeasured({
  label: "build",
  command: process.execPath,
  args: [runner],
  budgetSeconds: Number(process.env.LOCAL_PROD_BUILD_BUDGET_SECONDS ?? 30),
  maxRssMb: Number(process.env.LOCAL_PROD_BUILD_MAX_RSS_MB ?? 4096),
  env: {
    AMTECH_GIT_SHA: sha,
    COMPOSE_PARALLEL_LIMIT: String(Math.max(2, cpus().length)),
  },
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
const imageNames = [
  `amtech-ai-employee-manager:${sha}`,
  `amtech-ai-employee-provisioner:${sha}`,
  `amtech-ai-employee-web:${sha}`,
  `amtech-ai-employee-caddy:${sha}`,
];
const images = imageNames.map((image) => {
  const inspected = spawnSync("docker", ["image", "inspect", image, "--format", "{{json .}}"], { cwd: ROOT, encoding: "utf8" });
  if (inspected.status !== 0) return { image, status: "missing" };
  const row = JSON.parse(inspected.stdout);
  return {
    image,
    status: row?.Config?.Labels?.["org.opencontainers.image.revision"] === sha ? "pass" : "revision_mismatch",
    revision: row?.Config?.Labels?.["org.opencontainers.image.revision"] ?? null,
    size_bytes: Number(row?.Size ?? 0),
    id: row?.Id ?? null,
  };
});
const imagePass = images.every((image) => image.status === "pass");
const proof = writeProof("build-artifacts", {
  status: result.status === "pass" && artifactPass && imagePass ? "pass" : "fail",
  topology: "full production compose: manager, model-gateway, host-provisioner, web, caddy",
  artifact_bytes: bytes,
  artifact_mb: Math.round(bytes / 1024 / 1024 * 10) / 10,
  max_artifact_mb: maxBytes / 1024 / 1024,
  artifact_pass: artifactPass,
  paths: candidates.filter(existsSync).map((path) => path.slice(ROOT.length + 1)),
  images,
  exact_revision_pass: imagePass,
  docker_daemon_memory_note: "Caller process-tree RSS is measured. Docker daemon/BuildKit memory is an explicit unproven vector until host telemetry confirms peak total memory below the configured limit.",
});
console.log(`artifact_proof_json:${proof.latest}`);
if (!artifactPass || !imagePass || result.status !== "pass") process.exit(1);
