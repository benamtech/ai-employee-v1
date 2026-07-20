import { createHash, randomBytes } from "node:crypto";
import {
  OnboardingManifest,
  gatewayPort,
  pending,
  failed,
  type ProvisionEmployeeInput,
  type ToolName,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { checkFeature } from "../lib/entitlements.js";
import { onboardingIdentityDecision } from "../lib/onboarding-identity.js";
import { isLocalRuntimeBackendAllowed, resolveRuntimeBackend } from "../lib/runtime-backend.js";
import { sealSecret } from "../lib/secrets.js";
import { canonicalProvisioningGraph } from "../lib/provisioning-state-machine.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_missing`);
  return value;
}

function stableId(prefix: string, seed: string): string {
  return `${prefix}_${createHash("sha256").update(seed).digest("hex").slice(0, 32)}`;
}

function clientSlug(employeeId: string): string {
  return employeeId.replace(/^emp_/, "client-").slice(0, 40);
}

function publicTwilioWebhookUrl(employeeId: string): string {
  const webhookBase = process.env.SMS_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (webhookBase) return `${webhookBase}/${employeeId}`;
  const managerOrigin = (process.env.MANAGER_API_ORIGIN ?? "https://api.amtechai.com").replace(/\/$/, "");
  return `${managerOrigin}/webhooks/twilio/${employeeId}`;
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

const provisionVerifiedEmployee: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "provision_employee");
  const input = raw as ProvisionEmployeeInput;
  if (!input?.account_id || !input.manifest || !input.idempotency_key) {
    return failed("validation_failed", "account_id, manifest, and idempotency_key are required.", { account_id: input?.account_id ?? null });
  }
  if (ctx.principal_class !== "human" || !ctx.principal_id || ctx.account_id !== input.account_id) {
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "denied",
      details: { reason: "verified_owner_principal_required" },
    });
    return failed("unauthorized", "A verified owner session is required before employee activation.", { account_id: input.account_id, audit_id: auditId });
  }

  const parsed = OnboardingManifest.safeParse({ ...input.manifest, account_id: input.account_id });
  if (!parsed.success) {
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "failed",
      details: { reason: "manifest_invalid", issues: parsed.error.issues },
    });
    return failed("validation_failed", "Manifest is invalid.", { account_id: input.account_id, audit_id: auditId });
  }

  const identity = await onboardingIdentityDecision(ctx.db, input.account_id, ctx.principal_id);
  if (!identity.allowed || !identity.identityId || !identity.policyVersion) {
    const reason = identity.error ?? "identity_unverified";
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "denied",
      details: { reason, owner_principal_id: ctx.principal_id },
    });
    return failed("unauthorized", reason, {
      account_id: input.account_id,
      proof: { failure_state: reason },
      audit_id: auditId,
    });
  }

  const manifest = parsed.data;
  const packageKey = manifest.profile_package_key ?? "contractor_estimator";
  const runtimeBackend = resolveRuntimeBackend();
  if (runtimeBackend === "local" && !isLocalRuntimeBackendAllowed()) {
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "denied",
      details: { reason: "runtime_backend_not_allowed", runtime_backend: runtimeBackend },
    });
    return failed("unauthorized", "This deployment is not configured to provision employees on the local runtime backend.", { account_id: input.account_id, audit_id: auditId });
  }

  try {
    const seed = `${input.account_id}\u001f${input.idempotency_key}`;
    const employeeId = stableId("emp", `employee:${seed}`);
    const manifestId = stableId("man", `manifest:${seed}`);
    const buildId = stableId("build", `profile-build:${seed}`);
    const jobId = stableId("pjob", `provisioning-job:${seed}`);
    const portBase = Number(process.env.HERMES_GATEWAY_PORT_BASE ?? 8100);
    const portOffset = Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 6), 16) % 1000 + 1;
    const port = gatewayPort(portBase, portOffset);
    const workspaceDir = `${requiredEnv("AMTECH_CLIENTS_DIR")}/${employeeId}/workspace`;
    const resourceGraph = canonicalProvisioningGraph({ account_id: input.account_id, employee_id: employeeId, manifest_id: manifestId });
    const workerContext = {
      base_idempotency_key: input.idempotency_key,
      manifest_id: manifestId,
      build_id: buildId,
      package_key: packageKey,
      runtime_backend: runtimeBackend,
      gateway_port: port,
      workspace_dir: workspaceDir,
      webhook_url: publicTwilioWebhookUrl(employeeId),
      client_id: clientSlug(employeeId),
      api_server_key_ref: sealSecret(randomBytes(32).toString("base64url")),
      effect_keys: {},
    };
    const facts = [
      ...manifest.pricing_facts.map((fact) => ({ key: fact.key, value: fact.value, category: "pricing", source_ref: fact.source_snippet ?? null, confidence: fact.confidence })),
      ...manifest.branding_facts.map((fact) => ({ key: fact.key, value: fact.value, category: "branding", source_ref: fact.source_snippet ?? null, confidence: fact.confidence })),
      ...manifest.customer_job_facts.map((fact) => ({ key: fact.key, value: fact.value, category: "customer", source_ref: fact.source_snippet ?? null, confidence: fact.confidence })),
    ];
    const activation = await ctx.db.rpc("amtech_activate_verified_employee", {
      p_identity_id: identity.identityId,
      p_account_id: input.account_id,
      p_owner_principal_id: ctx.principal_id,
      p_employee_name: manifest.employee_name,
      p_profile_package_key: packageKey,
      p_manifest: manifest,
      p_raw_answers: manifest.seven_question_answers ?? {},
      p_transcript_ref: input.transcript_ref ?? manifest.transcript_ref ?? null,
      p_worker_context: workerContext,
      p_resource_graph: resourceGraph,
      p_facts: facts,
      p_idempotency_key: input.idempotency_key,
      p_policy_version: "authorization-v1",
      p_correlation_id: `onboarding:${identity.identityId}:${input.idempotency_key}`,
    });
    if (activation.error) throw activation.error;
    const row = firstRow<Record<string, unknown>>(activation.data);
    if (!row?.employee_id || !row.assignment_id || !row.command_id || !row.receipt_id || !row.provisioning_job_id) {
      throw new Error("onboarding_activation_receipt_missing");
    }
    const assignmentId = String(row.assignment_id);
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: String(row.employee_id),
      assignment_id: assignmentId,
      actor: ctx.actor,
      action: "tool:provision_employee",
      resource: String(row.employee_id),
      result: "ok",
      details: {
        onboarding_identity_id: identity.identityId,
        provisioning_job_id: row.provisioning_job_id,
        command_id: row.command_id,
        receipt_id: row.receipt_id,
        duplicate: Boolean(row.duplicate),
        runtime_owner: "hermes",
      },
    });
    return pending({
      account_id: input.account_id,
      employee_id: String(row.employee_id),
      assignment_id: assignmentId,
      changed_resources: [
        `employee:${String(row.employee_id)}`,
        `assignment:${assignmentId}`,
        `provisioning_job:${String(row.provisioning_job_id)}`,
      ],
      proof: {
        onboarding_identity_id: identity.identityId,
        employee_principal_id: String(row.employee_principal_id),
        provisioning_job_id: String(row.provisioning_job_id),
        command_id: String(row.command_id),
        receipt_id: String(row.receipt_id),
        receipt_status: "accepted",
        receipt_durable: true,
        duplicate: Boolean(row.duplicate),
        reconciler_owned: true,
      },
      user_facing_summary_hint: "Verified employee activation is committed; Hermes runtime provisioning is queued.",
      next_suggested_action: "Poll provisioning status.",
      audit_id: auditId,
    });
  } catch (error) {
    const message = String((error as Error).message ?? error).slice(0, 500);
    const rejected = message.includes("identity_rejected_permanent");
    const unverified = message.includes("identity_unverified");
    const auditId = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: rejected || unverified ? "denied" : "failed",
      details: { reason: message, owner_principal_id: ctx.principal_id },
    });
    return failed(rejected || unverified ? "unauthorized" : "provider_error", message, {
      account_id: input.account_id,
      proof: { failure_state: message },
      audit_id: auditId,
    });
  }
};

export const verifiedProvisioningTools: Partial<Record<ToolName, ToolHandler>> = {
  provision_employee: provisionVerifiedEmployee,
};
