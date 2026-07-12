/** Estimate, artifact & approval tools. Brain tools used at seed time in Phase 1;
 *  estimate/artifact/approval consumers are Phase 2. Spec: 04-manager-tools.md. */
import {
  ID_PREFIX,
  artifactRoute,
  failed,
  needsConfirmation,
  newId,
  ok,
  requiresOwnerAuthenticatedResolution,
  type CreateEstimateArtifactInput,
  type CreateSignedArtifactLinkInput,
  type GetApprovalStatusInput,
  type RenderEstimatePdfInput,
  type RequestApprovalInput,
  type ResolveApprovalInput,
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
import { buildBusinessBrainIndex } from "../lib/business-brain.js";

async function employeeBelongsToAccount(ctx: Parameters<ToolHandler>[0], account_id: string, employee_id: string): Promise<boolean> {
  const { data } = await ctx.db
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("account_id", account_id)
    .maybeSingle();
  return Boolean(data);
}

function ownerWebOrigin(): string {
  return (process.env.AGENT_WEB_ORIGIN ?? process.env.PUBLIC_WEB_ORIGIN ?? "").replace(/\/$/, "");
}

function artifactUrl(employee_id: string, artifact_id: string, token?: string): string {
  const path = artifactRoute(employee_id, artifact_id);
  const withToken = token ? `${path}?t=${encodeURIComponent(token)}` : path;
  const origin = ownerWebOrigin();
  return origin ? `${origin}${withToken}` : withToken;
}

function normalizeApprovalResolution(input: string): "approved" | "rejected" | null {
  const v = input.toLowerCase();
  if (v === "approved" || v === "yes" || v === "y") return "approved";
  if (v === "rejected" || v === "no" || v === "n") return "rejected";
  return null;
}

const getBusinessBrain: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id?: string; employee_id?: string };
  if (!input?.account_id || !input?.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
  }
  const index = await buildBusinessBrainIndex(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:get_business_brain",
    result: "ok",
    details: index.proof,
  });
  return {
    ...ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      proof: index.proof,
      user_facing_summary_hint: "Business brain index loaded.",
      changed_resources: [],
      audit_id,
    }),
    brain_index: index.brain_index,
    resources: index.resources,
  };
};

const saveBusinessBrainFact: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id?: string;
    employee_id?: string;
    fact?: { key?: string; value?: string; category?: string; confidence?: string };
    source_ref?: string;
  };
  if (!input?.account_id || !input?.employee_id || !input.fact?.key || !input.fact?.value) {
    return failed("validation_failed", "account_id, employee_id, fact.key, and fact.value are required.");
  }
  const id = newId(ID_PREFIX.brainFact);
  await ctx.db.from("business_brain_facts").upsert({
    id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    fact_key: input.fact.key,
    fact_value: input.fact.value,
    category: input.fact.category ?? "general",
    source: "work",
    source_ref: input.source_ref ?? null,
    confidence: input.fact.confidence ?? "medium",
    updated_at: new Date().toISOString(),
  }, { onConflict: "employee_id,fact_key" });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:save_business_brain_fact",
    resource: id,
    result: "ok",
    details: { fact_key: input.fact.key, category: input.fact.category ?? "general" },
  });
  return ok({
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`business_brain_fact:${id}`],
    proof: { fact_id: id },
    user_facing_summary_hint: "Business brain fact saved.",
    audit_id,
  });
};

const createEstimateArtifact: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateEstimateArtifactInput;
  if (!input?.account_id || !input?.employee_id || !input.estimate_payload?.job_description) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      employee_id: input?.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:create_estimate_artifact",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, and estimate_payload.job_description are required.", { audit_id });
  }
  if (!Array.isArray(input.estimate_payload.line_items) || input.estimate_payload.line_items.length === 0) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:create_estimate_artifact",
      result: "failed",
      details: { reason: "line_items_required" },
    });
    return failed("validation_failed", "At least one estimate line item is required.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:create_estimate_artifact",
      result: "denied",
      details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  const artifactId = newId(ID_PREFIX.artifact);
  await ctx.db.from("artifacts").insert({
    id: artifactId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    kind: "estimate",
    mime_type: "application/pdf",
    storage_ref: null,
    created_run: input.created_run ?? null,
    payload: input.estimate_payload,
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:create_estimate_artifact",
    resource: artifactId,
    result: "ok",
    details: {
      kind: "estimate",
      line_item_count: input.estimate_payload.line_items.length,
      recommended_total: input.estimate_payload.recommended_total,
    },
  });
  return ok({
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`artifact:${artifactId}`],
    proof: { artifact_id: artifactId },
    user_facing_summary_hint: "Estimate artifact created.",
    next_suggested_action: "Render and store the PDF, then create a signed owner link.",
    audit_id,
  });
};

