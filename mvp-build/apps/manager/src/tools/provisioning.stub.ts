/** Provisioning tools — claim-time profile creation + runtime proof. */
import {
  ID_PREFIX,
  OnboardingManifest,
  employeeWebRoute,
  gatewayPort,
  newId,
  ok,
  pending,
  failed,
  type ProvisionEmployeeInput,
  type GetProvisioningStatusInput,
  type ProvisionerRequest,
  type ProvisionerResult,
  type ToolName,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { randomBytes } from "node:crypto";
import { writeAudit } from "../lib/audit.js";
import { checkFeature } from "../lib/entitlements.js";
import { resolveRuntimeBackend } from "../lib/runtime-backend.js";
import { sealSecret } from "../lib/secrets.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function clientSlug(employeeId: string): string {
  return employeeId.replace(/^emp_/, "client-").slice(0, 40);
}

function hermesSessionKey(accountId: string, employeeId: string): string {
  return `amtech:v1:account:${accountId}:employee:${employeeId}`;
}

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((v): v is T => v !== undefined && v !== null);
}

function skipSmsProvisioning(): boolean {
  return process.env.PROVISIONER_SKIP_SMS === "1" || process.env.PROVISIONER_SKIP_SMS === "true";
}

async function callProvisioner(req: ProvisionerRequest): Promise<ProvisionerResult> {
  const origin = requiredEnv("PROVISIONER_ORIGIN").replace(/\/$/, "");
  const token = requiredEnv("PROVISIONER_TOKEN");
  const res = await fetch(`${origin}/provision`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });
  const json = (await res.json()) as ProvisionerResult;
  if (!res.ok || json.status !== "ok") {
    throw new Error(json.failure_state ?? `provisioner_${res.status}`);
  }
  return json;
}

