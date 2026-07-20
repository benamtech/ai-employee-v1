import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertRotationContinuity,
  assertSecretUsable,
  redactSecretValue,
  secretDescriptorFingerprint,
  type ManagedSecretDescriptor,
} from "../../apps/manager/src/lib/secret-custody.js";
import { assertExactRuntimeImage, validateRuntimeImageEvidence } from "../../apps/manager/src/lib/runtime-image-evidence.js";

const baseSecret: ManagedSecretDescriptor = {
  secret_id: "secret_model_gateway_v1",
  scope: "model-gateway",
  service: "model-gateway",
  owner: "platform-security",
  purpose: "employee-scoped gateway authorization",
  audience: "amtech-model-gateway",
  version: 1,
  issued_at: "2026-07-20T00:00:00.000Z",
  rotation_due_at: "2026-08-20T00:00:00.000Z",
  revoked_at: "2026-07-21T00:00:00.000Z",
  replacement_secret_id: "secret_model_gateway_v2",
};

describe("WS-04 host lifecycle authority", () => {
  it("routes every lifecycle action through Manager instead of direct Docker authority", () => {
    const source = readFileSync("infra/scripts/employee-lifecycle.mjs", "utf8");
    expect(source).not.toContain('spawnSync("docker"');
    expect(source).not.toContain("docker inspect");
    expect(source).toContain('inspect: "inspect_drift"');
    expect(source).toContain('/manager/provisioning/commands');
  });

  it("binds rotations to one service, audience, sequential version, rollback, and old-token revocation", () => {
    const replacement: ManagedSecretDescriptor = {
      ...baseSecret,
      secret_id: "secret_model_gateway_v2",
      version: 2,
      issued_at: "2026-07-21T00:00:00.000Z",
      rotation_due_at: "2026-08-21T00:00:00.000Z",
      revoked_at: null,
      replacement_secret_id: null,
      rollback_secret_id: baseSecret.secret_id,
    };
    expect(() => assertRotationContinuity(baseSecret, replacement)).not.toThrow();
    expect(() => assertSecretUsable(baseSecret, { audience: "amtech-model-gateway" }, Date.parse("2026-07-22T00:00:00.000Z"))).toThrow("secret_revoked");
    expect(secretDescriptorFingerprint(replacement)).toMatch(/^[a-f0-9]{64}$/);
    expect(redactSecretValue("super-secret")).toEqual(expect.objectContaining({ redacted: true, length: 12 }));
  });

  it("rejects floating or mismatched runtime images", () => {
    const digest = `sha256:${"a".repeat(64)}`;
    const evidence = validateRuntimeImageEvidence({
      image: `nousresearch/hermes-agent@${digest}`,
      digest,
      source_sha: "b".repeat(40),
      resolved_at: "2026-07-20T00:00:00.000Z",
      registry: "https://registry-1.docker.io",
    });
    expect(() => assertExactRuntimeImage(evidence, `nousresearch/hermes-agent@${digest}`)).not.toThrow();
    expect(() => validateRuntimeImageEvidence({ ...evidence, image: "nousresearch/hermes-agent:latest" })).toThrow("runtime_image_not_digest_pinned");
  });
});
