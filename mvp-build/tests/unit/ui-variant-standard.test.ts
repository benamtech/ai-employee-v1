import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("UI variant standard", () => {
  it("defines a neutral capability model rather than a Web-client layout contract", () => {
    const contract = read("packages/shared/src/ui-variant.ts");
    expect(contract).toContain("EmployeeExperienceModelV1");
    expect(contract).toContain("reference_client");
    expect(contract).toContain("bounded");
    expect(contract).not.toContain("sidebar_width");
    expect(contract).not.toContain("card_layout");
  });

  it("keeps the production client as one optional reference implementation", () => {
    const publicContract = read("apps/web/ui-variants/contract.ts");
    const reference = read("apps/web/ui-variants/reference-client/index.tsx");
    expect(publicContract).toContain("reference_client: ReactNode");
    expect(reference).toContain("slots.reference_client");
  });

  it("uses generated literal lazy imports for independent chunks", () => {
    const registry = read("apps/web/app/_components/ui-variant/registry.generated.ts");
    expect(registry).toContain("lazy(() => import(\"../../../ui-variants/reference-client/index\"))");
    expect(registry).toContain("lazy(() => import(\"../../../ui-variants/radical-canvas/index\"))");
    expect(registry).not.toContain("import(`");
  });

  it("provides a live fixture route and one-command collaborator launcher", () => {
    expect(read("apps/web/app/ui-lab/variant/[variant]/[scenario]/page.tsx")).toContain("VariantFixtureLabClient");
    const launcher = read("scripts/ui-variant-collaborator.mjs");
    expect(launcher).toContain("ui-variant.mjs");
    expect(launcher).toContain("ui-lab-dev.mjs");
    expect(launcher).toContain("launchAgent");
  });

  it("validates every checked-in folder and generated registry", () => {
    const output = execFileSync(process.execPath, [resolve(root, "scripts/ui-variant.mjs"), "doctor"], { cwd: root, encoding: "utf8" });
    expect(output).toContain("UI variant doctor PASS");
  });

  it("ships active collaborator instructions for Claude, Codex, and Cursor", () => {
    const onboarding = read("UI_LAB_AGENT_ONBOARDING.md");
    expect(onboarding).toContain("ui-variant-collaborator.mjs");
    expect(onboarding).toContain("--agent claude");
    expect(onboarding).toContain("--agent codex");
    expect(onboarding).toContain("--agent cursor");
    expect(read("apps/web/ui-variants/AGENTS.md")).toContain("write only inside");
    expect(read("apps/web/ui-variants/CLAUDE.md")).toContain("@AGENTS.md");
    expect(read("apps/web/ui-variants/.cursor/rules/ui-variant-standard.mdc")).toContain("alwaysApply: true");
  });
});
