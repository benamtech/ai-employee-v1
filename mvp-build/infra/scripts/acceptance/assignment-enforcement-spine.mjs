#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const required = [
  ["packages/shared/src/assignment-resolver.ts", ["resolveAssignmentScope", "validateSignedResourceDurableBoundary", "resolveSmsChannelAssignment", "missing_command_effect_intent"]],
  ["packages/shared/src/session-enforcer.ts", ["enforceOwnerSessionAssignment", "ownerSessionPrincipalAliases", "listOwnerSessionAssignments"]],
  ["packages/shared/src/materialization.ts", ["assignment_id?: string | null", "ProofEnvelope"]],
  ["packages/shared/src/preview-links.ts", ["assignment_id?: string | null", "requires_command_effect"]],
  ["packages/shared/src/work-stream.ts", ["WorkStreamAssignmentScope", "withAssignmentStreamScope"]],
  ["apps/manager/src/middleware/assignment-guard.ts", ["enforceManagerOwnerAssignment", "enforceManagerSignedResourceBoundary", "enforceManagerSmsAssignment"]],
  ["apps/web/src/middleware/assignment-guard.ts", ["enforceWebOwnerAssignment", "ownerSessionTokenFromRequest"]],
  ["tests/unit/assignment-enforcement-contract.test.ts", ["S2 owner route", "S3 signed resource", "S4 SMS/channel"]],
];

const problems = [];
for (const [path, needles] of required) {
  let text = "";
  try {
    text = read(path);
  } catch (err) {
    problems.push(`${path}: missing (${err.message})`);
    continue;
  }
  for (const needle of needles) {
    if (!text.includes(needle)) problems.push(`${path}: missing ${needle}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  evidence: "s2-s3-s4-assignment-enforcement-source-spine",
  live_acceptance: false,
  checked_files: required.map(([path]) => path),
}, null, 2));
