import {
  ID_PREFIX,
  artifactRoute,
  failed,
  newId,
  ok,
  type CreateEstimateArtifactInput,
  type CreateSignedArtifactLinkInput,
  type RenderEstimatePdfInput,
  type ToolName,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import {
  artifactLinkTtlSeconds,
  artifactStoragePath,
  decodePdfBase64,
  sanitizeFilename,
  uploadArtifactPdf,
} from "../lib/artifacts.js";
import { mintSignedToken, tokenHash } from "../lib/signed-links.js";
import { authorizeEmployeeTool } from "../lib/employee-assignment-authority.js";

function ownerWebOrigin(): string {
  return (process.env.AGENT_WEB_ORIGIN ?? process.env.PUBLIC_WEB_ORIGIN ?? "").replace(/\/$/, "");
}

function artifactUrl(employeeId: string, artifactId: string, token?: string): string {
  const path = artifactRoute(employeeId, artifactId);
  const withToken = token ? `${path}?t=${encodeURIComponent(token)}` : path;
  const origin = ownerWebOrigin();
  return origin ? `${origin}${withToken}` : withToken;
}

const createEstimateArtifact: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateEstimateArtifactInput;
  if (!input?.account_id || !input?.employee_id || !input.estimate_payload?.job_description) {
    return failed("validation_failed", "account_id, employee_id, and estimate_payload.job_description are required.");
  }
  if (!Array.isArray(input.estimate_payload.line_items) || input.estimate_payload.line_items.length === 0) {
    return failed("validation_failed", "At least one estimate line item is required.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
    });
  }
  const authority = await authorizeEmployeeTool(ctx.db, ctx, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    action: "artifact:create",
  });
  if (!authority.ok) {
    return failed("unauthorized", "Employee assignment is not authorized to create this artifact.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      proof: { denial_reason: authority.reason },
    });
  }
  const assignmentId = authority.assignment.assignment_id;
  const artifactId = newId(ID_PREFIX.artifact);
  const inserted = await ctx.db.from("artifacts").insert({
    id: artifactId,
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    kind: "estimate",
    mime_type: "application/pdf",
    storage_ref: null,
    created_run: input.created_run ?? null,
    payload: input.estimate_payload,
  });
  if (inserted.error) throw inserted.error;
  const audit_id = await writeAudit(ctx.db, {
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:create_estimate_artifact",
    resource: artifactId,
    result: "ok",
    details: { line_item_count: input.estimate_payload.line_items.length },
  });
  return ok({
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`artifact:${artifactId}`],
    proof: { artifact_id: artifactId, assignment_id: assignmentId },
    user_facing_summary_hint: "Estimate artifact created.",
    next_suggested_action: "Render and store the PDF, then create a signed owner link.",
    audit_id,
  });
};

