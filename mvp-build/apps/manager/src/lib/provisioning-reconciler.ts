import { randomUUID } from "node:crypto";
import { employeeWebRoute, type ModelGatewayPolicy, type ProvisionerOperation, type ProvisionerRequest, type ProvisionerResult } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { buildProfileContext } from "./profile-context.js";
import { mintEmployeeMcpCredential, revokeEmployeeMcpCredential } from "./mcp-auth.js";
import {
  employeeModelGatewayUrl,
  mintModelGatewayCredential,
  revokeModelGatewayCredential,
  verifyModelGatewayCredential,
} from "./model-gateway.js";
import { openSecret } from "./secrets.js";
import { requireHostProvisioner } from "../provisioner.js";
import {
  canonicalProvisioningGraph,
  classifyProvisioningError,
  freshProvisioningOperationKey,
  persistProvisioningResourceGraph,
  provisioningRetryDelayMs,
  queueProvisioningCommand,
  recordProvisioningResource,
  transitionProvisioning,
  type ProvisioningCommandType,
  type ProvisioningState,
} from "./provisioning-state-machine.js";

interface ProvisioningJobRow {
  id: string;
  account_id: string;
  employee_id: string | null;
  state: string;
  command_type?: ProvisioningCommandType | string | null;
  attempt_count?: number | null;
  max_attempts?: number | null;
  operation_key?: string | null;
  worker_context?: Record<string, unknown> | null;
  lease_token?: string | null;
  lease_expires_at?: string | null;
  failure_state?: string | null;
}

interface ProvisioningCommandRow {
  id: string;
  account_id: string;
  employee_id: string | null;
  command_type: ProvisioningCommandType;
  idempotency_key: string;
  requested_by: string;
  payload?: Record<string, unknown> | null;
  provisioning_job_id?: string | null;
}

interface RuntimeInputs {
  request: ProvisionerRequest;
  manifest_id: string;
  build_id: string | null;
  mcp_credential_id: string | null;
  model_gateway_credential_id: string | null;
  model_gateway_token: string | null;
  model_gateway_policy: ModelGatewayPolicy;
  api_server_key_ref: string | null;
}

const TERMINAL_JOB_STATES = new Set(["ready", "success", "failed", "compensated"]);
let workerTimer: NodeJS.Timeout | null = null;
let workerRunning = false;
let lastDriftScanAt = 0;

function nowIso(): string {
  return new Date().toISOString();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
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

function retryAt(attempt: number): string {
  return new Date(Date.now() + provisioningRetryDelayMs(attempt)).toISOString();
}

async function saveContext(db: SupabaseClient, job: ProvisioningJobRow, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const next = { ...asObject(job.worker_context), ...patch };
  const updated = await db.from("provisioning_jobs").update({ worker_context: next, updated_at: nowIso() }).eq("id", job.id);
  if (updated.error) throw updated.error;
  job.worker_context = next;
  return next;
}

async function effectKey(db: SupabaseClient, job: ProvisioningJobRow, label: string): Promise<string> {
  const context = asObject(job.worker_context);
  const keys = asObject(context.effect_keys);
  const existing = keys[label];
  if (typeof existing === "string" && existing) return existing;
  const created = `${job.id}:${label}:${randomUUID()}`;
  await saveContext(db, job, { effect_keys: { ...keys, [label]: created } });
  return created;
}

async function claimNextCommand(db: SupabaseClient): Promise<ProvisioningCommandRow | null> {
  const leaseToken = `pcl_${randomUUID()}`;
  const claimed = await db.rpc("claim_next_provisioning_command", { p_lease_token: leaseToken, p_lease_seconds: 120 });
  if (claimed.error) throw claimed.error;
  return firstRow<ProvisioningCommandRow>(claimed.data);
}

async function claimNextJob(db: SupabaseClient): Promise<ProvisioningJobRow | null> {
  const leaseToken = `pjl_${randomUUID()}`;
  const claimed = await db.rpc("claim_next_provisioning_job", { p_lease_token: leaseToken, p_lease_seconds: 120 });
  if (claimed.error) throw claimed.error;
  return firstRow<ProvisioningJobRow>(claimed.data);
}

async function materializeCommandJob(db: SupabaseClient, command: ProvisioningCommandRow): Promise<void> {
  if (command.provisioning_job_id) return;
  const idempotencyKey = `command:${command.id}`;
  const existing = await db.from("provisioning_jobs").select("id").eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing.error) throw existing.error;
  const jobId = existing.data?.id ? String(existing.data.id) : `pjob_${randomUUID()}`;
  if (!existing.data) {
    const inserted = await db.from("provisioning_jobs").insert({
      id: jobId,
      account_id: command.account_id,
      employee_id: command.employee_id,
      idempotency_key: idempotencyKey,
      command_type: command.command_type,
      operation_key: freshProvisioningOperationKey({
        command_type: command.command_type,
        account_id: command.account_id,
        employee_id: command.employee_id,
      }),
      state: "requested",
      desired_state: "ready",
      worker_context: {
        command_id: command.id,
        command_payload: asObject(command.payload),
        command_phase: "init",
      },
      logs: [{ at: nowIso(), message: `Provisioning command ${command.command_type} claimed.` }],
    });
    if (inserted.error) throw inserted.error;
  }
  const linked = await db.from("provisioning_commands").update({ provisioning_job_id: jobId, updated_at: nowIso() }).eq("id", command.id);
  if (linked.error) throw linked.error;
}

