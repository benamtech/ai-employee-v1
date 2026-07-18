#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const [action, employeeId] = process.argv.slice(2);

function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout ?? ""}${result.stderr ?? ""}`.trim() || `docker ${args.join(" ")} failed`);
  return String(result.stdout ?? "").trim();
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function requireEmployee() {
  if (!employeeId) throw new Error("employee id required");
}

async function accountIdForEmployee() {
  const explicit = process.env.ACCOUNT_ID;
  if (explicit) return explicit;
  const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const { data, error } = await db.from("employees").select("account_id").eq("id", employeeId).maybeSingle();
  if (error) throw error;
  if (!data?.account_id) throw new Error("employee account not found");
  return data.account_id;
}

const commandByAction = {
  restart: "restore",
  stop: "suspend",
  repair: "repair_drift",
  reprovision: "reprovision",
  rotate: "rotate_model_gateway_credential",
};

async function queueLifecycleCommand(commandType) {
  const accountId = await accountIdForEmployee();
  const origin = required("MANAGER_API_ORIGIN").replace(/\/$/, "");
  const response = await fetch(`${origin}/manager/provisioning/commands`, {
    method: "POST",
    headers: { Authorization: `Bearer ${required("MANAGER_INTERNAL_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      employee_id: employeeId,
      command_type: commandType,
      requested_by: "employee-lifecycle-cli",
      idempotency_key: `employee-lifecycle:${commandType}:${employeeId}:${Date.now()}`,
      payload: { source: "infra/scripts/employee-lifecycle.mjs" },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (![200, 202].includes(response.status) || !body.command_id) throw new Error(`lifecycle command rejected:${response.status}:${JSON.stringify(body)}`);
  console.log(JSON.stringify({ status: "queued", action, command_type: commandType, employee_id: employeeId, account_id: accountId, command_id: body.command_id, duplicate: Boolean(body.duplicate) }));
}

try {
  if (!action || action === "help" || action === "--help") {
    console.log("Usage: node infra/scripts/employee-lifecycle.mjs <inspect|restart|stop|repair|reprovision|rotate> <employee_id>");
    process.exit(0);
  }
  requireEmployee();
  if (action === "inspect") {
    console.log(docker(["inspect", `amtech-hermes-${employeeId}`, "--format", "{{json .State}}"]))
  } else if (action === "gc") {
    throw new Error("direct runtime GC is disabled; use reconciler drift inspection and repair");
  } else {
    const commandType = commandByAction[action];
    if (!commandType) throw new Error(`unknown action ${action}`);
    await queueLifecycleCommand(commandType);
  }
} catch (err) {
  console.error(`employee-lifecycle:${String(err?.message ?? err)}`);
  process.exit(1);
}
