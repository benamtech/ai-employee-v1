import type { SupabaseClient } from "@amtech/db";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runRuntimeStart } from "./profile-renderer.js";

export interface RuntimeRecoveryResult {
  status: "recovered" | "skipped";
  output: string;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function neutralizeGatewayState(generatedPath: string): string | null {
  const path = join(generatedPath, "gateway_state.json");
  if (!existsSync(path)) return null;
  try {
    const state = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    writeFileSync(`${path}.stale-bak`, JSON.stringify(state), "utf8");
    state.gateway_state = "stopped";
    state.pid = null;
    state.exit_reason = "recovered_by_manager";
    state.restart_requested = false;
    state.active_agents = 0;
    writeFileSync(path, JSON.stringify(state), "utf8");
    return "gateway_state:neutralized";
  } catch (err) {
    return `gateway_state:neutralize_failed:${String((err as Error).message ?? err)}`;
  }
}

async function waitForRuntimeHealth(baseUrl: string | null | undefined): Promise<string> {
  if (!baseUrl) return "health_wait:skipped";
  let last = "not_checked";
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(3000) });
      last = `http_${res.status}`;
      if (res.ok) return "health_wait:ok";
    } catch (err) {
      last = String((err as Error).message ?? err);
    }
    await sleep(1000);
  }
  throw new Error(`runtime_recovery_health_timeout:${last}`);
}

export async function recoverEmployeeRuntime(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
}): Promise<RuntimeRecoveryResult> {
  const { data: build } = await db
    .from("employee_profile_builds")
    .select("generated_path")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const generatedPath = (build as { generated_path?: string | null } | null)?.generated_path;
  if (!generatedPath) return { status: "skipped", output: "generated_path_missing" };

  const { data: runtime } = await db
    .from("runtime_endpoints")
    .select("api_base_url,webchat_api_url")
    .eq("employee_id", input.employee_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const gatewayState = neutralizeGatewayState(generatedPath);
  const output = await runRuntimeStart(generatedPath);
  const healthWait = await waitForRuntimeHealth((runtime as { api_base_url?: string | null; webchat_api_url?: string | null } | null)?.api_base_url ?? (runtime as { webchat_api_url?: string | null } | null)?.webchat_api_url);
  await db
    .from("runtime_endpoints")
    .update({
      health: {
        status: "recovered",
        recovered_at: new Date().toISOString(),
        recovery_output: output,
        gateway_state: gatewayState,
        health_wait: healthWait,
      },
    })
    .eq("employee_id", input.employee_id);
  return { status: "recovered", output };
}