async function activeMcpCredential(db: SupabaseClient, employeeId: string, credentialId?: string | null) {
  let query = db.from("employee_mcp_credentials").select("id,account_id,employee_id,token_secret_ref,status,expires_at,revoked_at,created_at").eq("employee_id", employeeId).eq("status", "active");
  if (credentialId) query = query.eq("id", credentialId);
  const result = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data as Record<string, unknown> | null;
}

async function activeModelCredential(db: SupabaseClient, employeeId: string, credentialId?: string | null) {
  let query = db.from("model_gateway_credentials")
    .select("id,account_id,employee_id,credential_version,token_secret_ref,gateway_url,model_alias,allowed_providers,allowed_models,spend_limit_cents,rate_limit_per_minute,expires_at,revoked_at,created_at")
    .eq("employee_id", employeeId)
    .is("revoked_at", null);
  if (credentialId) query = query.eq("id", credentialId);
  const result = await query.order("credential_version", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data as Record<string, unknown> | null;
}

function modelPolicyFromRow(row: Record<string, unknown> | null, employeeId: string): ModelGatewayPolicy {
  return {
    gateway_url: String(row?.gateway_url ?? employeeModelGatewayUrl(employeeId)),
    model_alias: String(row?.model_alias ?? process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary"),
    allowed_providers: asArray<string>(row?.allowed_providers).length ? asArray<string>(row?.allowed_providers) : [process.env.MODEL_GATEWAY_PROVIDER ?? "openai_compatible"],
    allowed_models: asArray<string>(row?.allowed_models).length ? asArray<string>(row?.allowed_models) : [process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary"],
    spend_limit_cents: Number(row?.spend_limit_cents ?? process.env.MODEL_GATEWAY_DEFAULT_SPEND_LIMIT_CENTS ?? 40000),
    rate_limit_per_minute: Number(row?.rate_limit_per_minute ?? process.env.MODEL_GATEWAY_DEFAULT_RATE_LIMIT_PER_MINUTE ?? 60),
    expires_at: String(row?.expires_at ?? new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()),
    credential_version: Number(row?.credential_version ?? 1),
  };
}

async function runtimeInputs(db: SupabaseClient, job: ProvisioningJobRow, options: { model_credential_id?: string | null } = {}): Promise<RuntimeInputs> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const context = asObject(job.worker_context);
  const [{ data: employee }, { data: manifestRow }, { data: runtimeEndpoint }] = await Promise.all([
    db.from("employees").select("*").eq("id", job.employee_id).eq("account_id", job.account_id).maybeSingle(),
    db.from("employee_manifests").select("*").eq("employee_id", job.employee_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("runtime_endpoints").select("*").eq("employee_id", job.employee_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!employee || !manifestRow) throw new Error("employee_manifest_missing");
  const manifest = asObject(manifestRow.manifest);
  const packageKey = String(context.package_key ?? manifestRow.profile_package_key ?? employee.profile_package_key ?? manifest.profile_package_key ?? "contractor_estimator");
  const profilePackage = await db.from("profile_packages").select("*").eq("package_key", packageKey).maybeSingle();
  if (profilePackage.error) throw profilePackage.error;
  const seedSkills = asArray<string>(manifest.seed_skills).length
    ? asArray<string>(manifest.seed_skills)
    : asArray<string>((profilePackage.data as Record<string, unknown> | null)?.default_skills);
  const profileContext = buildProfileContext({ packageKey, manifest: { ...manifest, seed_skills: seedSkills } as any });

  const mcpCredentialId = typeof context.mcp_credential_id === "string" ? context.mcp_credential_id : null;
  const modelCredentialId = options.model_credential_id ?? (typeof context.model_gateway_credential_id === "string" ? context.model_gateway_credential_id : null);
  const mcp = await activeMcpCredential(db, job.employee_id, mcpCredentialId);
  const model = await activeModelCredential(db, job.employee_id, modelCredentialId);
  const mcpTokenRef = typeof mcp?.token_secret_ref === "string" ? mcp.token_secret_ref : null;
  const modelTokenRef = typeof model?.token_secret_ref === "string" ? model.token_secret_ref : null;
  const apiServerKeyRef = typeof context.api_server_key_ref === "string"
    ? context.api_server_key_ref
    : await (async () => {
      if (!runtimeEndpoint?.id) return null;
      const secret = await db.from("runtime_endpoint_secrets").select("api_key_ref").eq("runtime_endpoint_id", runtimeEndpoint.id).maybeSingle();
      if (secret.error) throw secret.error;
      return typeof secret.data?.api_key_ref === "string" ? secret.data.api_key_ref : null;
    })();

  const runtimeBackend = String(context.runtime_backend ?? runtimeEndpoint?.backend_type ?? "docker") as "docker" | "local" | "ssh" | "vm";
  const gatewayPort = Number(context.gateway_port ?? runtimeEndpoint?.gateway_port ?? 0);
  if (!gatewayPort) throw new Error("gateway_port_missing");
  const workspaceDir = String(context.workspace_dir ?? `${process.env.AMTECH_CLIENTS_DIR ?? "/var/lib/amtech/clients"}/${job.employee_id}/workspace`);
  const modelPolicy = modelPolicyFromRow(model, job.employee_id);
  const request: ProvisionerRequest = {
    account_id: job.account_id,
    employee_id: job.employee_id,
    manifest_id: String(context.manifest_id ?? manifestRow.id),
    profile_package_key: packageKey,
    params: {
      client_id: String(context.client_id ?? clientSlug(job.employee_id)),
      account_id: job.account_id,
      employee_id: job.employee_id,
      profile_package_key: packageKey,
      runtime_backend: runtimeBackend,
      business_display_name: String(manifest.business_display_name ?? "Business"),
      business_kind: String(manifest.business_kind ?? "service_business"),
      owner_name: String(manifest.owner_name ?? "Owner"),
      owner_phone_e164: String(manifest.verified_phone_e164 ?? manifest.owner_phone_e164 ?? ""),
      employee_name: String(manifest.employee_name ?? employee.name ?? "Avery"),
      timezone: String(manifest.timezone ?? "America/New_York"),
      workspace_dir: workspaceDir,
      webhook_url: String(context.webhook_url ?? publicTwilioWebhookUrl(job.employee_id)),
      gateway_port: gatewayPort,
      top_workflows: asArray<string>(manifest.top_workflows),
      tools_mentioned: asArray<string>(manifest.tools_mentioned),
      seed_skills: seedSkills,
      api_server_key: apiServerKeyRef ? openSecret(apiServerKeyRef) : undefined,
      profile_context: profileContext,
      model_gateway: modelPolicy,
    },
    render_secrets: {
      manager_mcp_token: mcpTokenRef ? openSecret(mcpTokenRef) : undefined,
      model_gateway_token: modelTokenRef ? openSecret(modelTokenRef) : undefined,
    },
  };
  return {
    request,
    manifest_id: String(context.manifest_id ?? manifestRow.id),
    build_id: typeof context.build_id === "string" ? context.build_id : null,
    mcp_credential_id: mcp ? String(mcp.id) : null,
    model_gateway_credential_id: model ? String(model.id) : null,
    model_gateway_token: modelTokenRef ? openSecret(modelTokenRef) : null,
    model_gateway_policy: modelPolicy,
    api_server_key_ref: apiServerKeyRef,
  };
}

function inspectionEvidence(result: ProvisionerResult): Record<string, unknown> {
  return asObject(result.drift);
}

function assertRuntimeAccepted(result: ProvisionerResult, expectedChecksum?: string | null): void {
  const drift = inspectionEvidence(result);
  const profile = asObject(drift.profile);
  if (drift.container_present !== true) throw new Error("runtime_container_missing");
  if (drift.network_present !== true) throw new Error("runtime_network_missing");
  if (profile.exists !== true) throw new Error("runtime_profile_missing");
  if (expectedChecksum && profile.profile_checksum !== expectedChecksum) throw new Error("runtime_profile_checksum_drift");
}

async function ensureInitialCredentials(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  let mcp = await activeMcpCredential(db, job.employee_id);
  if (!mcp?.token_secret_ref) {
    const minted = await mintEmployeeMcpCredential(db, { account_id: job.account_id, employee_id: job.employee_id });
    mcp = { id: minted.credential_id, token_secret_ref: true };
  }
  let model = await activeModelCredential(db, job.employee_id);
  if (!model) {
    const minted = await mintModelGatewayCredential(db, { account_id: job.account_id, employee_id: job.employee_id });
    model = { id: minted.credential_id, credential_version: minted.policy.credential_version };
  }
  const context = await saveContext(db, job, {
    mcp_credential_id: String(mcp.id),
    model_gateway_credential_id: String(model.id),
  });
  await recordProvisioningResource(db, {
    provisioning_job_id: job.id,
    resource_key: "scoped_credentials",
    observed_state: "minted",
    evidence: {
      mcp_credential_id: context.mcp_credential_id,
      model_gateway_credential_id: context.model_gateway_credential_id,
      model_gateway_credential_version: Number(model.credential_version ?? 1),
    },
  });
}

async function persistRuntimeEndpoint(db: SupabaseClient, job: ProvisioningJobRow, inputs: RuntimeInputs): Promise<Record<string, unknown>> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const context = asObject(job.worker_context);
  const route = asObject(context.routing_result);
  const render = asObject(context.render_result);
  const existing = await db.from("runtime_endpoints").select("id").eq("employee_id", job.employee_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  const endpointId = existing.data?.id ? String(existing.data.id) : `rt_${randomUUID()}`;
  const smsNumber = process.env.PROVISIONER_SKIP_SMS === "1" || process.env.PROVISIONER_SKIP_SMS === "true"
    ? null
    : process.env.TWILIO_TEST_NUMBER ?? null;
  const row = {
    employee_id: job.employee_id,
    sms_number_e164: smsNumber,
    twilio_webhook_url: publicTwilioWebhookUrl(job.employee_id),
    webchat_api_url: route.webchat_api_url ?? null,
    api_base_url: route.api_base_url ?? route.webchat_api_url ?? null,
    api_session_id: route.api_session_id ?? "amtech-owner-thread",
    api_session_key: `amtech:v1:account:${job.account_id}:employee:${job.employee_id}`,
    public_web_route: route.public_web_route ?? employeeWebRoute(job.employee_id),
    gateway_port: inputs.request.params.gateway_port,
    backend_type: inputs.request.params.runtime_backend ?? "docker",
    health: {
      status: "healthy",
      profile_id: render.profile_id ?? null,
      profile_checksum: render.profile_checksum ?? null,
      model_gateway_credential_id: inputs.model_gateway_credential_id,
      model_gateway_credential_version: inputs.model_gateway_policy.credential_version,
      accepted_at: nowIso(),
    },
  };
  const write = existing.data
    ? await db.from("runtime_endpoints").update(row).eq("id", endpointId)
    : await db.from("runtime_endpoints").insert({ id: endpointId, ...row });
  if (write.error) throw write.error;
  if (inputs.api_server_key_ref) {
    const existingSecret = await db.from("runtime_endpoint_secrets").select("id").eq("runtime_endpoint_id", endpointId).maybeSingle();
    if (existingSecret.error) throw existingSecret.error;
    const secretWrite = existingSecret.data
      ? await db.from("runtime_endpoint_secrets").update({ api_key_ref: inputs.api_server_key_ref }).eq("id", existingSecret.data.id)
      : await db.from("runtime_endpoint_secrets").insert({ id: `rts_${randomUUID()}`, runtime_endpoint_id: endpointId, employee_id: job.employee_id, api_key_ref: inputs.api_server_key_ref });
    if (secretWrite.error) throw secretWrite.error;
  }
  return { runtime_endpoint_id: endpointId, sms_number_present: Boolean(smsNumber) };
}

async function enqueueWelcomeAfterBinding(db: SupabaseClient, job: ProvisioningJobRow): Promise<string> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const inboxId = `ain_${randomUUID()}`;
  const externalId = `welcome:${job.id}`;
  const inserted = await db.from("ambient_event_inbox").upsert({
    inbox_id: inboxId,
    source_type: "system",
    provider: "amtech",
    external_event_id: externalId,
    account_id: job.account_id,
    employee_id: job.employee_id,
    occurred_at: nowIso(),
    verified_at: nowIso(),
    event_type: "employee.welcome.requested",
    subject_key: job.employee_id,
    correlation_id: job.id,
    dedupe_key: externalId,
    ordering_key: `employee:${job.employee_id}:lifecycle`,
    payload: { provisioning_job_id: job.id, employee_id: job.employee_id },
    verification_metadata: { source: "reconciler", runtime_and_route_accepted: true },
  }, { onConflict: "dedupe_key" }).select("inbox_id").maybeSingle();
  if (inserted.error) throw inserted.error;
  return String(inserted.data?.inbox_id ?? inboxId);
}

async function completeInitialProvisioning(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const context = asObject(job.worker_context);
  const render = asObject(context.render_result);
  const route = asObject(context.routing_result);
  const transition = await transitionProvisioning(db, {
    provisioning_job_id: job.id,
    account_id: job.account_id,
    employee_id: job.employee_id,
    expected_state: "welcome_sent",
    to_state: "ready",
    attempt: Number(job.attempt_count ?? 1),
    evidence: { welcome_event_inbox_id: context.welcome_event_inbox_id ?? null },
  });
  if (!transition.applied) throw new Error("provisioning_ready_transition_conflict");
  const employeeWrite = await db.from("employees").update({
    status: "live",
    profile_id: render.profile_id ?? `client_${job.employee_id}`,
    web_route: route.public_web_route ?? employeeWebRoute(job.employee_id),
    needs_reprovision: false,
  }).eq("id", job.employee_id).eq("account_id", job.account_id);
  if (employeeWrite.error) throw employeeWrite.error;
  if (typeof context.build_id === "string") {
    const buildWrite = await db.from("employee_profile_builds").update({
      generated_path: render.generated_path ?? null,
      validation_status: render.validation_status ?? "passed",
      install_status: "installed",
      validation_output: render.validation_output ?? null,
      smoke_output: asObject(context.runtime_result).smoke_output ?? null,
      updated_at: nowIso(),
    }).eq("id", context.build_id);
    if (buildWrite.error) throw buildWrite.error;
  }
  const completed = await db.from("provisioning_jobs").update({ completed_at: nowIso(), updated_at: nowIso(), lease_token: null, lease_expires_at: null }).eq("id", job.id);
  if (completed.error) throw completed.error;
  await completeLinkedCommand(db, job, "succeeded", { state: "ready" });
}

async function processInitialProvisioning(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const state = job.state as ProvisioningState | "running" | "queued";
  if (state === "requested" || state === "running" || state === "queued") {
    const transition = await transitionProvisioning(db, {
      provisioning_job_id: job.id,
      account_id: job.account_id,
      employee_id: job.employee_id,
      expected_state: state,
      to_state: "resources_reserved",
      attempt: Number(job.attempt_count ?? 1),
      evidence: { reconstruction_safe: true },
    });
    if (!transition.applied) throw new Error("resources_reserved_transition_conflict");
    return;
  }
  if (state === "resources_reserved") {
    await ensureInitialCredentials(db, job);
    const transition = await transitionProvisioning(db, {
      provisioning_job_id: job.id,
      account_id: job.account_id,
      employee_id: job.employee_id,
      expected_state: "resources_reserved",
      to_state: "credentials_minted",
      attempt: Number(job.attempt_count ?? 1),
      evidence: { credentials_recoverable_from_sealed_refs: true },
    });
    if (!transition.applied) throw new Error("credentials_minted_transition_conflict");
    return;
  }
  const inputs = await runtimeInputs(db, job);
  if (state === "credentials_minted") {
    if (!inputs.request.render_secrets?.manager_mcp_token || !inputs.request.render_secrets.model_gateway_token) throw new Error("scoped_render_credentials_missing");
    const key = await effectKey(db, job, "render_profile");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "render_profile", idempotency_key: key });
    await saveContext(db, job, { render_result: result });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "rendered_profile", observed_state: "checksum_verified_frozen", evidence: { profile_id: result.profile_id, checksum: result.profile_checksum, validation_status: result.validation_status } });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "credentials_minted", to_state: "profile_rendered", attempt: Number(job.attempt_count ?? 1), evidence: { profile_id: result.profile_id, checksum: result.profile_checksum } });
    if (!transition.applied) throw new Error("profile_rendered_transition_conflict");
    return;
  }
  if (state === "profile_rendered") {
    const key = await effectKey(db, job, "start_runtime");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "start_runtime", idempotency_key: key });
    await saveContext(db, job, { runtime_result: result });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "employee_network", observed_state: "isolated", evidence: { network_name: result.network_name } });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "runtime", observed_state: "started", evidence: { container_name: result.container_name, gateway_port: result.gateway_port } });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "profile_rendered", to_state: "runtime_started", attempt: Number(job.attempt_count ?? 1), evidence: { container_name: result.container_name, network_name: result.network_name } });
    if (!transition.applied) throw new Error("runtime_started_transition_conflict");
    return;
  }
  if (state === "runtime_started") {
    const key = await effectKey(db, job, "inspect_runtime_health");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "inspect_runtime", idempotency_key: key });
    const expectedChecksum = String(asObject(asObject(job.worker_context).render_result).profile_checksum ?? "") || null;
    assertRuntimeAccepted(result, expectedChecksum);
    await saveContext(db, job, { runtime_health_result: result });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "health_acceptance", observed_state: "accepted", evidence: inspectionEvidence(result) });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "runtime_started", to_state: "runtime_healthy", attempt: Number(job.attempt_count ?? 1), evidence: { profile_checksum: expectedChecksum } });
    if (!transition.applied) throw new Error("runtime_healthy_transition_conflict");
    return;
  }
  if (state === "runtime_healthy") {
    const key = await effectKey(db, job, "activate_routing");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "activate_routing", idempotency_key: key });
    await saveContext(db, job, { routing_result: result });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "gateway_routing", observed_state: "loopback_route_active", evidence: { public_web_route: result.public_web_route, api_base_url: result.api_base_url } });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "runtime_healthy", to_state: "routing_activated", attempt: Number(job.attempt_count ?? 1), evidence: { public_web_route: result.public_web_route } });
    if (!transition.applied) throw new Error("routing_activated_transition_conflict");
    return;
  }
  if (state === "routing_activated") {
    const evidence = await persistRuntimeEndpoint(db, job, inputs);
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "channel_provider_bindings", observed_state: "configured_after_runtime_and_route", evidence });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "routing_activated", to_state: "channel_configured", attempt: Number(job.attempt_count ?? 1), evidence });
    if (!transition.applied) throw new Error("channel_configured_transition_conflict");
    return;
  }
  if (state === "channel_configured") {
    const inboxId = await enqueueWelcomeAfterBinding(db, job);
    await saveContext(db, job, { welcome_event_inbox_id: inboxId });
    await recordProvisioningResource(db, { provisioning_job_id: job.id, resource_key: "welcome_ready", observed_state: "idempotent_business_effect_ready_after_binding", evidence: { ambient_event_inbox_id: inboxId } });
    const transition = await transitionProvisioning(db, { provisioning_job_id: job.id, account_id: job.account_id, employee_id: job.employee_id, expected_state: "channel_configured", to_state: "welcome_sent", attempt: Number(job.attempt_count ?? 1), evidence: { ambient_event_inbox_id: inboxId, delivery_is_async: true } });
    if (!transition.applied) throw new Error("welcome_sent_transition_conflict");
    return;
  }
  if (state === "welcome_sent") {
    await completeInitialProvisioning(db, job);
  }
}