const provisionEmployee: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "provision_employee");
  const input = raw as ProvisionEmployeeInput;
  if (!input?.account_id || !input?.manifest || !input?.idempotency_key) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, manifest, and idempotency_key are required.", { audit_id });
  }

  const parsed = OnboardingManifest.safeParse({ ...input.manifest, account_id: input.account_id });
  if (!parsed.success) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      actor: ctx.actor,
      action: "tool:provision_employee",
      result: "failed",
      details: { reason: "manifest_invalid", issues: parsed.error.issues },
    });
    return failed("validation_failed", "Manifest is invalid.", { account_id: input.account_id, audit_id });
  }
  const manifest = parsed.data;

  const existing = await ctx.db
    .from("provisioning_jobs")
    .select("*")
    .eq("idempotency_key", input.idempotency_key)
    .maybeSingle();
  if (existing.data) {
    return pending({
      account_id: input.account_id,
      employee_id: existing.data.employee_id ?? null,
      proof: { provisioning_job_id: existing.data.id, state: existing.data.state },
      user_facing_summary_hint: "Provisioning request already exists.",
      next_suggested_action: "Poll provisioning status.",
    });
  }

  const employeeId = newId(ID_PREFIX.employee);
  const manifestId = newId(ID_PREFIX.manifest);
  const jobId = newId(ID_PREFIX.provisioningJob);
  const buildId = newId(ID_PREFIX.profileBuild);
  const slug = clientSlug(employeeId);
  const portBase = Number(process.env.HERMES_GATEWAY_PORT_BASE ?? 8100);
  const port = gatewayPort(portBase, Math.floor(Math.random() * 1000) + 1);
  const baseDomain = process.env.PUBLIC_BASE_DOMAIN ?? "amtechai.com";
  const webhookUrl = `${process.env.MANAGER_API_ORIGIN ?? "https://api.amtechai.com"}/webhooks/twilio/${employeeId}`;
  const workspaceDir = `${requiredEnv("AMTECH_CLIENTS_DIR")}/${employeeId}/workspace`;
  const packageKey = manifest.profile_package_key ?? "contractor_estimator";
  const runtimeBackend = resolveRuntimeBackend();
  const apiServerKey = randomBytes(32).toString("base64url");

  await ctx.db.from("employees").insert({
    id: employeeId,
    account_id: input.account_id,
    name: manifest.employee_name,
    status: "provisioning",
    profile_package_key: packageKey,
    web_route: employeeWebRoute(employeeId),
  });
  await ctx.db.from("employee_manifests").insert({
    id: manifestId,
    employee_id: employeeId,
    manifest,
    raw_answers: manifest.seven_question_answers ?? {},
    transcript_ref: input.transcript_ref ?? manifest.transcript_ref ?? null,
    profile_package_key: packageKey,
  });

  const allFacts = [
    ...manifest.pricing_facts.map((fact) => ({ ...fact, category: "pricing" })),
    ...manifest.branding_facts.map((fact) => ({ ...fact, category: "branding" })),
    ...manifest.customer_job_facts.map((fact) => ({ ...fact, category: "customer" })),
  ];
  if (allFacts.length) {
    await ctx.db.from("business_brain_facts").insert(allFacts.map((fact) => ({
      id: newId(ID_PREFIX.brainFact),
      employee_id: employeeId,
      account_id: input.account_id,
      fact_key: fact.key,
      fact_value: fact.value,
      category: fact.category,
      source: "onboarding",
      source_ref: fact.source_snippet ?? null,
      confidence: fact.confidence,
    })));
  }

  await ctx.db.from("provisioning_jobs").insert({
    id: jobId,
    account_id: input.account_id,
    employee_id: employeeId,
    idempotency_key: input.idempotency_key,
    state: "running",
    logs: [{ at: new Date().toISOString(), message: "Provisioning requested." }],
  });
  const { data: pkg } = await ctx.db
    .from("profile_packages")
    .select("*")
    .eq("package_key", packageKey)
    .maybeSingle();
  await ctx.db.from("employee_profile_builds").insert({
    id: buildId,
    employee_id: employeeId,
    account_id: input.account_id,
    profile_package_id: pkg?.id ?? null,
    package_key: packageKey,
    package_version: pkg?.version ?? null,
    params: manifest,
  });

  try {
    const result = await callProvisioner({
      account_id: input.account_id,
      employee_id: employeeId,
      manifest_id: manifestId,
      profile_package_key: packageKey,
      params: {
        client_id: slug,
        account_id: input.account_id,
        employee_id: employeeId,
        profile_package_key: packageKey,
        runtime_backend: runtimeBackend,
        business_display_name: manifest.business_display_name,
        business_kind: manifest.business_kind,
        owner_name: manifest.owner_name,
        owner_phone_e164: manifest.verified_phone_e164,
        employee_name: manifest.employee_name,
        timezone: manifest.timezone,
        workspace_dir: workspaceDir,
        webhook_url: webhookUrl,
        gateway_port: port,
        top_workflows: manifest.top_workflows,
        tools_mentioned: manifest.tools_mentioned,
        seed_skills: manifest.seed_skills.length
          ? manifest.seed_skills
          : ((pkg?.default_skills as string[] | undefined) ?? []),
        api_server_key: apiServerKey,
      },
    });
    const smsNumber = skipSmsProvisioning()
      ? null
      : (result.sms_number_e164 ?? process.env.TWILIO_TEST_NUMBER ?? null);

    await ctx.db.from("employees").update({
      status: "live",
      profile_id: result.profile_id ?? `client_${employeeId}`,
      web_route: result.public_web_route ?? employeeWebRoute(employeeId),
    }).eq("id", employeeId);
    const runtimeEndpointId = newId(ID_PREFIX.runtime);
    await ctx.db.from("runtime_endpoints").insert({
      id: runtimeEndpointId,
      employee_id: employeeId,
      sms_number_e164: smsNumber,
      twilio_webhook_url: result.twilio_webhook_url ?? webhookUrl,
      webchat_api_url: result.webchat_api_url ?? null,
      api_base_url: result.api_base_url ?? result.webchat_api_url ?? null,
      api_session_id: result.api_session_id ?? "amtech-owner-thread",
      api_session_key: hermesSessionKey(input.account_id, employeeId),
      public_web_route: result.public_web_route ?? employeeWebRoute(employeeId),
      gateway_port: result.gateway_port ?? port,
      backend_type: runtimeBackend,
      health: {
        profile_id: result.profile_id,
        validation_status: result.validation_status,
        first_sms_sid: result.first_sms_sid,
      },
    });
    await ctx.db.from("runtime_endpoint_secrets").insert({
      id: newId(ID_PREFIX.runtimeSecret),
      runtime_endpoint_id: runtimeEndpointId,
      employee_id: employeeId,
      api_key_ref: sealSecret(apiServerKey),
    });
    await ctx.db.from("employee_profile_builds").update({
      generated_path: result.generated_path ?? null,
      validation_status: result.validation_status ?? "passed",
      install_status: "installed",
      validation_output: result.validation_output ?? null,
      smoke_output: result.smoke_output ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", buildId);
    await ctx.db.from("provisioning_jobs").update({
      state: "success",
      logs: result.logs ?? [],
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: employeeId,
      actor: ctx.actor,
      action: "tool:provision_employee",
      resource: employeeId,
      result: "ok",
      details: {
        provisioning_job_id: jobId,
        profile_package_key: packageKey,
        first_sms_sid: result.first_sms_sid ?? null,
        sms_skipped: skipSmsProvisioning(),
      },
    });
    return ok({
      account_id: input.account_id,
      employee_id: employeeId,
      changed_resources: [`employee:${employeeId}`, `provisioning_job:${jobId}`, `profile_build:${buildId}`],
      proof: {
        employee_id: employeeId,
        provisioning_job_id: jobId,
        profile_id: result.profile_id ?? null,
        first_sms_sid: result.first_sms_sid ?? null,
        web_route: result.public_web_route ?? employeeWebRoute(employeeId),
      },
      user_facing_summary_hint: skipSmsProvisioning()
        ? "Employee provisioned for local web testing; SMS was skipped."
        : "Employee provisioned and first live SMS sent.",
      next_suggested_action: skipSmsProvisioning()
        ? "Send a web chat message to the employee."
        : "Tell the owner to text the job they just walked.",
      audit_id,
    });
  } catch (err) {
    await ctx.db.from("employees").update({ status: "failed" }).eq("id", employeeId);
    await ctx.db.from("employee_profile_builds").update({
      validation_status: "failed",
      install_status: "failed",
      validation_output: String((err as Error).message ?? err),
      updated_at: new Date().toISOString(),
    }).eq("id", buildId);
    await ctx.db.from("provisioning_jobs").update({
      state: "failed",
      failure_state: String((err as Error).message ?? err),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: employeeId,
      actor: ctx.actor,
      action: "tool:provision_employee",
      resource: employeeId,
      result: "failed",
      details: { provisioning_job_id: jobId, message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Provisioner failed to create a live employee.", {
      account_id: input.account_id,
      employee_id: employeeId,
      proof: { provisioning_job_id: jobId },
      audit_id,
    });
  }
};

const getProvisioningStatus: ToolHandler = async (ctx, raw) => {
  const input = raw as GetProvisioningStatusInput;
  if (!input?.account_id || !input?.employee_id_or_job_id) {
    return failed("validation_failed", "account_id and employee_id_or_job_id are required.");
  }
  const { data } = await ctx.db
    .from("provisioning_jobs")
    .select("*")
    .eq("account_id", input.account_id)
    .or(`id.eq.${input.employee_id_or_job_id},employee_id.eq.${input.employee_id_or_job_id}`)
    .maybeSingle();
  if (!data) return failed("validation_failed", "Provisioning job not found.", { account_id: input.account_id });
  return ok({
    account_id: input.account_id,
    employee_id: data.employee_id ?? null,
    proof: { provisioning_job_id: data.id, state: data.state, failure_state: data.failure_state ?? null },
    user_facing_summary_hint: `Provisioning is ${data.state}.`,
  });
};

export const provisioningTools: Partial<Record<ToolName, ToolHandler>> = {
  provision_employee: provisionEmployee,
  get_provisioning_status: getProvisioningStatus,
};
