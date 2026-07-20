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
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${path}`);
  return response.json();
}

const repository = baseline.upstream_repository;
const branch = baseline.default_branch || "main";
const watchedPaths = Object.keys(baseline.watched_paths);
const [head, pullRequests, ...watchedFiles] = await Promise.all([
  github(`/repos/${repository}/commits/${branch}`),
  github(`/repos/${repository}/pulls?state=open&sort=updated&direction=desc&per_page=20`),
  ...watchedPaths.map((path) =>
    github(`/repos/${repository}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}?ref=${branch}`),
  ),
]);

const currentPaths = Object.fromEntries(
  watchedPaths.map((path, index) => [path, watchedFiles[index]?.sha ?? null]),
);
const reviewedAt = Date.parse(baseline.reviewed_at);
const ageDays = Number.isFinite(reviewedAt) ? (Date.now() - reviewedAt) / 86_400_000 : Number.POSITIVE_INFINITY;
const headChanged = head.sha !== baseline.reviewed_main_sha;
const changedPaths = Object.entries(currentPaths)
  .filter(([path, sha]) => sha !== baseline.watched_paths[path])
  .map(([path]) => path);
const stale = ageDays > baseline.review_window_days;

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
  hard_review_required: changedPaths.length > 0 || stale,
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
    unrelated_head_motion_is_warning: true,
    watched_path_or_stale_baseline_is_blocking: true,
    review_window_days: baseline.review_window_days,
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (enforce && (changedPaths.length > 0 || stale)) {
  console.error("❌ Hermes integration-boundary review required before this change proceeds.");
  if (changedPaths.length) console.error(`watched paths changed: ${changedPaths.join(", ")}`);
  if (stale) console.error(`baseline is ${ageDays.toFixed(1)} days old; limit is ${baseline.review_window_days}`);
  process.exitCode = 1;
} else if (changedPaths.length > 0 || stale) {
  console.warn("⚠️ Hermes watched-boundary drift detected; review the generated report.");
} else if (headChanged) {
  console.warn(`⚠️ Hermes main moved outside watched integration paths: ${baseline.reviewed_main_sha} -> ${head.sha}`);
  console.log("✅ Watched Hermes integration boundary remains unchanged.");
} else {
  console.log("✅ Hermes upstream baseline is current for the watched boundary.");
}