async function completeLinkedCommand(db: SupabaseClient, job: ProvisioningJobRow, status: "succeeded" | "failed" | "compensated", evidence: Record<string, unknown>): Promise<void> {
  const commandId = asObject(job.worker_context).command_id;
  if (typeof commandId !== "string") return;
  const updated = await db.from("provisioning_commands").update({ status, evidence, completed_at: nowIso(), lease_token: null, lease_expires_at: null, updated_at: nowIso() }).eq("id", commandId);
  if (updated.error) throw updated.error;
}

async function finishCommandJob(db: SupabaseClient, job: ProvisioningJobRow, evidence: Record<string, unknown>): Promise<void> {
  const updated = await db.from("provisioning_jobs").update({ state: "success", completed_at: nowIso(), lease_token: null, lease_expires_at: null, updated_at: nowIso(), worker_context: { ...asObject(job.worker_context), command_evidence: evidence } }).eq("id", job.id);
  if (updated.error) throw updated.error;
  await completeLinkedCommand(db, job, "succeeded", evidence);
}

function commandOperation(command: string): ProvisionerOperation {
  if (command === "teardown") return "remove_runtime";
  if (command === "suspend") return "suspend_runtime";
  if (command === "reprovision" || command === "replace_runtime") return "replace_runtime";
  if (command === "restore") return "restore_runtime";
  if (command === "repair_drift" || command === "ensure_runtime") return "repair_drift";
  return "inspect_drift";
}

