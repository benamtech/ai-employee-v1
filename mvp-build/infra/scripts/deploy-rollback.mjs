#!/usr/bin/env node
/**
 * Minimal rollback helper. It intentionally prints the exact Docker commands
 * instead of guessing an operator's prior image tag. The deploy runbook should
 * record PREVIOUS_MANAGER_IMAGE and PREVIOUS_WEB_IMAGE before a rollout.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const manager = process.env.PREVIOUS_MANAGER_IMAGE;
const web = process.env.PREVIOUS_WEB_IMAGE;
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeProof(status, extra) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `deploy-rollback-${stamp()}.json`);
  writeFileSync(path, JSON.stringify({
    kind: "deploy_rollback",
    status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    ...extra,
  }, null, 2));
  console.log(`proof_json:${path}`);
}

if (!manager || !web) {
  console.error("deploy-rollback: PREVIOUS_MANAGER_IMAGE and PREVIOUS_WEB_IMAGE are required.");
  writeProof("fail", { reason: "previous_images_missing" });
  process.exit(2);
}

const commands = [
  "docker compose -f infra/deploy/docker-compose.yml stop manager web",
  `docker tag ${manager} amtech-ai-employee-manager:rollback`,
  `docker tag ${web} amtech-ai-employee-web:rollback`,
  "docker compose -f infra/deploy/docker-compose.yml up -d manager web caddy",
  "npm run deploy:smoke",
];

console.log("Rollback commands:");
for (const command of commands) console.log(`  ${command}`);
writeProof("manual_commands_ready", { previous_manager_image: manager, previous_web_image: web, commands });
