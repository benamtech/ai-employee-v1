/** Provisioning tools — create durable desired state; the reconciler owns effects. */
import {
  ID_PREFIX,
  OnboardingManifest,
  employeeWebRoute,
  gatewayPort,
  newId,
  pending,
  failed,
  ok,
  type ProvisionEmployeeInput,
  type GetProvisioningStatusInput,
  type ToolName,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { randomBytes } from "node:crypto";
import { writeAudit } from "../lib/audit.js";
import { checkFeature } from "../lib/entitlements.js";
import { isLocalRuntimeBackendAllowed, resolveRuntimeBackend } from "../lib/runtime-backend.js";
import { sealSecret } from "../lib/secrets.js";
import {
  canonicalProvisioningGraph,
  freshProvisioningOperationKey,
  persistProvisioningResourceGraph,
  recordProvisioningResource,
} from "../lib/provisioning-state-machine.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
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

function isTerminalRetryableState(state: unknown): boolean {
  return state === "failed" || state === "compensated";
}

async function latestRequestJob(ctx: Parameters<ToolHandler>[0], accountId: string, baseIdempotencyKey: string) {
  const exact = await ctx.db.from("provisioning_jobs").select("*").eq("idempotency_key", baseIdempotencyKey).maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data && exact.data.account_id !== accountId) return { conflict: exact.data, latest: null };

  const latest = await ctx.db
    .from("provisioning_jobs")
    .select("*")
    .eq("account_id", accountId)
    .eq("command_type", "ensure_runtime")
    .contains("worker_context", { base_idempotency_key: baseIdempotencyKey })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw latest.error;
  return { conflict: null, latest: latest.data ?? exact.data ?? null };
}

async function createRetryJob(ctx: Parameters<ToolHandler>[0], input: {
  accountId: string;
  baseIdempotencyKey: string;
  previous: Record<string, any>;
}): Promise<{ jobId: string; employeeId: string }> {
  const previousContext = input.previous.worker_context && typeof input.previous.worker_context === "object"
    ? input.previous.worker_context as Record<string, unknown>
    : {};
  const employeeId = String(input.previous.employee_id ?? "");
  const manifestId = String(previousContext.manifest_id ?? "");
  if (!employeeId || !manifestId) throw new Error("retry_context_incomplete");
  const jobId = newId(ID_PREFIX.provisioningJob);
  const retryIdempotencyKey = `${input.baseIdempotencyKey}:retry:${jobId}`;
  const resourceGraph = canonicalProvisioningGraph({ account_id: input.accountId, employee_id: employeeId, manifest_id: manifestId });
  const workerContext = {
    ...previousContext,
    base_idempotency_key: input.baseIdempotencyKey,
    retry_of_provisioning_job_id: input.previous.id,
    effect_keys: {},
    mcp_credential_id: null,
    model_gateway_credential_id: null,
    render_result: null,
    runtime_result: null,
    runtime_health_result: null,
    routing_result: null,
    welcome_event_inbox_id: null,
    compensation_phase: null,
  };
  const inserted = await ctx.db.from("provisioning_jobs").insert({
    id: jobId,
    account_id: input.accountId,
    employee_id: employeeId,
    idempotency_key: retryIdempotencyKey,
    command_type: "ensure_runtime",
    operation_key: freshProvisioningOperationKey({
      command_type: "ensure_runtime",
      account_id: input.accountId,
      employee_id: employeeId,
      retry_of: String(input.previous.id),
    }),
    state: "requested",
    desired_state: "ready",
    desired_resource_graph: resourceGraph,
    worker_context: workerContext,
    logs: [{ at: new Date().toISOString(), message: "Provisioning retry requested with fresh operation and effect keys.", retry_of_provisioning_job_id: input.previous.id }],
  });
  if (inserted.error) throw inserted.error;
  await persistProvisioningResourceGraph(ctx.db, { provisioning_job_id: jobId, account_id: input.accountId, employee_id: employeeId, resources: resourceGraph });
  await recordProvisioningResource(ctx.db, { provisioning_job_id: jobId, resource_key: "account", observed_state: "present", evidence: { account_id: input.accountId } });
  await recordProvisioningResource(ctx.db, { provisioning_job_id: jobId, resource_key: "employee_record", observed_state: "present", evidence: { employee_id: employeeId, retry: true } });
  const employeeWrite = await ctx.db.from("employees").update({ status: "provisioning" }).eq("id", employeeId).eq("account_id", input.accountId);
  if (employeeWrite.error) throw employeeWrite.error;
  return { jobId, employeeId };
}

