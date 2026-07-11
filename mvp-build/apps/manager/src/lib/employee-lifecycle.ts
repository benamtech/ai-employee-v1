import { runCommandString } from "./command-runner.js";

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

function lifecycleScript(): string | undefined {
  return process.env.EMPLOYEE_LIFECYCLE_COMMAND;
}

export async function runEmployeeLifecycleAction(
  action: "restart" | "stop" | "inspect" | "gc",
  target: EmployeeLifecycleTarget,
): Promise<{ status: "skipped" | "ok"; output: string }> {
  const script = lifecycleScript();
  if (!script) return { status: "skipped", output: "employee_lifecycle_command:skipped" };
  const command = `${script} ${action} ${target.employee_id}`;
  const result = await runCommandString(command, process.cwd(), `employee lifecycle ${action}`);
  return { status: "ok", output: result.output };
}
