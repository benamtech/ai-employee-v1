import { afterEach, describe, expect, it } from "vitest";
import { employeeContainerLabels, employeeContainerName, runEmployeeLifecycleAction } from "../../apps/manager/src/lib/employee-lifecycle";

const saved = process.env.EMPLOYEE_LIFECYCLE_COMMAND;

describe("employee lifecycle helpers", () => {
  afterEach(() => {
    if (saved === undefined) delete process.env.EMPLOYEE_LIFECYCLE_COMMAND;
    else process.env.EMPLOYEE_LIFECYCLE_COMMAND = saved;
  });

  it("uses stable names and labels for Docker discovery/GC", () => {
    expect(employeeContainerName("emp_1")).toBe("amtech-hermes-emp_1");
    expect(employeeContainerLabels({ account_id: "acct_1", employee_id: "emp_1", profile_id: "client_emp_1" })).toEqual([
      "com.amtech.kind=employee-runtime",
      "com.amtech.account_id=acct_1",
      "com.amtech.employee_id=emp_1",
      "com.amtech.profile_id=client_emp_1",
    ]);
  });

  it("skips host lifecycle actions when no command is configured", async () => {
    delete process.env.EMPLOYEE_LIFECYCLE_COMMAND;
    await expect(runEmployeeLifecycleAction("stop", { account_id: "acct_1", employee_id: "emp_1" }))
      .resolves.toEqual({ status: "skipped", output: "employee_lifecycle_command:skipped" });
  });
});