const provisionEmployee: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "provision_employee");
  const input = raw as ProvisionEmployeeInput;
  if (!input?.account_id || !input?.manifest || !input?.idempotency_key) {
    const audit_id = await writeAudit(ctx.db, { account_id: input?.account_id ?? null, actor: ctx.actor, action: "tool:provision_employee", result: "failed", details: { reason: "validation_failed" } });
    return failed("validation_failed", "account_id, manifest, and idempotency_key are required.", { audit_id });
  }

  const parsed = OnboardingManifest.safeParse({ ...input.manifest, account_id: input.account_id });
  if (!parsed.success) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, actor: ctx.actor, action: "tool:provision_employee", result: "failed", details: { reason: "manifest_invalid", issues: parsed.error.issues } });
    return failed("validation_failed", "Manifest is invalid.", { account_id: input.account_id, audit_id });
  }
  const manifest = parsed.data;

  try {
    const request = await latestRequestJob(ctx, input.account_id, input.idempotency_key);
    if (request.conflict) {
      const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, actor: ctx.actor, action: "tool:provision_employee", result: "failed", details: { reason: "idempotency_key_account_mismatch", existing_job_id: request.conflict.id } });
      return failed("idempotency_conflict", "Provisioning request belongs to a different account.", { account_id: input.account_id, audit_id });
    }
    if (request.latest && !isTerminalRetryableState(request.latest.state)) {
      return pending({
        account_id: input.account_id,
        employee_id: request.latest.employee_id ?? null,
        proof: { provisioning_job_id: request.latest.id, state: request.latest.state },
        user_facing_summary_hint: "Provisioning request already exists and is owned by the reconciler.",
        next_suggested_action: "Poll provisioning status.",
      });
    }
    if (request.latest && isTerminalRetryableState(request.latest.state)) {
      const retry = await createRetryJob(ctx, { accountId: input.account_id, baseIdempotencyKey: input.idempotency_key, previous: request.latest as Record<string, any> });
      const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: retry.employeeId, actor: ctx.actor, action: "tool:provision_employee", resource: retry.employeeId, result: "ok", details: { provisioning_job_id: retry.jobId, retry_of_provisioning_job_id: request.latest.id, previous_state: request.latest.state, reconciler_owned: true } });
      return pending({
        account_id: input.account_id,
        employee_id: retry.employeeId,
        proof: { provisioning_job_id: retry.jobId, retry_of_provisioning_job_id: request.latest.id, state: "requested" },
        user_facing_summary_hint: "Provisioning retry queued with fresh operation keys.",
        next_suggested_action: "Poll provisioning status.",
        audit_id,
      });
    }

    const employeeId = newId(ID_PREFIX.employee);
    const manifestId = newId(ID_PREFIX.manifest);
    const jobId = newId(ID_PREFIX.provisioningJob);
    const buildId = newId(ID_PREFIX.profileBuild);
    const packageKey = manifest.profile_package_key ?? "contractor_estimator";
    const runtimeBackend = resolveRuntimeBackend();
    if (runtimeBackend === "local" && !isLocalRuntimeBackendAllowed()) {
      const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, actor: ctx.actor, action: "tool:provision_employee", result: "denied", details: { reason: "runtime_backend_not_allowed", runtime_backend: runtimeBackend } });
      return failed("unauthorized", "This deployment is not configured to provision employees on the local runtime backend.", { account_id: input.account_id, audit_id });
    }
    const portBase = Number(process.env.HERMES_GATEWAY_PORT_BASE ?? 8100);
    const port = gatewayPort(portBase, Math.floor(Math.random() * 1000) + 1);
    const workspaceDir = `${requiredEnv("AMTECH_CLIENTS_DIR")}/${employeeId}/workspace`;
    const apiServerKeyRef = sealSecret(randomBytes(32).toString("base64url"));
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
      api_server_key_ref: apiServerKeyRef,
      effect_keys: {},
    };

    const employeeWrite = await ctx.db.from("employees").insert({ id: employeeId, account_id: input.account_id, name: manifest.employee_name, status: "provisioning", profile_package_key: packageKey, web_route: employeeWebRoute(employeeId) });
    if (employeeWrite.error) throw employeeWrite.error;
    const manifestWrite = await ctx.db.from("employee_manifests").insert({ id: manifestId, employee_id: employeeId, manifest, raw_answers: manifest.seven_question_answers ?? {}, transcript_ref: input.transcript_ref ?? manifest.transcript_ref ?? null, profile_package_key: packageKey });
    if (manifestWrite.error) throw manifestWrite.error;

    const allFacts = [
      ...manifest.pricing_facts.map((fact) => ({ ...fact, category: "pricing" })),
      ...manifest.branding_facts.map((fact) => ({ ...fact, category: "branding" })),
      ...manifest.customer_job_facts.map((fact) => ({ ...fact, category: "customer" })),
    ];
    if (allFacts.length) {
      const factsWrite = await ctx.db.from("business_brain_facts").insert(allFacts.map((fact) => ({ id: newId(ID_PREFIX.brainFact), employee_id: employeeId, account_id: input.account_id, fact_key: fact.key, fact_value: fact.value, category: fact.category, source: "onboarding", source_ref: fact.source_snippet ?? null, confidence: fact.confidence })));
      if (factsWrite.error) throw factsWrite.error;
    }

    const pkg = await ctx.db.from("profile_packages").select("*").eq("package_key", packageKey).maybeSingle();
    if (pkg.error) throw pkg.error;
    const buildWrite = await ctx.db.from("employee_profile_builds").insert({ id: buildId, employee_id: employeeId, account_id: input.account_id, profile_package_id: pkg.data?.id ?? null, package_key: packageKey, package_version: pkg.data?.version ?? null, params: manifest, install_status: "queued" });
    if (buildWrite.error) throw buildWrite.error;

    const jobWrite = await ctx.db.from("provisioning_jobs").insert({
      id: jobId,
      account_id: input.account_id,
      employee_id: employeeId,
      idempotency_key: input.idempotency_key,
      command_type: "ensure_runtime",
      operation_key: freshProvisioningOperationKey({ command_type: "ensure_runtime", account_id: input.account_id, employee_id: employeeId }),
      state: "requested",
      desired_state: "ready",
      desired_resource_graph: resourceGraph,
      worker_context: workerContext,
      logs: [{ at: new Date().toISOString(), message: "Provisioning desired state persisted; reconciler owns all external effects." }],
    });
    if (jobWrite.error) throw jobWrite.error;
    await persistProvisioningResourceGraph(ctx.db, { provisioning_job_id: jobId, account_id: input.account_id, employee_id: employeeId, resources: resourceGraph });
    await recordProvisioningResource(ctx.db, { provisioning_job_id: jobId, resource_key: "account", observed_state: "present", evidence: { account_id: input.account_id } });
    await recordProvisioningResource(ctx.db, { provisioning_job_id: jobId, resource_key: "employee_record", observed_state: "present", evidence: { employee_id: employeeId, manifest_id: manifestId, build_id: buildId } });

    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: employeeId, actor: ctx.actor, action: "tool:provision_employee", resource: employeeId, result: "ok", details: { provisioning_job_id: jobId, profile_package_key: packageKey, reconciler_owned: true, operation_key: "redacted" } });
    return pending({
      account_id: input.account_id,
      employee_id: employeeId,
      changed_resources: [`employee:${employeeId}`, `provisioning_job:${jobId}`, `profile_build:${buildId}`],
      proof: { employee_id: employeeId, provisioning_job_id: jobId, state: "requested", reconciler_owned: true },
      user_facing_summary_hint: "Employee provisioning is queued in the durable reconciler.",
      next_suggested_action: "Poll provisioning status.",
      audit_id,
    });
  } catch (err) {
    const message = String((err as Error).message ?? err).slice(0, 500);
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, actor: ctx.actor, action: "tool:provision_employee", result: "failed", details: { reason: "durable_request_failed", error: message } });
    return failed("provider_error", "The durable provisioning request could not be created.", { account_id: input.account_id, proof: { failure_state: message }, audit_id });
  }
};