const renderEstimatePdf: ToolHandler = async (ctx, raw) => {
  const input = raw as RenderEstimatePdfInput;
  if (!input?.account_id || !input?.employee_id || !input?.artifact_id || !input?.filename || !input?.pdf_base64) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      employee_id: input?.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:render_estimate_pdf",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, artifact_id, filename, and pdf_base64 are required.", { audit_id });
  }
  const { data: artifact } = await ctx.db
    .from("artifacts")
    .select("*")
    .eq("id", input.artifact_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (!artifact) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:render_estimate_pdf",
      result: "failed",
      details: { reason: "artifact_not_found" },
    });
    return failed("validation_failed", "Estimate artifact not found.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

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
    await ctx.db
      .from("artifacts")
      .update({ storage_ref, mime_type: "application/pdf" })
      .eq("id", input.artifact_id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:render_estimate_pdf",
      resource: input.artifact_id,
      result: "ok",
      details: { storage_ref, byte_length: pdf.length, checksum_sha256: input.checksum_sha256 ?? null },
    });
    return ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`artifact:${input.artifact_id}`],
      proof: { artifact_id: input.artifact_id, storage_ref, byte_length: pdf.length },
      user_facing_summary_hint: "Estimate PDF stored.",
      next_suggested_action: "Create a signed owner link.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:render_estimate_pdf",
      resource: input.artifact_id,
      result: "failed",
      details: { reason: "pdf_store_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Could not store estimate PDF.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

const createSignedArtifactLink: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateSignedArtifactLinkInput;
  if (!input?.account_id || !input?.employee_id || !input?.artifact_id) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      employee_id: input?.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:create_signed_artifact_link",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, and artifact_id are required.", { audit_id });
  }
  const { data: artifact } = await ctx.db
    .from("artifacts")
    .select("*")
    .eq("id", input.artifact_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (!artifact?.storage_ref) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:create_signed_artifact_link",
      result: "failed",
      details: { reason: "artifact_pdf_missing" },
    });
    return failed("validation_failed", "Artifact PDF is not stored yet.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  const ttl = artifactLinkTtlSeconds(input.expiry_seconds);
  const expires = new Date(Date.now() + ttl * 1000);
  const token = mintSignedToken("artifact_link", input.artifact_id, ttl, {
    employee_id: input.employee_id,
    account_id: input.account_id,
  });
  const linkId = newId(ID_PREFIX.artifactLink);
  await ctx.db.from("artifact_links").insert({
    id: linkId,
    artifact_id: input.artifact_id,
    token_hash: tokenHash(token),
    audience: input.audience ?? "owner",
    expires_at: expires.toISOString(),
  });
  const url = artifactUrl(input.employee_id, input.artifact_id, token);
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:create_signed_artifact_link",
    resource: linkId,
    result: "ok",
    details: { artifact_id: input.artifact_id, audience: input.audience ?? "owner", expires_at: expires.toISOString() },
  });
  return ok({
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`artifact_link:${linkId}`],
    proof: { artifact_id: input.artifact_id, artifact_link_id: linkId, url, expires_at: expires.toISOString() },
    user_facing_summary_hint: "Signed estimate link created.",
    next_suggested_action: "Send the owner the link and ask whether to approve sending it by email.",
    audit_id,
  });
};

const requestApproval: ToolHandler = async (ctx, raw) => {
  const input = raw as RequestApprovalInput;
  if (!input?.account_id || !input?.employee_id || !input?.action_key || !input?.summary || !input?.risk_level) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      employee_id: input?.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:request_approval",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, action_key, summary, and risk_level are required.", { audit_id });
  }
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:request_approval",
      result: "denied",
      details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  const approvalId = newId(ID_PREFIX.approval);
  const ttl = input.expiry_seconds ? Math.max(60, Math.min(input.expiry_seconds, 7 * 24 * 60 * 60)) : 24 * 60 * 60;
  const expires = new Date(Date.now() + ttl * 1000);
  await ctx.db.from("approvals").insert({
    id: approvalId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    action_key: input.action_key,
    summary: input.summary,
    risk_level: input.risk_level,
    refs: input.refs ?? {},
    channel: input.channel ?? null,
    expires_at: expires.toISOString(),
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:request_approval",
    resource: approvalId,
    result: "needs_confirmation",
    details: { action_key: input.action_key, risk_level: input.risk_level },
  });
  return needsConfirmation({
    action_key: input.action_key,
    summary: input.summary,
    risk_level: input.risk_level,
    refs: input.refs ?? {},
    approval_id: approvalId,
  }, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`approval:${approvalId}`],
    proof: { approval_id: approvalId, expires_at: expires.toISOString() },
    user_facing_summary_hint: input.summary,
    next_suggested_action: "Wait for the owner to approve or reject.",
    audit_id,
  });
};

