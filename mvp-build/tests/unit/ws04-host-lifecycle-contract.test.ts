import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertRotationContinuity,
  assertSecretUsable,
  redactSecretValue,
  secretDescriptorFingerprint,
  validateSecretDescriptor,
  type ManagedSecretDescriptor,
} from "../../apps/manager/src/lib/secret-custody.js";
import { assertExactRuntimeImage, validateRuntimeImageEvidence } from "../../apps/manager/src/lib/runtime-image-evidence.js";

const cutover = "2026-07-21T00:00:00.000Z";
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
  revoked_at: cutover,
  replacement_secret_id: "secret_model_gateway_v2",
};

function replacement(overrides: Partial<ManagedSecretDescriptor> = {}): ManagedSecretDescriptor {
  return {
    ...baseSecret,
    secret_id: "secret_model_gateway_v2",
    version: 2,
    issued_at: cutover,
    rotation_due_at: "2026-08-21T00:00:00.000Z",
    revoked_at: null,
    replacement_secret_id: null,
    rollback_secret_id: baseSecret.secret_id,
    ...overrides,
  };
}

describe("WS-04 host lifecycle authority", () => {
  it("routes every lifecycle action through Manager instead of direct Docker authority", () => {
    const source = readFileSync("infra/scripts/employee-lifecycle.mjs", "utf8");
    expect(source).not.toContain('spawnSync("docker"');
    expect(source).not.toContain("docker inspect");
    expect(source).toContain('inspect: "inspect_drift"');
    expect(source).toContain('/manager/provisioning/commands');
  });

  it("fails closed every destructive Host Provisioner Docker step", () => {
    const source = readFileSync("apps/manager/src/provisioner-host.ts", "utf8");
    expect(source).toContain("runDestructiveDockerStep");
    expect(source).toContain('args: ["rm", "-f", container], expected_stdout: container');
    expect(source).toContain('args: ["stop", container], expected_stdout: container');
    expect(source).toContain('args: ["restart", container], expected_stdout: container');
    expect(source).toContain('args: ["network", "rm", network], expected_stdout: network');
    expect(source).toContain("const removed = await removeRuntime(req);");
    expect(source).toContain("docker_destructive_partial_failure");
    expect(source).toContain("accepted_steps_before_failure");
    expect(source).toContain("restart_runtime_verification_ambiguous");
    expect(source).toContain("_after_remove_ambiguous");
    expect(source).toContain('outcome: result.outcome ?? "failed"');
    expect(source).toContain("evidence: result.evidence ?? null");
  });

  it("treats malformed Host output as ambiguous and blocks healthy lifecycle projection", () => {
    const manager = readFileSync("apps/manager/src/provisioner.ts", "utf8");
    const shared = readFileSync("packages/shared/src/profile-package.ts", "utf8");
    expect(manager).toContain("host_provisioner_malformed_result");
    expect(manager).toContain("host_provisioner_invalid_json");
    expect(manager).toContain("host_provisioner_destructive_success_unverified");
    expect(manager).toContain('.update({ status: "failed", needs_reprovision: true })');
    expect(manager).toContain("manager_projection_guard");
    expect(manager).toContain("host_provisioner_failure:${JSON.stringify(durableSummary)}");
    expect(shared).toContain('outcome?: "accepted" | "failed" | "ambiguous"');
    expect(shared).toContain("evidence?: Record<string, unknown>");
  });

  it("supports a scheduled rotation cutover without a validity gap and denies the old token at cutover", () => {
    const next = replacement();
    expect(() => validateSecretDescriptor(baseSecret, Date.parse("2026-07-20T12:00:00.000Z"))).not.toThrow();
    expect(() => assertSecretUsable(baseSecret, { audience: "amtech-model-gateway" }, Date.parse("2026-07-20T23:59:59.000Z"))).not.toThrow();
    expect(() => assertRotationContinuity(baseSecret, next)).not.toThrow();
    expect(() => assertSecretUsable(baseSecret, { audience: "amtech-model-gateway" }, Date.parse(cutover))).toThrow("secret_revoked");
    expect(() => assertSecretUsable(next, { audience: "amtech-model-gateway", minimum_version: 2 }, Date.parse(cutover))).not.toThrow();
    expect(secretDescriptorFingerprint(next)).toMatch(/^[a-f0-9]{64}$/);
    expect(redactSecretValue("super-secret")).toEqual(expect.objectContaining({ redacted: true, length: 12 }));
  });

  it("rejects a replacement issued after cutover and self-referential custody links", () => {
    expect(() => assertRotationContinuity(baseSecret, replacement({ issued_at: "2026-07-21T00:00:01.000Z" }))).toThrow("secret_rotation_cutover_gap");
    expect(() => validateSecretDescriptor({ ...baseSecret, replacement_secret_id: baseSecret.secret_id })).toThrow("secret_replacement_self_reference");
    expect(() => validateSecretDescriptor({ ...replacement(), rollback_secret_id: "secret_model_gateway_v2" })).toThrow("secret_rollback_self_reference");
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
