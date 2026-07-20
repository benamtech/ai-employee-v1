import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mintPreviewToken,
  verifyPreviewToken,
} from "../../apps/manager/src/lib/signed-links.js";

const previousSecret = process.env.SIGNING_SECRET;

beforeEach(() => {
  process.env.SIGNING_SECRET = "s7-preview-signing-secret-for-tests";
});

afterEach(() => {
  if (previousSecret === undefined) delete process.env.SIGNING_SECRET;
  else process.env.SIGNING_SECRET = previousSecret;
});

describe("S7 principal-bound signed preview tokens", () => {
  it("binds assignment, human resolver, policy, snapshot, actions, and JTI", () => {
    const token = mintPreviewToken({
      account_id: "acct_s7",
      employee_id: "emp_s7",
      resource_type: "approval",
      resource_id: "appr_s7",
      actions: ["view", "approve", "reject"],
      assignment_id: "asn_s7",
      resolver_principal_id: "hpr_s7",
      policy_version: "authorization-v1",
      approval_snapshot_hash: `sha256:${"a".repeat(64)}`,
      ttlSeconds: 300,
    });
    const claims = verifyPreviewToken(token);
    expect(claims).toMatchObject({
      account_id: "acct_s7",
      employee_id: "emp_s7",
      resource_type: "approval",
      resource_id: "appr_s7",
      actions: ["view", "approve", "reject"],
      assignment_id: "asn_s7",
      resolver_principal_id: "hpr_s7",
      policy_version: "authorization-v1",
      approval_snapshot_hash: `sha256:${"a".repeat(64)}`,
      expired: false,
    });
    expect(claims?.jti).toMatch(/^[0-9a-f]{24}$/);
  });

  it("rejects signature and bound-claim tampering", () => {
    const token = mintPreviewToken({
      account_id: "acct_s7",
      employee_id: "emp_s7",
      resource_type: "approval",
      resource_id: "appr_s7",
      actions: ["approve"],
      assignment_id: "asn_s7",
      resolver_principal_id: "hpr_s7",
      policy_version: "authorization-v1",
      approval_snapshot_hash: `sha256:${"a".repeat(64)}`,
      ttlSeconds: 300,
    });
    const [body, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(body!, "base64url").toString("utf8")) as Record<string, any>;
    decoded.extra.assignment_id = "asn_other";
    const forgedBody = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    expect(verifyPreviewToken(`${forgedBody}.${signature}`)).toBeNull();
    expect(verifyPreviewToken(`${body}.${signature!.slice(0, -1)}x`)).toBeNull();
  });

  it("distinguishes a valid expired token from a forged token", () => {
    const token = mintPreviewToken({
      account_id: "acct_s7",
      employee_id: "emp_s7",
      resource_type: "approval",
      resource_id: "appr_s7",
      actions: ["approve"],
      assignment_id: "asn_s7",
      resolver_principal_id: "hpr_s7",
      policy_version: "authorization-v1",
      approval_snapshot_hash: `sha256:${"a".repeat(64)}`,
      ttlSeconds: -1,
    });
    expect(verifyPreviewToken(token)?.expired).toBe(true);
  });
});
