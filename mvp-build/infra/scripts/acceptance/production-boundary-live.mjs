#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { hasFlag, readProof, requireEnv, writeProof, assert } from "./production-proof-lib.mjs";

requireEnv("AMTECH_RELEASE_SHA");
const manifest = JSON.parse(await readFile("infra/acceptance/production-boundary-live.json", "utf8"));
const allowSkipped = hasFlag("--allow-skipped");
const proofArgs = process.argv.slice(2).filter((value) => value.startsWith("--proof="));
const proofByPhase = new Map();
for (const value of proofArgs) {
  const pair = value.slice("--proof=".length);
  const separator = pair.indexOf(":");
  assert(separator > 0, "proof_argument_must_be_phase_colon_path", pair);
  proofByPhase.set(pair.slice(0, separator), pair.slice(separator + 1));
}

function atPath(value, path) {
  return path.split(".").reduce((current, segment) => current?.[segment], value);
}

const phases = [];
for (const phase of manifest.phases) {
  const path = proofByPhase.get(phase.id);
  if (!path) {
    if (!allowSkipped) throw new Error(`missing_phase_proof:${phase.id}`);
    phases.push({ id: phase.id, status: "skipped", source: null, missing_evidence: phase.required_evidence });
    continue;
  }
  const proof = await readProof(path);
  const missing = phase.required_evidence.filter((evidencePath) => {
    const value = atPath(proof.evidence, evidencePath);
    return value === undefined || value === null || value === false || (Array.isArray(value) && value.length === 0);
  });
  const releaseMatches = proof.git_sha === process.env.AMTECH_RELEASE_SHA;
  const status = proof.status;
  if (status !== "passed" || missing.length || !releaseMatches) {
    throw new Error(`phase_not_accepted:${phase.id}:${JSON.stringify({ status, missing, releaseMatches })}`);
  }
  phases.push({ id: phase.id, status, source: path, checked_at: proof.checked_at, git_sha: proof.git_sha, missing_evidence: [] });
}

assert(allowSkipped || phases.every((phase) => phase.status === "passed"), "production_boundary_has_unaccepted_phases", phases);
await writeProof("production-boundary-live", allowSkipped && phases.some((phase) => phase.status !== "passed") ? "partial" : "passed", {
  manifest_version: manifest.version,
  release_sha: process.env.AMTECH_RELEASE_SHA,
  allowSkipped,
  phases,
  required_evidence: Object.fromEntries(manifest.phases.map((phase) => [phase.id, phase.required_evidence])),
});