function driftNeedsRepair(result: ProvisionerResult): boolean {
  const drift = inspectionEvidence(result);
  const profile = asObject(drift.profile);
  return drift.container_present !== true || drift.network_present !== true || profile.exists !== true;
}

async function processRotationCommand(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const context = asObject(job.worker_context);
  const phase = String(context.command_phase ?? "init");
  if (phase === "init") {
    const old = await activeModelCredential(db, job.employee_id);
    if (!old?.id || !old.token_secret_ref) throw new Error("active_model_gateway_credential_missing");
    const next = await mintModelGatewayCredential(db, {
      account_id: job.account_id,
      employee_id: job.employee_id,
      policy: { credential_version: Number(old.credential_version ?? 1) + 1 },
      rotated_from_credential_id: String(old.id),
    });
    await saveContext(db, job, { command_phase: "credential_minted", old_model_gateway_credential_id: String(old.id), new_model_gateway_credential_id: next.credential_id });
    return;
  }
  if (phase === "credential_minted") {
    const newCredentialId = String(context.new_model_gateway_credential_id ?? "");
    if (!newCredentialId) throw new Error("new_model_gateway_credential_missing");
    const inputs = await runtimeInputs(db, job, { model_credential_id: newCredentialId });
    const key = await effectKey(db, job, "rotate_model_gateway_credential");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "rotate_model_gateway_credential", idempotency_key: key });
    if (Number(result.model_gateway_credential_version) !== inputs.model_gateway_policy.credential_version) throw new Error("rotated_credential_version_mismatch");
    const drift = inspectionEvidence(result);
    const profile = asObject(drift.profile);
    if (profile.profile_checksum !== result.profile_checksum) throw new Error("rotated_profile_checksum_mismatch");
    await saveContext(db, job, { command_phase: "runtime_reloaded", rotation_result: result });
    return;
  }
  if (phase === "runtime_reloaded") {
    const newCredentialId = String(context.new_model_gateway_credential_id ?? "");
    const oldCredentialId = String(context.old_model_gateway_credential_id ?? "");
    const newRow = await activeModelCredential(db, job.employee_id, newCredentialId);
    const oldRow = await activeModelCredential(db, job.employee_id, oldCredentialId);
    if (!newRow?.token_secret_ref || !oldRow?.token_secret_ref) throw new Error("rotation_credential_secret_ref_missing");
    const newToken = openSecret(String(newRow.token_secret_ref));
    const oldToken = openSecret(String(oldRow.token_secret_ref));
    const newClaims = await verifyModelGatewayCredential(db, `Bearer ${newToken}`, { account_id: job.account_id, employee_id: job.employee_id });
    if (!newClaims || newClaims.credential_id !== newCredentialId) throw new Error("new_model_gateway_credential_not_live");
    await revokeModelGatewayCredential(db, oldCredentialId);
    const oldClaims = await verifyModelGatewayCredential(db, `Bearer ${oldToken}`, { account_id: job.account_id, employee_id: job.employee_id });
    if (oldClaims) throw new Error("old_model_gateway_credential_still_valid");
    const rotationResult = asObject(context.rotation_result);
    await finishCommandJob(db, job, {
      old_credential_id: oldCredentialId,
      new_credential_id: newCredentialId,
      new_credential_version: newClaims.credential_version,
      profile_checksum: rotationResult.profile_checksum ?? null,
      runtime_restarted: true,
      old_credential_rejected: true,
    });
  }
}

