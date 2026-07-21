import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("connector operating substrate source contract", () => {
  it("keeps normal SMS conversational and binds decisions to exact durable context", () => {
    const prompt = read("apps/manager/src/lib/owner-turn-context.ts");
    const twilio = read("apps/manager/src/webhooks/twilio.ts");
    const migration = read("packages/db/migrations/0080_connector_operating_substrate.sql");
    const tool = read("apps/manager/src/tools/manager-extension-tools.ts");

    expect(prompt).toContain("Do not ask for a code, password, or repeated identity challenge");
    expect(prompt).toContain("resolve_owner_channel_decision");
    expect(prompt).toContain("never require a keyword such as YES");
    expect(twilio).toContain("loadSmsDecisionContextForTurn");
    expect(tool).toContain("resolveOwnerChannelDecision");
    expect(migration).toContain("channel_decision_contexts");
    expect(migration).toContain("amtech_resolve_sms_channel_decision");
    expect(migration).not.toContain("code_hash");
    expect(migration).not.toContain("action_verification_challenges");
  });

  it("closes connector lifecycle and revocation through one assignment authority", () => {
    const migration = read("packages/db/migrations/0080_connector_operating_substrate.sql");
    const lifecycle = read("apps/manager/src/lib/connector-lifecycle.ts");
    const routes = read("apps/manager/src/lib/connector-workbench-routes.ts");

    expect(migration).toContain("connector_capability_projections");
    expect(migration).toContain("connector_lifecycle_events");
    expect(migration).toContain("connector_setup_intents");
    expect(migration).toContain("amtech_revoke_connector_binding");
    expect(lifecycle).toContain("refreshAssignmentConnectorCapabilities");
    expect(lifecycle).toContain("revokeAssignmentConnector");
    expect(routes).toContain("connector:revoke");
    expect(routes).toContain("connector:setup:request");
  });

  it("gives native and long-tail tools the same GUI entry point", () => {
    const drawer = read("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx");
    const connectPage = read("apps/web/app/agent/[employeeId]/connect/[connector]/page.tsx");
    const connectRoute = read("apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts");

    expect(drawer).toContain("resolveConnectorSetupActionForCapability");
    expect(drawer).toContain("Set up ${setup.label}");
    expect(connectPage).toContain("Every connector uses the same AMTECH lifecycle");
    expect(connectPage).toContain("No power-user knowledge required");
    expect(connectRoute).toContain("/request");
    expect(connectRoute).toContain("connectors/revoke");
  });
});