const renderEstimatePdf: ToolHandler = async (ctx, raw) => {
  const input = raw as RenderEstimatePdfInput;
  if (!input?.account_id || !input?.employee_id || !input?.artifact_id || !input?.filename || !input?.pdf_base64) {
    return failed("validation_failed", "account_id, employee_id, artifact_id, filename, and pdf_base64 are required.");
  }
  const authority = await authorizeEmployeeTool(ctx.db, ctx, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    action: "artifact:render",
  });
  if (!authority.ok) return failed("unauthorized", "Artifact render is outside this assignment.", {
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: ctx.assignment_id ?? null,
    proof: { denial_reason: authority.reason },
  });
  const artifact = await ctx.db.from("artifacts")
    .select("id,assignment_id")
    .eq("id", input.artifact_id)
    .eq("assignment_id", authority.assignment.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  if (!artifact.data?.id) return failed("validation_failed", "Estimate artifact not found in this assignment.", {
    assignment_id: authority.assignment.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
  });
  try {
    const pdf = decodePdfBase64(input.pdf_base64, input.checksum_sha256);
    const filename = sanitizeFilename(input.filename);
    const storage_ref = artifactStoragePath({
      account_id: input.account_id,
      employee_id: input.employee_id,
      artifact_id: input.artifact_id,
      filename,
    });
    await uploadArtifactPdf(ctx.db, storage_ref, pdf);
    const updated = await ctx.db.from("artifacts")
      .update({ storage_ref, mime_type: "application/pdf" })
      .eq("id", input.artifact_id)
      .eq("assignment_id", authority.assignment.assignment_id);
    if (updated.error) throw updated.error;
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: authority.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:render_estimate_pdf",
      resource: input.artifact_id,
      result: "ok",
      details: { storage_ref, byte_length: pdf.length, checksum_sha256: input.checksum_sha256 ?? null },
    });
    return ok({
      assignment_id: authority.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`artifact:${input.artifact_id}`],
      proof: { artifact_id: input.artifact_id, storage_ref, byte_length: pdf.length },
      user_facing_summary_hint: "Estimate PDF stored.",
      next_suggested_action: "Create a signed owner link.",
      audit_id,
    });
  } catch (error) {
    return failed("provider_error", "Could not store estimate PDF.", {
      assignment_id: authority.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      proof: { failure_reason: String((error as Error).message ?? error) },
    });
  }
};

const createSignedArtifactLink: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateSignedArtifactLinkInput;
  if (!input?.account_id || !input?.employee_id || !input?.artifact_id) {
    return failed("validation_failed", "account_id, employee_id, and artifact_id are required.");
  }
  const authority = await authorizeEmployeeTool(ctx.db, ctx, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    action: "artifact_link:create",
  });
  if (!authority.ok) return failed("unauthorized", "Artifact link creation is outside this assignment.", {
    assignment_id: ctx.assignment_id ?? null,
    account_id: input.account_id,
    employee_id: input.employee_id,
    proof: { denial_reason: authority.reason },
  });
  const assignmentId = authority.assignment.assignment_id;
  const artifact = await ctx.db.from("artifacts")
    .select("id,assignment_id,storage_ref")
    .eq("id", input.artifact_id)
    .eq("assignment_id", assignmentId)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  if (!artifact.data?.storage_ref) return failed("validation_failed", "Artifact PDF is not stored yet.", {
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
  });
  const ttl = artifactLinkTtlSeconds(input.expiry_seconds);
  const expires = new Date(Date.now() + ttl * 1000);
  const token = mintSignedToken("artifact_link", input.artifact_id, ttl, {
    assignment_id: assignmentId,
    employee_id: input.employee_id,
    account_id: input.account_id,
  });
  const linkId = newId(ID_PREFIX.artifactLink);
  const inserted = await ctx.db.from("artifact_links").insert({
    id: linkId,
    assignment_id: assignmentId,
    artifact_id: input.artifact_id,
    token_hash: tokenHash(token),
    audience: input.audience ?? "owner",
    expires_at: expires.toISOString(),
  });
  if (inserted.error) throw inserted.error;
  const url = artifactUrl(input.employee_id, input.artifact_id, token);
  const audit_id = await writeAudit(ctx.db, {
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:create_signed_artifact_link",
    resource: linkId,
    result: "ok",
    details: { artifact_id: input.artifact_id, audience: input.audience ?? "owner", expires_at: expires.toISOString() },
  });
  return ok({
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`artifact_link:${linkId}`],
    proof: { artifact_id: input.artifact_id, artifact_link_id: linkId, signed_url: url, expires_at: expires.toISOString() },
    user_facing_summary_hint: "Signed artifact link created.",
    audit_id,
  });
};

export const assignmentArtifactTools: Partial<Record<ToolName, ToolHandler>> = {
  create_estimate_artifact: createEstimateArtifact,
  render_estimate_pdf: renderEstimatePdf,
  create_signed_artifact_link: createSignedArtifactLink,
};