async function processDriftCommand(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  const context = asObject(job.worker_context);
  const phase = String(context.command_phase ?? "init");
  const inputs = await runtimeInputs(db, job);
  if (phase === "init") {
    const key = await effectKey(db, job, "inspect_drift_before");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "inspect_drift", idempotency_key: key });
    await saveContext(db, job, { command_phase: "inspected", drift_before: result });
    if (String(job.command_type) === "inspect_drift" || !driftNeedsRepair(result)) {
      await finishCommandJob(db, job, { drift: inspectionEvidence(result), repaired: false });
    }
    return;
  }
  if (phase === "inspected") {
    const key = await effectKey(db, job, "repair_drift");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "repair_drift", idempotency_key: key });
    await saveContext(db, job, { command_phase: "repaired", repair_result: result });
    return;
  }
  if (phase === "repaired") {
    const key = await effectKey(db, job, "inspect_drift_after");
    const result = await requireHostProvisioner({ ...inputs.request, operation: "inspect_drift", idempotency_key: key });
    assertRuntimeAccepted(result);
    await finishCommandJob(db, job, { drift_before: inspectionEvidence(asObject(context.drift_before) as unknown as ProvisionerResult), drift_after: inspectionEvidence(result), repaired: true });
  }
}

async function processGenericCommand(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  if (!job.employee_id) throw new Error("provisioning_employee_missing");
  const context = asObject(job.worker_context);
  const phase = String(context.command_phase ?? "init");
  const operation = commandOperation(String(job.command_type));
  const inputs = await runtimeInputs(db, job);
  if (phase === "init") {
    const key = await effectKey(db, job, `command_${operation}`);
    const result = await requireHostProvisioner({ ...inputs.request, operation, idempotency_key: key });
    await saveContext(db, job, { command_phase: "applied", command_result: result });
    return;
  }
  if (phase === "applied") {
    const result = asObject(context.command_result);
    if (operation === "suspend_runtime") {
      const updated = await db.from("employees").update({ status: "suspended" }).eq("id", job.employee_id).eq("account_id", job.account_id);
      if (updated.error) throw updated.error;
      await finishCommandJob(db, job, { operation, container_name: result.container_name ?? null, suspended: true });
      return;
    }
    if (operation === "remove_runtime") {
      await finishCommandJob(db, job, { operation, removed: true, container_name: result.container_name ?? null, network_name: result.network_name ?? null });
      return;
    }
    const key = await effectKey(db, job, `verify_${operation}`);
    const inspection = await requireHostProvisioner({ ...inputs.request, operation: "inspect_runtime", idempotency_key: key });
    assertRuntimeAccepted(inspection);
    const updated = await db.from("employees").update({ status: "live", needs_reprovision: false }).eq("id", job.employee_id).eq("account_id", job.account_id);
    if (updated.error) throw updated.error;
    await finishCommandJob(db, job, { operation, verified: true, drift: inspectionEvidence(inspection) });
  }
}

