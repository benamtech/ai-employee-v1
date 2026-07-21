#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const TRACE = "mvp-build/decision/trace010";
const OUTPUT = resolve(ROOT, process.argv[2] ?? `${TRACE}/generated`);
const task = JSON.parse(await readFile(resolve(ROOT, `${TRACE}/task_state.json`), "utf8"));
const inventory = JSON.parse(await readFile(resolve(OUTPUT, "file_inventory.json"), "utf8"));
const summary = JSON.parse(await readFile(resolve(OUTPUT, "inventory_summary.json"), "utf8"));
const references = JSON.parse(await readFile(resolve(OUTPUT, "path_reference_index.json"), "utf8"));
const tree = (await readFile(resolve(OUTPUT, "before_tree.txt"), "utf8")).trim().split(/\r?\n/).filter(Boolean);
const failures = [];
const pass = [];
const record = (id, ok, detail) => (ok ? pass : failures).push({ id, detail });
const unique = (values) => new Set(values).size === values.length;

record("INV-01", inventory.starting_sha === task.starting_sha && summary.starting_sha === task.starting_sha,
  `generated state binds starting_sha=${task.starting_sha}`);
let ancestor = false;
try {
  execFileSync("git", ["merge-base", "--is-ancestor", task.starting_sha, "HEAD"], { cwd: ROOT });
  ancestor = true;
} catch {}
record("INV-02", ancestor, "starting SHA is an ancestor of the trace branch head");

const files = inventory.files ?? [];
const paths = files.map((file) => file.path);
record("INV-03", files.length > 0 && files.length === summary.tracked_mvp_build_blobs && unique(paths)
  && paths.every((path) => path.startsWith("mvp-build/")),
  `complete unique mvp-build inventory count=${files.length}`);
record("INV-04", JSON.stringify([...paths].sort()) === JSON.stringify([...tree].sort()),
  "before_tree and file inventory contain the same paths");
record("INV-05", files.every((file) => /^[0-9a-f]{40}$/.test(file.evidence?.git_blob_sha ?? "")
  && /^[0-9a-f]{64}$/.test(file.evidence?.sha256 ?? "")),
  "every tracked file has Git blob and SHA-256 identity");

const requiredVectorFields = [
  "authority", "runtimeReach", "sideEffects", "evidenceClass", "duplication",
  "tokenCost", "machineReadability", "coupling", "uncertainty", "experimentability"
];
record("INV-06", files.every((file) => requiredVectorFields.every((field) => Object.hasOwn(file.x_f ?? {}, field))),
  "every file has a complete x_f vector");
record("INV-07", files.every((file) => Array.isArray(file.x_f?.uncertainty) && file.x_f.uncertainty.length > 0),
  "uncertainty is explicit for every file and never represented by missing data");
record("INV-08", Object.keys(inventory.extraction_rules ?? {}).sort().join(",") === [
  "authority", "coupling", "duplication", "evidenceClass", "experimentability",
  "machineReadability", "runtimeReach", "sideEffects", "tokenCost", "uncertainty"
].sort().join(","), "all x_f dimensions have declared extraction rules");

const known = new Set(paths);
const invalidInboundTargets = Object.keys(references.inbound ?? {}).filter((path) => !known.has(path));
const invalidOutboundSources = Object.keys(references.outbound ?? {}).filter((path) => !known.has(path));
record("INV-09", invalidInboundTargets.length === 0 && invalidOutboundSources.length === 0,
  `reference index keys resolve to inventory; invalid_inbound=${invalidInboundTargets.length} invalid_outbound=${invalidOutboundSources.length}`);
record("INV-10", !paths.some((path) => path.startsWith(`${TRACE}/`)),
  "starting-SHA inventory excludes the later trace010 instrumentation itself");
record("INV-11", summary.non_generated_mvp_build_blobs + summary.generated_mvp_build_blobs === files.length,
  "generated classification partitions the full inventory");

const report = {
  schema: "trace010.inventory-verification.v1",
  status: failures.length ? "fail" : "pass",
  starting_sha: task.starting_sha,
  pass_count: pass.length,
  fail_count: failures.length,
  pass,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
