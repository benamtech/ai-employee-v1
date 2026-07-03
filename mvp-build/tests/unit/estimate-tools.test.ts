import { beforeAll, describe, expect, it } from "vitest";
import { estimateTools } from "../../apps/manager/src/tools/estimate.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

beforeAll(() => {
  process.env.SIGNING_SECRET = "unit-test-signing-secret-key-0123456789";
});

const PDF_B64 = Buffer.from("%PDF-1.4\n1 0 obj\n%%EOF").toString("base64");

function ctxFor(db: FakeSupabase, account_id: string, employee_id: string): ToolContext {
  return { db: db.asClient(), account_id, employee_id, actor: "employee" };
}

function seed(): FakeSupabase {
  return makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1" }, { id: "emp_2", account_id: "acct_2" }] });
}

const PAYLOAD = { job_description: "deck", line_items: [{ label: "labor", quantity: 1, unit: "job", unit_price: 100, total: 100 }], assumptions: [], recommended_total: 100 };

async function createRenderSign(db: FakeSupabase) {
  const ctx = ctxFor(db, "acct_1", "emp_1");
  const created = await estimateTools.create_estimate_artifact!(ctx, { account_id: "acct_1", employee_id: "emp_1", estimate_payload: PAYLOAD });
  const artifactId = created.proof.artifact_id as string;
  await estimateTools.render_estimate_pdf!(ctx, { account_id: "acct_1", employee_id: "emp_1", artifact_id: artifactId, filename: "estimate.pdf", pdf_base64: PDF_B64 });
  return { ctx, artifactId };
}

describe("Phase 2 estimate/artifact/approval state machine", () => {
  it("runs create -> render -> sign -> request -> resolve(approved)", async () => {
    const db = seed();
    const { ctx, artifactId } = await createRenderSign(db);

    const link = await estimateTools.create_signed_artifact_link!(ctx, { account_id: "acct_1", employee_id: "emp_1", artifact_id: artifactId });
    expect(link.status).toBe("ok");
    expect(String(link.proof.url)).toContain(artifactId);

    const appr = await estimateTools.request_approval!(ctx, { account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", summary: "send", risk_level: "medium" });
    expect(appr.status).toBe("needs_confirmation");
    const approvalId = appr.proof.approval_id as string;

    const resolved = await estimateTools.resolve_approval!(ctx, { account_id: "acct_1", employee_id: "emp_1", approval_id: approvalId, owner_response: "approved" });
    expect(resolved.status).toBe("ok");
    expect(resolved.proof.resolution).toBe("approved");

    const status = await estimateTools.get_approval_status!(ctx, { account_id: "acct_1", employee_id: "emp_1", approval_id: approvalId });
    expect(status.proof.resolution).toBe("approved");
  });

  it("cannot sign a link before the PDF is stored", async () => {
    const db = seed();
    const ctx = ctxFor(db, "acct_1", "emp_1");
    const created = await estimateTools.create_estimate_artifact!(ctx, { account_id: "acct_1", employee_id: "emp_1", estimate_payload: PAYLOAD });
    const link = await estimateTools.create_signed_artifact_link!(ctx, { account_id: "acct_1", employee_id: "emp_1", artifact_id: created.proof.artifact_id as string });
    expect(link.status).toBe("failed");
  });

  it("rejects double resolution and the reject path", async () => {
    const db = seed();
    const ctx = ctxFor(db, "acct_1", "emp_1");
    const appr = await estimateTools.request_approval!(ctx, { account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", summary: "send", risk_level: "high" });
    const approvalId = appr.proof.approval_id as string;
    const first = await estimateTools.resolve_approval!(ctx, { account_id: "acct_1", employee_id: "emp_1", approval_id: approvalId, owner_response: "rejected" });
    expect(first.proof.resolution).toBe("rejected");
    const second = await estimateTools.resolve_approval!(ctx, { account_id: "acct_1", employee_id: "emp_1", approval_id: approvalId, owner_response: "approved" });
    expect(second.status).toBe("failed");
  });

  it("denies cross-account artifact creation", async () => {
    const db = seed();
    // emp_2 belongs to acct_2; calling it under acct_1 must be unauthorized.
    const ctx = ctxFor(db, "acct_1", "emp_2");
    const created = await estimateTools.create_estimate_artifact!(ctx, { account_id: "acct_1", employee_id: "emp_2", estimate_payload: PAYLOAD });
    expect(created.status).toBe("failed");
    expect(created.proof.failure_code).toBe("unauthorized");
  });
});