async function processCommandJob(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  const command = String(job.command_type ?? "ensure_runtime");
  if (command === "rotate_model_gateway_credential") return processRotationCommand(db, job);
  if (command === "inspect_drift" || command === "repair_drift" || command === "ensure_runtime") return processDriftCommand(db, job);
  return processGenericCommand(db, job);
}

async function processCompensation(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  const context = asObject(job.worker_context);
  const phase = String(context.compensation_phase ?? "runtime");
  if (phase === "runtime" && job.employee_id) {
    try {
      const inputs = await runtimeInputs(db, job);
      const key = await effectKey(db, job, "compensate_remove_runtime");
      await requireHostProvisioner({ ...inputs.request, operation: "remove_runtime", idempotency_key: key });
    } catch (err) {
      if (!/manifest|gateway_port|employee/.test(String((err as Error).message ?? err))) throw err;
    }
    await saveContext(db, job, { compensation_phase: "credentials" });
    return;
  }
  if (phase === "credentials") {
    const mcpId = context.mcp_credential_id;
    const modelId = context.model_gateway_credential_id;
    if (typeof mcpId === "string") await revokeEmployeeMcpCredential(db, mcpId);
    if (typeof modelId === "string") await revokeModelGatewayCredential(db, modelId);
    await saveContext(db, job, { compensation_phase: "finalize" });
    return;
  }
  if (job.employee_id) await db.from("employees").update({ status: "failed" }).eq("id", job.employee_id).eq("account_id", job.account_id);
  const transition = await transitionProvisioning(db, {
    provisioning_job_id: job.id,
    account_id: job.account_id,
    employee_id: job.employee_id,
    expected_state: "compensating",
    to_state: "compensated",
    attempt: Number(job.attempt_count ?? 1),
    evidence: { compensation_complete: true },
  });
  if (!transition.applied) throw new Error("compensation_transition_conflict");
  await db.from("provisioning_jobs").update({ completed_at: nowIso(), lease_token: null, lease_expires_at: null, updated_at: nowIso() }).eq("id", job.id);
  await completeLinkedCommand(db, job, "compensated", { compensation_complete: true });
}

