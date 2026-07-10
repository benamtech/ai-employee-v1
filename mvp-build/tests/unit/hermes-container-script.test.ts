import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Hermes container launch hardening", () => {
  it("drops capabilities, forbids privilege escalation, and sets resource limits", async () => {
    const script = await readFile("infra/scripts/local/start-hermes-container.sh", "utf8");
    expect(script).toContain("--cap-drop=ALL");
    expect(script).toContain("--security-opt=no-new-privileges");
    expect(script).toContain("--pids-limit=");
    expect(script).toContain("--memory=");
    expect(script).toContain("--cpus=");
  });
});
