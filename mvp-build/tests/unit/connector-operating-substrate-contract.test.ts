import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("connector operating substrate source contract", () => {
  it("keeps normal SMS conversational and binds decisions to exact durable context", () => {
    const prompt = read("apps/manager/src/lib/owner-turn-context.ts");
    const twilio = read("apps/manager/src/webhooks/twilio.ts");
    const decisionRuntime = read("apps/manager/src/lib/channel-decisions.ts");
    const resolutionMigration = read("packages/db/migrations/0080_connector_operating_substrate.sql");
    const focusMigration = read("packages/db/migrations/0082_atomic_sms_decision_focus.sql");
    const tool = read("apps/manager/src/tools/manager-extension-tools.ts");

    expect(prompt).toContain("Do not ask for a code, password, or repeated identity challenge");
    expect(prompt).toContain("resolve_owner_channel_decision");
    expect(prompt).toContain("never require a keyword such as YES");
    expect(twilio).toContain("loadSmsDecisionContextForTurn");
    expect(tool).toContain("resolveOwnerChannelDecision");
    expect(resolutionMigration).toContain("channel_decision_contexts");
    expect(resolutionMigration).toContain("amtech_resolve_sms_channel_decision");
    expect(focusMigration).toContain("channel_decision_context_one_open_sms_idx");
    expect(focusMigration).toContain("amtech_open_sms_channel_decision_context");
    expect(focusMigration).toContain("pg_advisory_xact_lock");
    expect(focusMigration).toContain("on conflict (prompt_message_id, approval_id) do update");
    expect(decisionRuntime).toContain('db.rpc("amtech_open_sms_channel_decision_context"');
    expect(resolutionMigration).not.toContain("code_hash");
    expect(resolutionMigration).not.toContain("action_verification_challenges");
    expect(focusMigration).not.toContain("code_hash");
  });

  it("closes connector lifecycle, revoke, and verified reconnect through one assignment authority", () => {
    const lifecycleMigration = read("packages/db/migrations/0080_connector_operating_substrate.sql");
    const reconnectMigration = read("packages/db/migrations/0081_connector_reactivation_normalization.sql");
    const lifecycle = read("apps/manager/src/lib/connector-lifecycle.ts");
    const routes = read("apps/manager/src/lib/connector-workbench-routes.ts");

    expect(lifecycleMigration).toContain("connector_capability_projections");
    expect(lifecycleMigration).toContain("connector_lifecycle_events");
    expect(lifecycleMigration).toContain("connector_setup_intents");
    expect(lifecycleMigration).toContain("amtech_revoke_connector_binding");
    expect(reconnectMigration).toContain("amtech_normalize_connector_binding_activation");
    expect(reconnectMigration).toContain("amtech_project_connector_binding_activation");
    expect(reconnectMigration).toContain("capability_discovery_required");
    expect(reconnectMigration).toContain("if tg_op = 'INSERT' then");
    expect(lifecycle).toContain("refreshAssignmentConnectorCapabilities");
    expect(lifecycle).toContain("revokeAssignmentConnector");
    expect(routes).toContain("connector:revoke");
    expect(routes).toContain("connector:setup:request");
  });

  it("gives native and long-tail tools the same GUI entry point without optimistic readiness", () => {
    const drawer = read("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx");
    const connectPage = read("apps/web/app/agent/[employeeId]/connect/[connector]/page.tsx");
    const connectRoute = read("apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts");

    expect(drawer).toContain("resolveConnectorSetupActionForCapability");
    expect(drawer).toContain("Set up ${setup.label}");
    expect(connectPage).toContain("Every connector uses the same AMTECH lifecycle");
    expect(connectPage).toContain("No power-user knowledge required");
    expect(connectPage).toContain("No employee capability is promoted from the callback parameter alone");
    expect(connectPage).toContain("observedConnected");
    expect(connectRoute).toContain("/request");
    expect(connectRoute).toContain("connectors/revoke");
    expect(connectRoute).toContain("POST/Redirect/GET");
  });
});