async function handleJobFailure(db: SupabaseClient, job: ProvisioningJobRow, err: unknown): Promise<void> {
  const retryClass = classifyProvisioningError(err);
  const attempt = Number(job.attempt_count ?? 1);
  const message = String((err as Error).message ?? err).slice(0, 500);
  if (retryClass === "retryable" && attempt < Number(job.max_attempts ?? 12)) {
    const updated = await db.from("provisioning_jobs").update({
      retry_class: retryClass,
      next_attempt_at: retryAt(attempt),
      last_error: { message, at: nowIso() },
      lease_token: null,
      lease_expires_at: null,
      updated_at: nowIso(),
    }).eq("id", job.id);
    if (updated.error) throw updated.error;
    return;
  }
  if (String(job.command_type ?? "ensure_runtime") !== "ensure_runtime") {
    const updated = await db.from("provisioning_jobs").update({ state: "failed", retry_class: retryClass, failure_state: message, last_error: { message, at: nowIso() }, completed_at: nowIso(), lease_token: null, lease_expires_at: null, updated_at: nowIso() }).eq("id", job.id);
    if (updated.error) throw updated.error;
    await completeLinkedCommand(db, job, "failed", { retry_class: retryClass, failure_state: message });
    return;
  }
  if (["requested", "running", "queued"].includes(job.state)) {
    const updated = await db.from("provisioning_jobs").update({ state: "failed", retry_class: retryClass, failure_state: message, last_error: { message, at: nowIso() }, completed_at: nowIso(), lease_token: null, lease_expires_at: null, updated_at: nowIso() }).eq("id", job.id);
    if (updated.error) throw updated.error;
    return;
  }
  const transition = await transitionProvisioning(db, {
    provisioning_job_id: job.id,
    account_id: job.account_id,
    employee_id: job.employee_id,
    expected_state: job.state as ProvisioningState,
    to_state: "compensating",
    attempt,
    retry_class: retryClass,
    error: { message },
  });
  if (!transition.applied) throw new Error("begin_compensation_transition_conflict");
  await saveContext(db, job, { compensation_phase: "runtime" });
}

