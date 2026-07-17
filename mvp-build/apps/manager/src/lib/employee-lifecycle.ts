import { serviceClient } from "@amtech/db";
import { queueProvisioningCommand, type ProvisioningCommandType } from "./provisioning-state-machine.js";

const LABEL_PREFIX = "com.amtech";

export interface EmployeeLifecycleTarget {
  account_id: string;
  employee_id: string;
  profile_id?: string | null;
}

export function employeeContainerName(employeeId: string): string {
  return `amtech-hermes-${employeeId}`;
}

export function employeeContainerLabels(target: EmployeeLifecycleTarget): string[] {
  return [
    `${LABEL_PREFIX}.kind=employee-runtime`,
    `${LABEL_PREFIX}.account_id=${target.account_id}`,
    `${LABEL_PREFIX}.employee_id=${target.employee_id}`,
    `${LABEL_PREFIX}.profile_id=${target.profile_id ?? `client_${target.employee_id}`}`,
  ];
}

function commandForAction(action: "restart" | "stop" | "inspect" | "gc"): ProvisioningCommandType {
  if (action === "restart") return "restore";
  if (action === "stop") return "suspend";
  if (action === "inspect") return "inspect_drift";
  return "teardown";
}

/**
 * Compatibility adapter for existing admin call sites. It no longer invokes a
 * process-local lifecycle script. Every mutation becomes durable desired state
 * and is applied by the leased provisioning reconciler.
 */
export async function runEmployeeLifecycleAction(
  action: "restart" | "stop" | "inspect" | "gc",
  target: EmployeeLifecycleTarget,
): Promise<{ status: "queued"; output: string; command_id: string; duplicate: boolean }> {
  const commandType = commandForAction(action);
  const queued = await queueProvisioningCommand(serviceClient(), {
    account_id: target.account_id,
    employee_id: target.employee_id,
    command_type: commandType,
    requested_by: "employee-lifecycle-adapter",
    idempotency_key: `lifecycle:${action}:${target.account_id}:${target.employee_id}:${Date.now()}`,
    payload: { source_action: action, profile_id: target.profile_id ?? null },
  });
  return {
    status: "queued",
    output: `provisioning_command:${queued.command_id}`,
    command_id: queued.command_id,
    duplicate: queued.duplicate,
  };
}
