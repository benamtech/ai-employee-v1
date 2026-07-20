#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const enforce = args.has("--enforce");
const baselinePath = resolve(process.cwd(), "validation/hermes-upstream-baseline.json");
const outputPath = resolve(process.cwd(), "validation/reports/hermes-upstream-watch.json");
const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "amtech-hermes-upstream-watch",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json();
}

const repository = baseline.upstream_repository;
const branch = baseline.default_branch || "main";
const [head, pullRequests, ...watchedFiles] = await Promise.all([
  github(`/repos/${repository}/commits/${branch}`),
  github(`/repos/${repository}/pulls?state=open&sort=updated&direction=desc&per_page=20`),
  ...Object.keys(baseline.watched_paths).map((path) =>
    github(`/repos/${repository}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}?ref=${branch}`),
  ),
]);

const currentPaths = Object.fromEntries(
  Object.keys(baseline.watched_paths).map((path, index) => [path, watchedFiles[index]?.sha ?? null]),
);
const reviewedAt = Date.parse(baseline.reviewed_at);
const ageDays = Number.isFinite(reviewedAt) ? (Date.now() - reviewedAt) / 86_400_000 : Number.POSITIVE_INFINITY;
const headChanged = head.sha !== baseline.reviewed_main_sha;
const changedPaths = Object.entries(currentPaths)
  .filter(([path, sha]) => sha !== baseline.watched_paths[path])
  .map(([path]) => path);

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  upstream_repository: repository,
  default_branch: branch,
  production_runtime_pin: baseline.production_runtime_pin,
  reviewed_at: baseline.reviewed_at,
  review_age_days: Number(ageDays.toFixed(2)),
  baseline_main_sha: baseline.reviewed_main_sha,
  current_main_sha: head.sha,
  head_changed: headChanged,
  baseline_paths: baseline.watched_paths,
  current_paths: currentPaths,
  changed_paths: changedPaths,
  recent_open_pull_requests: pullRequests.map((pr) => ({
    number: pr.number,
    title: pr.title,
    html_url: pr.html_url,
    updated_at: pr.updated_at,
    draft: Boolean(pr.draft),
    labels: (pr.labels ?? []).map((label) => label.name),
  })),
  policy: {
    upstream_is_intelligence_not_authority: true,
    automatic_upgrade_allowed: false,
    review_window_days: baseline.review_window_days,
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

const stale = ageDays > baseline.review_window_days;
if (enforce && (headChanged || changedPaths.length > 0 || stale)) {
  console.error("❌ Hermes upstream review required before this integration change proceeds.");
  if (headChanged) console.error(`main moved: ${baseline.reviewed_main_sha} -> ${head.sha}`);
  if (changedPaths.length) console.error(`watched paths changed: ${changedPaths.join(", ")}`);
  if (stale) console.error(`baseline is ${ageDays.toFixed(1)} days old; limit is ${baseline.review_window_days}`);
  process.exitCode = 1;
} else if (headChanged || changedPaths.length > 0 || stale) {
  console.warn("⚠️ Hermes upstream drift detected; review the generated report before runtime-bound work.");
} else {
  console.log("✅ Hermes upstream baseline is current for the watched boundary.");
}
