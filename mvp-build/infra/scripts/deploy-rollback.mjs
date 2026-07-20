#!/usr/bin/env node
/**
 * Fail-closed rollback planner for the canonical production control plane.
 * It prints exact commands instead of guessing the operator's prior images or
 * database/profile compatibility. The deployment record must retain the image
 * digests and compatibility decision before this helper is invoked.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import {
  PRODUCTION_COMPOSE_FILE,
  PRODUCTION_CONTROL_SERVICES,
  PRODUCTION_ENV_FILE,
} from "./production-topology.mjs";

const previousImages = {
  manager: process.env.PREVIOUS_MANAGER_IMAGE,
  provisioner: process.env.PREVIOUS_PROVISIONER_IMAGE,
  web: process.env.PREVIOUS_WEB_IMAGE,
  caddy: process.env.PREVIOUS_CADDY_IMAGE,
};
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
    compose_file: PRODUCTION_COMPOSE_FILE,
    control_services: PRODUCTION_CONTROL_SERVICES,
    ...extra,
  }, null, 2));
  console.log(`proof_json:${path}`);
}

const missing = Object.entries(previousImages)
  .filter(([, value]) => !value)
  .map(([key]) => `PREVIOUS_${key.toUpperCase()}_IMAGE`);

if (missing.length > 0) {
  console.error(`deploy-rollback: missing required image coordinates: ${missing.join(", ")}`);
  writeProof("fail", { reason: "previous_images_missing", missing });
  process.exit(2);
}

const composePrefix = `AMTECH_GIT_SHA=rollback docker compose -f ${PRODUCTION_COMPOSE_FILE} --env-file ${PRODUCTION_ENV_FILE}`;
const commands = [
  `docker tag ${previousImages.manager} amtech-ai-employee-manager:rollback`,
  `docker tag ${previousImages.provisioner} amtech-ai-employee-provisioner:rollback`,
  `docker tag ${previousImages.web} amtech-ai-employee-web:rollback`,
  `docker tag ${previousImages.caddy} amtech-ai-employee-caddy:rollback`,
  `${composePrefix} config --quiet`,
  `${composePrefix} stop caddy web manager model-gateway host-provisioner`,
  `${composePrefix} up -d host-provisioner manager model-gateway web caddy`,
  "AMTECH_GIT_SHA=rollback npm run deploy:smoke",
  "AMTECH_GIT_SHA=rollback npm run prod:normal:validate",
];

console.log("Rollback commands:");
for (const command of commands) console.log(`  ${command}`);
writeProof("manual_commands_ready", {
  previous_images: previousImages,
  previous_hermes_image: process.env.PREVIOUS_HERMES_IMAGE ?? null,
  previous_profile_revision: process.env.PREVIOUS_PROFILE_REVISION ?? null,
  database_compatibility: process.env.ROLLBACK_DATABASE_COMPATIBILITY ?? "operator_verification_required",
  commands,
  note: "A rollback is not accepted until smoke and normal-employee validation pass on the restored control plane and database/profile compatibility is recorded.",
});
