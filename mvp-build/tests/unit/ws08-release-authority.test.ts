import { generateKeyPairSync, sign, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RELEASE_SERVICES,
  canonicalJson,
  sha256,
  validateManifestShape,
} from "../../infra/scripts/release-manifest-contract.mjs";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("WS08 exact release and recovery authority", () => {
  it("defines the complete release recovery state machine and forbidden false-success transitions", () => {
    const machine = JSON.parse(read("validation/ws08-release-state-machine.json"));
    expect(machine.transitions.length).toBeGreaterThanOrEqual(15);
    expect(machine.forbidden_transitions).toContain("partial_topology -> healthy");
    expect(machine.forbidden_transitions).toContain("ambiguous -> automatic_retry");
    expect(machine.forbidden_transitions).toContain("restore_without_proof_refinding -> restore_verified");
    expect(machine.forbidden_transitions).toContain("rollback_with_accepted_work_loss -> rollback_verified");
  });

  it("independently verifies a canonical Ed25519 five-image manifest", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-release-"));
    try {
      const { privateKey, publicKey } = generateKeyPairSync("ed25519");
      const sha = "a".repeat(40);
      const payload = {
        schema: "amtech.release-manifest.v2",
        repository: "benamtech/ai-employee-v1",
        git_sha: sha,
        migration_head: "0078",
        compose: { path: "infra/deploy/docker-compose.production.yml", sha256: "b".repeat(64) },
        configuration: { caddyfile_sha256: "c".repeat(64), topology_sha256: "d".repeat(64), dockerfiles: {} },
        images: Object.fromEntries(RELEASE_SERVICES.map((service, index) => [service, { service, ref: `amtech-ai-employee-${service}:${sha}`, image_id: `sha256:${String(index + 1).padStart(64, "0")}`, repo_digests: [], revision: sha, runtime: service }])),
        secret_versions: { database: "secret-v1" },
        evidence_classes: { source: "represented" },
      };
      const bytes = Buffer.from(canonicalJson(payload));
      const publicDer = publicKey.export({ type: "spki", format: "der" });
      const manifest = {
        ...payload,
        payload_digest: sha256(bytes),
        signature: { algorithm: "Ed25519", value: sign(null, bytes, privateKey).toString("base64"), public_key_fingerprint: createHash("sha256").update(publicDer).digest("hex") },
      };
      validateManifestShape(manifest);
      const path = join(directory, "manifest.json");
      writeFileSync(path, JSON.stringify(manifest));
      const output = execFileSync(process.execPath, ["infra/scripts/verify-release-manifest.mjs", path], {
        encoding: "utf8",
        env: {
          ...process.env,
          AMTECH_RELEASE_PUBLIC_KEY_PEM: publicKey.export({ type: "spki", format: "pem" }).toString(),
          AMTECH_RELEASE_EXPECTED_PUBLIC_KEY_FINGERPRINT: manifest.signature.public_key_fingerprint,
          AMTECH_RELEASE_VERIFY_REPOSITORY: "0",
          AMTECH_RELEASE_VERIFY_LOCAL_IMAGES: "0",
        },
      });
      expect(output).toContain('"status": "ok"');
      expect(output).toContain('"image_count": 5');
      expect(output).toContain('"trust_note": "matched_external_fingerprint"');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("binds compose health and image identity to all five services", () => {
    const compose = read("infra/deploy/docker-compose.production.yml");
    expect(compose).toContain("amtech-ai-employee-model-gateway:${AMTECH_GIT_SHA");
    expect(compose).toContain("dockerfile: infra/deploy/model-gateway.Dockerfile");
    expect(compose).toContain("amtech-ai-employee-host-provisioner:${AMTECH_GIT_SHA");
    expect(compose).toContain("wget -q -T 5 -O /dev/null http://127.0.0.1:8092/health");
    expect(compose).toContain("host-provisioner:\n        condition: service_healthy");
    expect(compose).toContain("model-gateway:\n        condition: service_healthy");
  });

  it("requires signed prior identity, schema compatibility, five images, and accepted-work conservation for rollback", () => {
    const rollback = read("infra/scripts/deploy-rollback.mjs");
    expect(rollback).toContain("AMTECH_PREVIOUS_RELEASE_MANIFEST");
    expect(rollback).toContain("ROLLBACK_DATABASE_COMPATIBILITY");
    expect(rollback).toContain("RELEASE_SERVICES");
    expect(rollback).toContain("acceptedWorkSnapshot");
    expect(rollback).toContain("rollback_accepted_work_conservation_failed");
    expect(rollback).toContain("AMTECH_ROLLBACK_APPLY");
    expect(rollback).not.toContain("PREVIOUS_MANAGER_IMAGE");
  });

  it("requires database filesystem release secret and proof continuity for restore", () => {
    const backup = read("infra/scripts/backup-restore.mjs");
    const verify = read("infra/scripts/restore-verify.mjs");
    for (const token of ["pg_dump", "filesystem.tar.gz", "release-manifest.json", "secret_versions", "accepted_work", "pg_restore", "AMTECH_RESTORE_ALLOW_REPLACE", "restore-verify.mjs"]) expect(backup).toContain(token);
    expect(verify).toContain("restore_secret_version_mismatch");
    expect(verify).toContain("restore_durable_truth_mismatch");
    expect(verify).toContain("restore_proof_refinding_incomplete");
  });
});
