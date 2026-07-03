import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { isProductionRuntimeBackend, resolveRuntimeBackend, type RuntimeBackend } from "./runtime-backend.js";

export interface RuntimeHealthScope {
  account_id?: string;
  employee_id?: string;
  runner_type?: string;
}

export interface RuntimeHealthSnapshot {
  runtime_endpoint_id: string;
  account_id: string;
  employee_id: string;
  backend_type: RuntimeBackend;
  status: "healthy" | "degraded" | "unhealthy";
  checked_at: string;
  details: Record<string, unknown>;
}

async function ping(url: string | null | undefined): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!url) return { ok: false, error: "missing_webchat_api_url" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, error: String((err as Error).message ?? err).slice(0, 120) };
  }
}

function statusFor(details: {
  backend_type: RuntimeBackend;
  webchat_ok: boolean;
  sms_number_present: boolean;
  provisioning_state: string | null;
}): RuntimeHealthSnapshot["status"] {
  if (!details.webchat_ok || details.provisioning_state === "failed") return "unhealthy";
  if (!isProductionRuntimeBackend(details.backend_type) || !details.sms_number_present || details.provisioning_state !== "success") {
    return "degraded";
  }
  return "healthy";
}

export async function recordRuntimeHealthSnapshots(
  db: SupabaseClient,
  scope: RuntimeHealthScope = {},
): Promise<{ checked: number; healthy: number; degraded: number; unhealthy: number; snapshots: RuntimeHealthSnapshot[] }> {
  let employeeQuery = db.from("employees").select("id,account_id,status");
  if (scope.account_id) employeeQuery = employeeQuery.eq("account_id", scope.account_id);
  if (scope.employee_id) employeeQuery = employeeQuery.eq("id", scope.employee_id);
  else employeeQuery = employeeQuery.eq("status", "live");
  const { data: employees } = await employeeQuery.limit(100);
  const employeeRows = (employees ?? []) as Array<{ id: string; account_id: string; status?: string }>;
  const snapshots: RuntimeHealthSnapshot[] = [];

  for (const emp of employeeRows) {
    const { data: runtimeRaw } = await db
      .from("runtime_endpoints")
      .select("*")
      .eq("employee_id", emp.id)
      .maybeSingle();
    if (!runtimeRaw) continue;
    const runtime = runtimeRaw as {
      id: string;
      employee_id: string;
      backend_type?: string | null;
      sms_number_e164?: string | null;
      webchat_api_url?: string | null;
      gateway_port?: number | null;
    };
    const backend = resolveRuntimeBackend(runtime.backend_type ?? undefined);
    const webchat = await ping(runtime.webchat_api_url);
    const { data: jobRaw } = await db
      .from("provisioning_jobs")
      .select("state,failure_state")
      .eq("employee_id", emp.id)
      .maybeSingle();
    const provisioning = jobRaw as { state?: string | null; failure_state?: string | null } | null;
    const checkedAt = new Date().toISOString();
    const details = {
      runner_type: scope.runner_type ?? "manager",
      employee_status: emp.status ?? null,
      backend_type: backend,
      production_backend: isProductionRuntimeBackend(backend),
      webchat_ok: webchat.ok,
      webchat_status: webchat.status ?? null,
      webchat_error: webchat.error ?? null,
      sms_number_present: Boolean(runtime.sms_number_e164),
      gateway_port: runtime.gateway_port ?? null,
      provisioning_state: provisioning?.state ?? null,
      provisioning_failure_state: provisioning?.failure_state ?? null,
    };
    const status = statusFor(details);
    const snapshot: RuntimeHealthSnapshot = {
      runtime_endpoint_id: runtime.id,
      account_id: emp.account_id,
      employee_id: emp.id,
      backend_type: backend,
      status,
      checked_at: checkedAt,
      details,
    };
    await db.from("runtime_health_checks").insert({
      id: newId(ID_PREFIX.runtimeHealth),
      runtime_endpoint_id: runtime.id,
      account_id: emp.account_id,
      employee_id: emp.id,
      backend_type: backend,
      status,
      checked_at: checkedAt,
      details,
    });
    await db.from("runtime_endpoints").update({
      health: {
        checked_at: checkedAt,
        status,
        backend_type: backend,
        webchat_ok: webchat.ok,
        sms_number_present: Boolean(runtime.sms_number_e164),
      },
    }).eq("id", runtime.id);
    snapshots.push(snapshot);
  }

  return {
    checked: snapshots.length,
    healthy: snapshots.filter((s) => s.status === "healthy").length,
    degraded: snapshots.filter((s) => s.status === "degraded").length,
    unhealthy: snapshots.filter((s) => s.status === "unhealthy").length,
    snapshots,
  };
}
