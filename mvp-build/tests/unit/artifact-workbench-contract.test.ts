import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  buildEffectiveCapabilityReport,
  decideEffectiveCapability,
} from "../../packages/shared/src/effective-capabilities";
import { GOLDEN_EMPLOYEE_SCENARIOS } from "../../packages/shared/src/golden-employee-scenarios";
import {
  artifactContentSha256,
  artifactRevisionDiff,
} from "../../apps/manager/src/lib/artifact-revisions";
import {
  mintOAuthState,
  safeOAuthReturnPath,
  verifyOAuthState,
} from "../../apps/manager/src/lib/oauth-state";

const originalSigningSecret = process.env.SIGNING_SECRET;
afterEach(() => {
  if (originalSigningSecret == null) delete process.env.SIGNING_SECRET;
  else process.env.SIGNING_SECRET = originalSigningSecret;
});

const checkedAt = "2026-07-19T00:00:00.000Z";
const freshAt = "2026-07-19T00:01:00.000Z";

function completeEvidence(overrides: Record<string, unknown> = {}) {
  return {
    advertised: true,
    runtime_reported: true,
    dependency_ready: true,
    credential_ready: true,
    network_ready: true,
    policy_ready: true,
    entitlement_ready: true,
    authority_version_matches: true,
    live_probe_status: "passed" as const,
    evidence_checked_at: checkedAt,
    max_evidence_age_ms: 5 * 60_000,
    now: freshAt,
    ...overrides,
  };
}

describe("effective capability evidence", () => {
  it("never treats advertisement or runtime reporting as effective without every evidence dimension and a live probe", () => {
    const decision = decideEffectiveCapability({
      capability_key: "browser",
      ...completeEvidence({
        credential_ready: false,
        live_probe_status: "unknown",
        authority_version_matches: false,
      }),
    });
    expect(decision.effective).toBe(false);
    expect(decision.failed_dimensions).toEqual(expect.arrayContaining([
      "credential_ready",
      "authority_version_matches",
      "live_probe_passed",
    ]));
  });

  it("fails closed when otherwise-valid evidence is stale", () => {
    const decision = decideEffectiveCapability({
      capability_key: "file",
      ...completeEvidence({ now: "2026-07-19T01:00:00.000Z" }),
    });
    expect(decision.effective).toBe(false);
    expect(decision.failed_dimensions).toContain("evidence_fresh");
  });

  it("reports only fully proved toolsets as effective", () => {
    const report = buildEffectiveCapabilityReport({
      report_id: "caprep_test",
      account_id: "acct_test",
      employee_id: "emp_test",
      assignment_id: "asn_test",
      authority_version: "authv_7",
      checked_at: freshAt,
      capabilities: [
        {
          capability_key: "file",
          ...completeEvidence(),
        },
        {
          capability_key: "web",
          ...completeEvidence({
            credential_ready: false,
            network_ready: false,
            live_probe_status: "skipped",
          }),
        },
      ],
    });
    expect(report.authority_version).toBe("authv_7");
    expect(report.effective_toolsets).toEqual(["file"]);
    expect(report.denied_toolsets).toEqual([{
      capability_key: "web",
      failed_dimensions: ["credential_ready", "network_ready", "live_probe_passed"],
    }]);
  });
});