const resolveApproval: ToolHandler = async (ctx, raw) => {
  const input = raw as ResolveApprovalInput;
  const resolution = normalizeApprovalResolution(String(input?.owner_response ?? ""));
  if (!input?.account_id || !input?.employee_id || !input?.approval_id || !resolution) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      employee_id: input?.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, approval_id, and approved/rejected owner_response are required.", { audit_id });
  }
  const { data: approval } = await ctx.db
    .from("approvals")
    .select("*")
    .eq("id", input.approval_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (!approval) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      result: "failed",
      details: { reason: "approval_not_found" },
    });
    return failed("validation_failed", "Approval not found.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  if (approval.resolution) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: input.approval_id,
      result: "failed",
      details: { reason: "approval_already_resolved", resolution: approval.resolution },
    });
    return failed("validation_failed", "Approval is already resolved.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  if (approval.expires_at && new Date(approval.expires_at).getTime() < Date.now()) {
    await ctx.db.from("approvals").update({ resolution: "expired", resolved_at: new Date().toISOString() }).eq("id", input.approval_id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: input.approval_id,
      result: "failed",
      details: { reason: "approval_expired" },
    });
    return failed("validation_failed", "Approval expired.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  if (ctx.actor === "employee" && requiresOwnerAuthenticatedResolution(approval)) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: input.approval_id,
      result: "denied",
      details: { reason: "owner_authenticated_resolution_required", action_key: approval.action_key, risk_level: approval.risk_level ?? null },
    });
    return failed("unauthorized", "This approval requires an owner-authenticated web or signed-link action.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  await ctx.db.from("approvals").update({
    resolution,
    resolved_at: new Date().toISOString(),
    channel: input.channel ?? approval.channel ?? null,
  }).eq("id", input.approval_id);
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:resolve_approval",
    resource: input.approval_id,
    result: "ok",
    details: { resolution },
  });
  return ok({
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`approval:${input.approval_id}`],
    proof: { approval_id: input.approval_id, resolution },
    user_facing_summary_hint: `Approval ${resolution}.`,
    next_suggested_action: resolution === "approved" ? "Proceed with the approved action." : "Do not proceed with the gated action.",
    audit_id,
  });
};

const getApprovalStatus: ToolHandler = async (ctx, raw) => {
  const input = raw as GetApprovalStatusInput;
  if (!input?.account_id || !input?.employee_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, and approval_id are required.");
  }
  const { data: approval } = await ctx.db
    .from("approvals")
    .select("*")
    .eq("id", input.approval_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (!approval) return failed("validation_failed", "Approval not found.", { account_id: input.account_id, employee_id: input.employee_id });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:get_approval_status",
    resource: input.approval_id,
    result: "ok",
    details: { resolution: approval.resolution ?? null },
  });
  return ok({
    account_id: input.account_id,
    employee_id: input.employee_id,
    proof: {
      approval_id: input.approval_id,
      resolution: approval.resolution ?? null,
      action_key: approval.action_key,
      expires_at: approval.expires_at ?? null,
    },
    user_facing_summary_hint: approval.resolution ? `Approval ${approval.resolution}.` : "Approval is pending.",
    audit_id,
  });
};

export const estimateTools: Partial<Record<ToolName, ToolHandler>> = {
  get_business_brain: getBusinessBrain,
  save_business_brain_fact: saveBusinessBrainFact,
  create_estimate_artifact: createEstimateArtifact,
  render_estimate_pdf: renderEstimatePdf,
  create_signed_artifact_link: createSignedArtifactLink,
  // Approval primitive (powers SMS "yes" + web button). Consumers: Phase 2+.
  request_approval: requestApproval,
  resolve_approval: resolveApproval,
  get_approval_status: getApprovalStatus,
};
