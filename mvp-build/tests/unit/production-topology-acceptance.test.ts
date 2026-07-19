import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

describe("target-host production topology acceptance", () => {
  it("keeps replacement and teardown behind governed lifecycle commands", async () => {
    const lifecycle = await source("infra/scripts/employee-lifecycle.mjs");
    expect(lifecycle).toContain('replace: "replace_runtime"');
    expect(lifecycle).toContain('teardown: "teardown"');
    expect(lifecycle).toContain("/manager/provisioning/commands");
    expect(lifecycle).not.toContain('docker(["rm"');
    expect(lifecycle).not.toContain('docker(["network", "rm"');
  });

  it("defines a two-employee isolation, replacement, and teardown gate with a disposable-target wall", async () => {
    const harness = await source("infra/scripts/acceptance/target-host-two-employee-isolation.mjs");
    expect(harness).toContain("EMPLOYEE_A_ID");
    expect(harness).toContain("EMPLOYEE_B_ID");
    expect(harness).toContain("AMTECH_ALLOW_DESTRUCTIVE_ISOLATION_TEST");
    expect(harness).toContain("AMTECH_DISPOSABLE_EMPLOYEE_IDS");
    expect(harness).toContain("assertCrossEmployeeDenial(employeeA, employeeB)");
    expect(harness).toContain("assertCrossEmployeeDenial(employeeB, employeeA)");
    expect(harness).toContain("assertInternetEgressDenied(employeeA)");
    expect(harness).toContain("assertInternetEgressDenied(employeeB)");
    expect(harness).toContain('queueLifecycle("replace", employeeA)');
    expect(harness).toContain('queueLifecycle("teardown", employeeA)');
    expect(harness).toContain("employee B changed during A replacement");
    expect(harness).toContain("employee B changed during A teardown");
  });

  it("parses as executable Node source", () => {
    const result = spawnSync("node", ["--check", "infra/scripts/acceptance/target-host-two-employee-isolation.mjs"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(result.status, `${result.stdout ?? ""}\n${result.stderr ?? ""}`).toBe(0);
  });
});