describe("artifact revision grammar", () => {
  it("hashes canonical payloads independent of object key insertion order", () => {
    expect(artifactContentSha256({ b: 2, a: { y: true, x: 1 } }))
      .toBe(artifactContentSha256({ a: { x: 1, y: true }, b: 2 }));
  });

  it("produces a field-addressable before and after diff", () => {
    const diff = artifactRevisionDiff(
      { project: { status: "draft" }, estimate: { subtotal_cents: 5000 } },
      { project: { status: "ready" }, estimate: { subtotal_cents: 5500 } },
    );
    expect(diff.before["project.status"]).toBe("draft");
    expect(diff.after["project.status"]).toBe("ready");
    expect(diff.before["estimate.subtotal_cents"]).toBe("5000");
    expect(diff.after["estimate.subtotal_cents"]).toBe("5500");
  });

  it("uses one artifact contract for Website A, Contractor B, and Bookkeeping C", () => {
    const scenarios = Object.values(GOLDEN_EMPLOYEE_SCENARIOS);
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "website_employee_a",
      "contractor_office_employee_b",
      "bookkeeping_employee_c",
    ]);
    for (const scenario of scenarios) {
      expect((scenario.initial_payload.project as { artifact_contract_version?: string }).artifact_contract_version).toBe("amtech-artifact-v1");
      expect((scenario.revised_payload.project as { status?: string }).status).toBe("ready_for_validation");
      expect(scenario.validations.length).toBeGreaterThanOrEqual(3);
      expect(scenario.publish_action).toBe("publish_artifact_sandbox");
      expect(scenario.expected_receipts).toEqual(expect.arrayContaining([
        "approval_snapshot_hash",
        "effect_receipt_id",
        "publication_ref",
        "post_publish_verification",
      ]));
    }
  });
});

describe("owner OAuth return binding", () => {
  it("accepts only relative owner-web paths", () => {
    expect(safeOAuthReturnPath("/agent/emp_1#work-art_1")).toBe("/agent/emp_1#work-art_1");
    expect(safeOAuthReturnPath("https://evil.example/steal")).toBeUndefined();
    expect(safeOAuthReturnPath("//evil.example/steal")).toBeUndefined();
    expect(safeOAuthReturnPath("/agent/emp_1\nLocation:https://evil.example")).toBeUndefined();
  });

  it("signs the initiating work path and rejects tampering", () => {
    process.env.SIGNING_SECRET = "artifact-workbench-test-signing-secret";
    const token = mintOAuthState("emp_1", "gmail", 600, { return_to: "/agent/emp_1#work-art_1" });
    expect(verifyOAuthState(token)).toMatchObject({
      employee_id: "emp_1",
      provider: "gmail",
      return_to: "/agent/emp_1#work-art_1",
    });
    expect(verifyOAuthState(`${token.slice(0, -1)}x`)).toBeNull();
  });
});

describe("production source contracts", () => {
  it("pins and proves the exact upstream Hermes release image", async () => {
    const source = await readFile("infra/scripts/acceptance/hermes-exact-image-filesystem-proof.mjs", "utf8");
    expect(source).toContain("nousresearch/hermes-agent:v2026.7.1");
    expect(source).toContain("resolved_digest");
    expect(source).toContain("opt_data_writable_and_persistent");
    expect(source).toContain("session_memory_checkpoint_persistent");
  });

  it("keeps profile authority read-only while materializing package plugins into employee-scoped Hermes data", async () => {
    const source = await readFile("infra/scripts/local/start-hermes-container.sh", "utf8");
    expect(source).toContain('-v "$runtime_data:/opt/data"');
    expect(source).toContain('-v "$profile_dir:/opt/amtech/profile:ro"');
    expect(source).toContain(".amtech-package-plugins");
    expect(source).toContain("packages/profile-packages/$package_key/plugins");
  });

  it("rejects validation of a non-current artifact revision", async () => {
    const source = await readFile("apps/manager/src/lib/artifact-revisions.ts", "utf8");
    expect(source).toContain('if (revisionId !== currentRevisionId) throw new Error("artifact_revision_stale")');
    expect(source).toContain('update.eq("current_revision_id", parentRevisionId)');
  });

  it("routes artifact publication through immutable approval and durable effect execution", async () => {
    const tools = await readFile("apps/manager/src/tools/artifact-workbench-tools.ts", "utf8");
    const migration = await readFile("packages/db/migrations/0070_effective_capabilities_and_artifact_revisions.sql", "utf8");
    expect(tools).toContain("executeApprovedAction");
    expect(tools).toContain('operation: "artifact.publish"');
    expect(migration).toContain("amtech_approval_snapshot");
    expect(migration).toContain("current_revision_id");
    expect(migration).toContain("content_sha256");
  });
});