const getProvisioningStatus: ToolHandler = async (ctx, raw) => {
  const input = raw as GetProvisioningStatusInput;
  if (!input?.account_id || !input?.employee_id_or_job_id) return failed("validation_failed", "account_id and employee_id_or_job_id are required.");
  const { data } = await ctx.db.from("provisioning_jobs").select("*").eq("account_id", input.account_id).or(`id.eq.${input.employee_id_or_job_id},employee_id.eq.${input.employee_id_or_job_id}`).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return failed("validation_failed", "Provisioning job not found.", { account_id: input.account_id });
  const resources = await ctx.db.from("provisioning_resource_states").select("resource_key,resource_type,desired_state,observed_state,retry_class,evidence,error,updated_at").eq("provisioning_job_id", data.id).order("created_at", { ascending: true });
  return ok({ account_id: input.account_id, employee_id: data.employee_id ?? null, proof: { provisioning_job_id: data.id, state: data.state, failure_state: data.failure_state ?? null, retry_class: data.retry_class ?? null, next_attempt_at: data.next_attempt_at ?? null, attempt_count: data.attempt_count ?? 0, resources_json: JSON.stringify(resources.data ?? []) }, user_facing_summary_hint: `Provisioning is ${data.state}.` });
};

export const provisioningTools: Partial<Record<ToolName, ToolHandler>> = {
  provision_employee: provisionEmployee,
  get_provisioning_status: getProvisioningStatus,
};
