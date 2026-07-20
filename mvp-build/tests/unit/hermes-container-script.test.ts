import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Hermes container launch hardening", () => {
  it("drops all capabilities, restores only the fixed filesystem identity set, and sets resource limits", async () => {
    const script = await readFile("infra/scripts/local/start-hermes-container.sh", "utf8");
    expect(script).toContain("--cap-drop=ALL");
    for (const capability of ["CHOWN", "SETUID", "SETGID", "FOWNER", "DAC_OVERRIDE"]) {
      expect(script).toContain(`--cap-add=${capability}`);
    }
    expect(script).not.toContain("HERMES_CONTAINER_CAP_ADD");
    expect(script).toContain("--security-opt=no-new-privileges");
    expect(script).toContain("--pids-limit=");
    expect(script).toContain("--memory=");
    expect(script).toContain("--cpus=");
    expect(script).toContain("--restart=");
    expect(script).toContain("--read-only");
    expect(script).toContain("--label=\"com.amtech.kind=employee-runtime\"");
    expect(script).toContain("--network-alias");
    expect(script).toContain("--log-driver=");
  });
});
