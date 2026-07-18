#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REQUIRED_RELEASE_GATES = [
  "source_typecheck",
  "shared_build",
  "unit_contracts",
  "relationship_authorization_matrix",
  "command_effect_matrix",
  "blank_migration_apply",
  "snapshot_clone_migration_apply",
  "real_supabase_matrix",
  "runtime_host_packet",
  "provider_packet",
  "browser_sms_packet",
  "commercial_reconciliation",
  "capacity_recovery_packet",
  "rollback_rehearsal",
  "proof_digest_claim_consistency",
];

const SOURCE_CI_ACCEPTED = new Set([
  "source_typecheck",
  "shared_build",
  "unit_contracts",
  "relationship_authorization_matrix",
  "command_effect_matrix",
  "blank_migration_apply",
]);

function argValue(name, fallback) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefixed = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (prefixed) return prefixed.slice(flag.length + 1);
  return fallback;
}

function requireSha(value) {
  if (!/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`release evidence requires a 40-character lowercase git SHA, got ${value}`);
  }
  return value;
}

const repository = argValue("repository", process.env.GITHUB_REPOSITORY ?? "benamtech/ai-employee-v1");
const branch = argValue("branch", process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "employee-production-tuesday");
const commitSha = requireSha(argValue("sha", process.env.GITHUB_SHA ?? "0".repeat(40)));
const runId = argValue("run-id", process.env.GITHUB_RUN_ID ?? "local");
const generatedAt = argValue("generated-at", new Date().toISOString());
const out = resolve(argValue("out", "release-evidence-manifest.json"));

const gates = REQUIRED_RELEASE_GATES.map((gate) => {
  const accepted = SOURCE_CI_ACCEPTED.has(gate);
  return {
    gate,
    status: accepted ? "ci_accepted" : "pending",
    sha: commitSha,
    evidenceId: accepted ? `github-actions:${runId}:${gate}` : null,
    generatedAt,
    source: accepted ? "github_actions" : "local_diagnostic",
    redactionState: "not_secret",
    notes: accepted
      ? "Integrated source/CI gate executed in the Lane 10 workflow; exact workflow run is the evidence ID."
      : "Required hard gate remains pending; this manifest intentionally does not promote live or production acceptance.",
  };
});

const manifestWithoutDigest = {
  schemaVersion: "release-evidence-v1",
  repository,
  branch,
  commitSha,
  generatedAt,
  generator: "infra/scripts/acceptance/release-evidence-spine.mjs",
  publicClaimState: "source_and_ci_only",
  gates,
};

const digest = createHash("sha256")
  .update(JSON.stringify(manifestWithoutDigest, null, 2))
  .digest("hex");

const manifest = { ...manifestWithoutDigest, manifestDigest: digest };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({ status: "ok", out, digest, gates: gates.length, publicClaimState: manifest.publicClaimState }, null, 2));
