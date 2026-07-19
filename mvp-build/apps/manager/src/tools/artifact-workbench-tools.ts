import { z } from "zod";
import { failed, ok } from "@amtech/shared";
import type { ToolContext, ToolHandler } from "./types.js";
import { authorizeEmployeeTool } from "../lib/employee-assignment-authority.js";
import { writeAudit } from "../lib/audit.js";
import {
  createArtifactRevision,
  loadArtifactRevisionHistory,
  publishArtifactToSandbox,
  validateArtifactRevision,
  verifyArtifactPublication,
} from "../lib/artifact-revisions.js";
import { executeApprovedAction, loadApprovalAuthority } from "../lib/approval-authority.js";

export const ARTIFACT_WORKBENCH_TOOL_NAMES = [
  "create_artifact_revision",
  "validate_artifact_revision",
  "get_artifact_history",
  "publish_artifact_sandbox",
  "verify_artifact_publication",
] as const;
export type ArtifactWorkbenchToolName = (typeof ARTIFACT_WORKBENCH_TOOL_NAMES)[number];

const owner = { account_id: z.string().min(1), employee_id: z.string().min(1) };
const validation = z.object({
  validator_key: z.string().min(1),
  status: z.enum(["passed", "failed", "warning", "skipped"]),
  summary: z.string().min(1),
  evidence: z.record(z.unknown()).optional(),
}).passthrough();

const SCHEMAS: Record<ArtifactWorkbenchToolName, z.ZodTypeAny> = {
  create_artifact_revision: z.object({
    ...owner,
    artifact_id: z.string().min(1).optional(),
    kind: z.string().min(1),
    payload: z.record(z.unknown()),
    mime_type: z.string().optional(),
    storage_ref: z.string().optional(),
    source_manifest: z.record(z.unknown()).optional(),
    created_run: z.string().optional(),
  }).passthrough(),
  validate_artifact_revision: z.object({
    ...owner,
    artifact_id: z.string().min(1),
    revision_id: z.string().min(1).optional(),
    validations: z.array(validation).min(1),
  }).passthrough(),
  get_artifact_history: z.object({ ...owner, artifact_id: z.string().min(1) }).passthrough(),
  publish_artifact_sandbox: z.object({
    ...owner,
    artifact_id: z.string().min(1),
    approval_id: z.string().min(1),
  }).passthrough(),
  verify_artifact_publication: z.object({
    ...owner,
    artifact_id: z.string().min(1),
    observed_ref: z.string().min(1),
  }).passthrough(),
};

export function isArtifactWorkbenchToolName(value: string): value is ArtifactWorkbenchToolName {
  return (ARTIFACT_WORKBENCH_TOOL_NAMES as readonly string[]).includes(value);
}

export function getArtifactWorkbenchToolSchema(name: string): z.ZodTypeAny | null {
  return isArtifactWorkbenchToolName(name) ? SCHEMAS[name] : null;
}

async function authority(
  ctx: ToolContext,
  input: { account_id: string; employee_id: string },
  action: "artifact:create" | "artifact:render",
) {
  return authorizeEmployeeTool(ctx.db, ctx, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    action,
    resource_class: "employee",
    resource_id: input.employee_id,
  });
}

const createRevision: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id: string; employee_id: string; artifact_id?: string; kind: string;
    payload: Record<string, unknown>; mime_type?: string; storage_ref?: string;
    source_manifest?: Record<string, unknown>; created_run?: string;
  };
  const authorized = await authority(ctx, input, "artifact:create");
  if (!authorized.ok) return failed("unauthorized", "Artifact revision is outside this assignment.", {
    account_id: input.account_id, employee_id: input.employee_id, assignment_id: ctx.assignment_id ?? null,
    proof: { denial_reason: authorized.reason },
  });
  try {
    const revision = await createArtifactRevision(ctx.db, {
      ...input,
      assignment_id: authorized.assignment.assignment_id,
      mime_type: input.mime_type ?? null,
      storage_ref: input.storage_ref ?? null,
      created_run: input.created_run ?? null,
      created_by: `employee:${ctx.principal_id ?? "unknown"}`,
    });
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:create_artifact_revision",
      resource: revision.artifact_id,
      result: "ok",
      details: { revision_id: revision.revision_id, revision_number: revision.revision_number, content_sha256: revision.content_sha256 },
    });
    return ok({
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`artifact:${revision.artifact_id}`, `artifact_revision:${revision.revision_id}`],
      proof: revision,
      user_facing_summary_hint: revision.revision_number === 1 ? "Artifact project created." : `Artifact revision ${revision.revision_number} saved.`,
      next_suggested_action: "Validate the current revision before requesting publish approval.",
      audit_id,
    });
  } catch (error) {
    return failed("validation_failed", "Artifact revision could not be saved.", {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      proof: { failure_reason: String((error as Error).message ?? error) },
    });
  }
};

