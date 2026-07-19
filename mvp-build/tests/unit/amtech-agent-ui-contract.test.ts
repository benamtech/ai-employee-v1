import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

describe("AMTECH agent interface authority", () => {
  it("keeps one canonical design, interaction, and validation chain", async () => {
    const design = await source("../docs/AMTECH_WEB_DESIGN_SYSTEM.md");
    const agent = await source("../docs/AMTECH_AGENT_INTERFACE_STANDARD.md");
    const validation = await source("../docs/AMTECH_UI_VALIDATION_STANDARD.md");
    expect(design).toContain("Historical 369");
    expect(design).toContain("non-canonical");
    expect(agent).toContain("Command");
    expect(agent).toContain("Work");
    expect(agent).toContain("Decision");
    expect(agent).toContain("Proof");
    expect(validation).toContain("G9");
  });
});

describe("AMTECH runtime design tokens", () => {
  it("implements the canonical light palette, spacing, radii, focus, and motion", async () => {
    const css = await source("apps/web/app/globals.css");
    for (const token of [
      "--amtech-ink: #111111",
      "--amtech-white: #ffffff",
      "--amtech-canvas: #f7f9fc",
      "--amtech-red: #e11d2a",
      "--amtech-blue: #2563eb",
      "--amtech-cyan: #dff6ff",
      "--amtech-green: #168a57",
      "--amtech-space-1: 8px",
      "--amtech-radius-card: 20px",
      ":focus-visible",
      "prefers-reduced-motion",
    ]) expect(css.toLowerCase()).toContain(token.toLowerCase());
    expect(css).not.toContain("border-radius: 0;");
    expect(css).not.toContain("--font-plex-mono");
  });
});

describe("owner work surface", () => {
  it("uses stable intents, snapshots, and the four operational planes", async () => {
    const surface = await source("apps/web/app/agent/[employeeId]/AgentSurface.tsx");
    for (const marker of ["EventSource", "snapshot", "intent_id", "Command", "Work", "Decisions", "Proof"]) {
      expect(surface).toContain(marker);
    }
    expect(surface).toContain("WorkObjectRenderer");
    expect(surface).not.toContain("amber-");
  });
});

describe("MCP Apps boundary", () => {
  it("keeps generated UI sandboxed and allowlisted", async () => {
    const mcp = await source("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx");
    expect(mcp).toContain('sandbox="allow-scripts"');
    expect(mcp).toContain("e.source !== ref.current.contentWindow");
    expect(mcp).toContain("amtech-mcp-ui");
    expect(mcp).not.toContain("allow-same-origin");
  });
});

describe("verified onboarding activation", () => {
  it("requires secure identity UI and a cookie-bound provisioning proxy", async () => {
    const client = await source("apps/web/app/create-ai-employee/CreateClient.tsx");
    const route = await source("apps/web/app/api/front-door/provision/route.ts");
    expect(client).toContain("identityState");
    expect(client).toContain("taxId");
    expect(client).toContain("/api/front-door/identity/verify");
    expect(route).toContain("cookies");
    expect(route).toContain("owner_session_token");
  });
});

describe("evidence integrity", () => {
  it("marks the estimator as non-canonical", async () => {
    const estimator = await source("apps/web/app/free-estimator/FreeEstimatorClient.tsx");
    expect(estimator).toContain("Non-canonical preview");
  });
});
