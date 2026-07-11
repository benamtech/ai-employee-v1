import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Hermes container launch hardening", () => {
  it("drops capabilities, forbids privilege escalation, and sets resource limits", async () => {
    const script = await readFile("infra/scripts/local/start-hermes-container.sh", "utf8");
    expect(script).toContain("--cap-drop=ALL");
    expect(script).toContain("HERMES_CONTAINER_CAP_ADD");
    expect(script).toContain("--cap-add=");
    expect(script).toContain("--security-opt=no-new-privileges");
    expect(script).toContain("--pids-limit=");
    expect(script).toContain("--memory=");
    expect(script).toContain("--cpus=");
    expect(script).toContain("--restart=");
    expect(script).toContain("--label=\"com.amtech.kind=employee-runtime\"");
    expect(script).toContain("--network-alias");
    expect(script).toContain("--log-driver=");
  });
});
