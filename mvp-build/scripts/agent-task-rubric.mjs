#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DIMENSIONS = ["authority", "completeness", "agility", "isolation", "provability", "moat"];
const REQUIRED_ARRAYS = [
  "success_criteria",
  "allowed_files",
  "forbidden_files",
  "required_tests",
  "known_blockers",
  "mitigations",
];

const template = {
  task_id: "AMTECH-P0-EXAMPLE-001",
  repository: "benamtech/ai-employee-v1",
  branch: "task/amtech-p0-example-001",
  objective: "Implement one bounded, verifiable behavior.",
  success_criteria: ["A named contract fails before the implementation and passes after it."],
  allowed_files: ["mvp-build/path/to/owned/files/**"],
  forbidden_files: ["main", "unrelated subsystems"],
  required_tests: ["npm run repo:verify:quick"],
  known_blockers: [],
  max_commits: 3,
  rubric: {
    authority: 0.8,
    completeness: 0.8,
    agility: 0.8,
    isolation: 0.8,
    provability: 0.8,
    moat: 0.8,
  },
  mitigations: [],
};

function fail(message) {
  console.error(`❌ Task contract invalid: ${message}`);
  process.exitCode = 1;
}

const contractPath = process.argv[2];
if (!contractPath || contractPath === "--template") {
  console.log(JSON.stringify(template, null, 2));
  process.exit(0);
}

let contract;
try {
  contract = JSON.parse(await readFile(resolve(process.cwd(), contractPath), "utf8"));
} catch (error) {
  fail(`cannot read ${contractPath}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit();
}

for (const field of ["task_id", "repository", "branch", "objective"]) {
  if (typeof contract[field] !== "string" || contract[field].trim().length === 0) {
    fail(`${field} must be a non-empty string`);
  }
}
for (const field of REQUIRED_ARRAYS) {
  if (!Array.isArray(contract[field])) fail(`${field} must be an array`);
}
if (!Number.isInteger(contract.max_commits) || contract.max_commits < 1) {
  fail("max_commits must be a positive integer");
}
if (String(contract.branch ?? "").toLowerCase() === "main") {
  fail("work must occur on a reviewed non-main branch");
}
if (contract.repository !== "benamtech/ai-employee-v1") {
  fail("repository must be benamtech/ai-employee-v1");
}

const scores = {};
for (const dimension of DIMENSIONS) {
  const score = contract.rubric?.[dimension];
  if (typeof score !== "number" || !Number.isFinite(score) || score < -1 || score > 1) {
    fail(`rubric.${dimension} must be a finite number in [-1, 1]`);
    continue;
  }
  scores[dimension] = score;
  if (score < 0.5) {
    const hasMitigation = (contract.mitigations ?? []).some((value) =>
      String(value).toLowerCase().includes(dimension),
    );
    if (!hasMitigation) fail(`${dimension}=${score} requires a mitigation naming ${dimension}`);
  }
}

if (!process.exitCode) {
  const average = DIMENSIONS.reduce((sum, key) => sum + scores[key], 0) / DIMENSIONS.length;
  console.log(JSON.stringify({
    status: "pass",
    task_id: contract.task_id,
    branch: contract.branch,
    scores,
    average: Number(average.toFixed(3)),
    required_tests: contract.required_tests,
  }, null, 2));
  console.log("✅ AMTECH task contract and six-point rubric OK");
}