async function processClaimedJob(db: SupabaseClient, job: ProvisioningJobRow): Promise<void> {
  try {
    if (job.state === "compensating") await processCompensation(db, job);
    else if (String(job.command_type ?? "ensure_runtime") === "ensure_runtime" && typeof asObject(job.worker_context).command_id !== "string") await processInitialProvisioning(db, job);
    else await processCommandJob(db, job);
  } catch (err) {
    await handleJobFailure(db, job, err);
  }
}

async function maybeScheduleFleetDrift(db: SupabaseClient): Promise<void> {
  const intervalMs = Math.max(60_000, Number(process.env.PROVISIONING_DRIFT_SCAN_INTERVAL_MS ?? 15 * 60_000));
  if (Date.now() - lastDriftScanAt < intervalMs) return;
  lastDriftScanAt = Date.now();
  const employees = await db.from("employees").select("id,account_id").eq("status", "live").order("created_at", { ascending: true }).limit(100);
  if (employees.error) throw employees.error;
  const bucket = Math.floor(Date.now() / intervalMs);
  for (const employee of employees.data ?? []) {
    await queueProvisioningCommand(db, {
      account_id: String(employee.account_id),
      employee_id: String(employee.id),
      command_type: "inspect_drift",
      requested_by: "fleet-reconciler",
      idempotency_key: `fleet-drift:${employee.id}:${bucket}`,
      payload: { reason: "periodic_fleet_reconciliation", reboot_reconstructable: true },
    });
  }
}

export async function runProvisioningReconcilerCycle(db: SupabaseClient = serviceClient()): Promise<{ command_claimed: boolean; job_claimed: boolean }> {
  const command = await claimNextCommand(db);
  if (command) await materializeCommandJob(db, command);
  const job = await claimNextJob(db);
  if (job && !TERMINAL_JOB_STATES.has(job.state)) await processClaimedJob(db, job);
  await maybeScheduleFleetDrift(db);
  return { command_claimed: Boolean(command), job_claimed: Boolean(job) };
}

export function startProvisioningReconciler(): void {
  if (workerTimer || process.env.PROVISIONING_RECONCILER_DISABLED === "1") return;
  const intervalMs = Math.max(250, Number(process.env.PROVISIONING_RECONCILER_INTERVAL_MS ?? 1_000));
  const tick = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      await runProvisioningReconcilerCycle();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[provisioning-reconciler] cycle failed", String((err as Error).message ?? err));
    } finally {
      workerRunning = false;
    }
  };
  workerTimer = setInterval(() => void tick(), intervalMs);
  workerTimer.unref();
  void tick();
}

export function stopProvisioningReconciler(): void {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
}
