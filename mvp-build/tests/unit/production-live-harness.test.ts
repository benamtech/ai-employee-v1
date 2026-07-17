import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFile(join(root, path), "utf8");

interface Phase {
  id: string;
  script: string;
  destructive?: boolean;
  required_evidence: string[];
}

describe("production-boundary live proof manifest", () => {
  it("maps every unresolved acceptance item to a fail-closed executable proof phase", async () => {
    const manifest = JSON.parse(await read("infra/acceptance/production-boundary-live.json")) as { phases: Phase[] };
    const expected = [
      "migration-staging",
      "gateway-two-employee-isolation",
      "gateway-credential-http-matrix",
      "credential-rotation",
      "reboot-and-drift-repair",
      "compensation-and-marker-recovery",
      "provider-inbox-reliability",
      "canonical-browser-onboarding",
      "provider-backed-work-object",
    ];
    expect(manifest.phases.map((phase) => phase.id)).toEqual(expected);
    for (const phase of manifest.phases) {
      expect(phase.script).toMatch(/^infra\/scripts\/acceptance\/.+\.mjs$/);
      expect(phase.required_evidence.length).toBeGreaterThan(0);
      const source = await read(phase.script);
      expect(source).toContain("writeProof");
      expect(source).toContain("requireEnv");
      expect(source).not.toContain("DEV_OWNER_LOGIN");
      expect(source).not.toContain('fetch("/api/dev/login"');
      expect(source).not.toContain("NEXT_PUBLIC_AMTECH_UI_FIXTURES");
      if (phase.destructive) {
        expect(source).toContain("requireDestructiveApproval");
      }
    }
  });

  it("provides one orchestrator that validates evidence and refuses skipped phases", async () => {
    const orchestrator = await read("infra/scripts/acceptance/production-boundary-live.mjs");
    expect(orchestrator).toContain("production-boundary-live.json");
    expect(orchestrator).toContain("allowSkipped");
    expect(orchestrator).toContain("status !== \"passed\"");
    expect(orchestrator).toContain("required_evidence");
  });

  it("keeps canonical onboarding and generated-work proof on real owner surfaces", async () => {
    const onboarding = await read("infra/scripts/prod-onboarding-proof.mjs");
    const workObject = await read("infra/scripts/acceptance/generated-work-object-live-proof.mjs");
    expect(onboarding).toContain("/create-ai-employee");
    expect(onboarding).not.toContain("DEV_OWNER_LOGIN");
    expect(workObject).toContain("/manager/employee/");
    expect(workObject).toContain("/resources");
    expect(workObject).toContain("/manager/materialization/diagnostics");
    expect(workObject).toContain("provider_backed");
  });
});