const validateRevision: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id: string; employee_id: string; artifact_id: string; revision_id?: string;
    validations: Array<{ validator_key: string; status: "passed" | "failed" | "warning" | "skipped"; summary: string; evidence?: Record<string, unknown> }>;
  };
  const authorized = await authority(ctx, input, "artifact:render");
  if (!authorized.ok) return failed("unauthorized", "Artifact validation is outside this assignment.", {
    account_id: input.account_id, employee_id: input.employee_id, assignment_id: ctx.assignment_id ?? null,
    proof: { denial_reason: authorized.reason },
  });
  const result = await validateArtifactRevision(ctx.db, {
    ...input,
    assignment_id: authorized.assignment.assignment_id,
  });
  const audit_id = await writeAudit(ctx.db, {
    assignment_id: authorized.assignment.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:validate_artifact_revision",
    resource: input.artifact_id,
    result: result.status === "failed" ? "failed" : "ok",
    details: { revision_id: result.revision_id, validation_status: result.status, validation_ids: result.validation_ids },
  });
  return ok({
    assignment_id: authorized.assignment.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    changed_resources: [`artifact:${input.artifact_id}`, ...result.validation_ids.map((id) => `artifact_validation:${id}`)],
    proof: result,
    user_facing_summary_hint: result.status === "passed" ? "Artifact validation passed." : `Artifact validation recorded: ${result.status}.`,
    next_suggested_action: result.status === "passed" ? "Request owner approval for the exact current artifact revision." : "Revise the artifact and validate again.",
    audit_id,
  });
};

const getHistory: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; artifact_id: string };
  const authorized = await authority(ctx, input, "artifact:render");
  if (!authorized.ok) return failed("unauthorized", "Artifact history is outside this assignment.");
  const history = await loadArtifactRevisionHistory(ctx.db, input.artifact_id, authorized.assignment.assignment_id);
  return ok({
    assignment_id: authorized.assignment.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    proof: { artifact_id: input.artifact_id, ...history },
    user_facing_summary_hint: `Loaded ${history.revisions.length} artifact revisions.`,
  });
};

const publishSandbox: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; artifact_id: string; approval_id: string };
  const authorized = await authority(ctx, input, "artifact:render");
  if (!authorized.ok) return failed("unauthorized", "Artifact publish is outside this assignment.");
  const approval = await loadApprovalAuthority(ctx.db, input.approval_id);
  if (!approval || approval.assignment_id !== authorized.assignment.assignment_id || approval.account_id !== input.account_id || approval.employee_id !== input.employee_id) {
    return failed("unauthorized", "Publish approval is not bound to this assignment.");
  }
  if (approval.action_key !== "publish_artifact_sandbox" || approval.resource_class !== "artifact" || approval.resource_id !== input.artifact_id) {
    return failed("unauthorized", "Approval does not authorize this artifact publish.", {
      proof: { approval_action_key: approval.action_key, approval_resource_class: approval.resource_class, approval_resource_id: approval.resource_id },
    });
  }
  try {
    const execution = await executeApprovedAction(ctx.db, {
      approval_id: input.approval_id,
      action_key: "publish_artifact_sandbox",
      resource_class: "artifact",
      resource_id: input.artifact_id,
      provider: "amtech_sandbox",
      operation: "artifact.publish",
      capability_class: "consumer_dedupe",
      request: { artifact_id: input.artifact_id },
      apply: async () => {
        const published = await publishArtifactToSandbox(ctx.db, {
          ...input,
          assignment_id: authorized.assignment.assignment_id,
        });
        return {
          result: published,
          provider_receipt_id: published.publication_ref,
          evidence: { revision_id: published.revision_id, published_at: published.published_at },
        };
      },
    });
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:publish_artifact_sandbox",
      resource: input.artifact_id,
      result: "ok",
      details: { approval_id: input.approval_id, effect_receipt_id: execution.receipt_id, replayed: execution.replayed },
    });
    return ok({
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`artifact:${input.artifact_id}`, `effect_receipt:${execution.receipt_id}`],
      proof: { ...execution.result, approval_id: input.approval_id, effect_receipt_id: execution.receipt_id, idempotent: execution.replayed },
      user_facing_summary_hint: execution.replayed ? "The approved artifact was already published to the sandbox." : "Artifact published to the approved sandbox target.",
      next_suggested_action: "Verify the published target and record the observation receipt.",
      audit_id,
    });
  } catch (error) {
    return failed("provider_error", "Approved artifact publish did not complete.", {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      proof: { failure_reason: String((error as Error).message ?? error) },
    });
  }
};

const verifyPublication: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; artifact_id: string; observed_ref: string };
  const authorized = await authority(ctx, input, "artifact:render");
  if (!authorized.ok) return failed("unauthorized", "Artifact verification is outside this assignment.");
  try {
    const result = await verifyArtifactPublication(ctx.db, {
      ...input,
      assignment_id: authorized.assignment.assignment_id,
    });
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:verify_artifact_publication",
      resource: input.artifact_id,
      result: "ok",
      details: { publication_ref: result.publication_ref, receipt_id: result.receipt_id },
    });
    return ok({
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`artifact:${input.artifact_id}`, `artifact_validation:${result.receipt_id}`],
      proof: result,
      user_facing_summary_hint: "Published artifact verification passed.",
      next_suggested_action: "Present the verified artifact and receipts to the owner.",
      audit_id,
    });
  } catch (error) {
    return failed("provider_error", "Published artifact could not be verified.", {
      assignment_id: authorized.assignment.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      proof: { failure_reason: String((error as Error).message ?? error), observed_ref: input.observed_ref },
    });
  }
};

export const artifactWorkbenchTools: Record<ArtifactWorkbenchToolName, ToolHandler> = {
  create_artifact_revision: createRevision,
  validate_artifact_revision: validateRevision,
  get_artifact_history: getHistory,
  publish_artifact_sandbox: publishSandbox,
  verify_artifact_publication: verifyPublication,
};
