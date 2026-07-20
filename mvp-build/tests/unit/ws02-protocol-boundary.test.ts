import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  AMTECH_PROTOCOL_AUTHORITY_VERSION,
  buildRemoteMcpAuthorizationUrl,
  decideProjectedAction,
  projectWorkStreamEventToAgUi,
  protectedResourceMetadataCandidates,
  validateAgUiClientCommandShape,
  validateMcpAppSecurityMetadata,
  validateRemoteMcpAuthorizationCallback,
  validateRemoteMcpAuthorizationMetadata,
  type AuthorityProjection,
  type McpAppSecurityMetadata,
} from "../../packages/shared/src/index";

const projection: AuthorityProjection = {
  protocol_version: AMTECH_PROTOCOL_AUTHORITY_VERSION,
  protocol: "mcp_app",
  assignment_id: "asn_1",
  authority_version: "authv_7",
  resource_type: "approval",
  resource_id: "apr_1",
  allowed_actions: ["approve", "reject"],
  issued_at: "2026-07-20T00:00:00.000Z",
  expires_at: "2026-07-20T01:00:00.000Z",
};

describe("Manager-owned presentation authority", () => {
  it("intersects projected and current authority instead of trusting the client", () => {
    expect(decideProjectedAction({
      projection,
      current: {
        assignment_id: "asn_1",
        authority_version: "authv_7",
        resource_type: "approval",
        resource_id: "apr_1",
        allowed_actions: ["approve"],
        active: true,
        now: "2026-07-20T00:10:00.000Z",
      },
      requested_action: "approve",
    })).toEqual({ ok: true, action: "approve" });

    expect(decideProjectedAction({
      projection,
      current: {
        assignment_id: "asn_1",
        authority_version: "authv_8",
        resource_type: "approval",
        resource_id: "apr_1",
        allowed_actions: ["approve"],
        active: true,
        now: "2026-07-20T00:10:00.000Z",
      },
      requested_action: "approve",
    })).toEqual({ ok: false, reason: "authority_version_mismatch" });

    expect(decideProjectedAction({
      projection,
      current: {
        assignment_id: "asn_1",
        authority_version: "authv_7",
        resource_type: "approval",
        resource_id: "apr_1",
        allowed_actions: ["approve"],
        active: true,
        now: "2026-07-20T00:10:00.000Z",
      },
      requested_action: "send_money",
    })).toEqual({ ok: false, reason: "action_not_projected" });
  });

  it("rejects MCP App direct network and undeclared host methods", () => {
    const metadata: McpAppSecurityMetadata = {
      extension: "io.modelcontextprotocol/ui",
      resource_uri: "ui://amtech/approval/apr_1",
      mime_type: "text/html;profile=mcp-app",
      resource_hash: "a".repeat(64),
      csp: { connect_domains: [], resource_domains: [], frame_domains: [] },
      permissions: [],
      host_methods: ["ui/initialize", "tools/call"],
      authority: projection,
    };
    expect(validateMcpAppSecurityMetadata(metadata)).toEqual({ ok: true });
    expect(validateMcpAppSecurityMetadata({
      ...metadata,
      csp: { ...metadata.csp, connect_domains: ["https://provider.example"] },
    })).toEqual({ ok: false, reason: "mcp_app_direct_network_forbidden" });
  });
});

describe("remote protected MCP authorization", () => {
  const policy = {
    resource_url: "https://mcp.example.com/public/mcp",
    redirect_uri: "https://app.amtechai.com/connectors/mcp/callback",
    allowed_redirect_uris: ["https://app.amtechai.com/connectors/mcp/callback"],
    requested_scopes: ["records.read"],
    client_id: "https://app.amtechai.com/.well-known/oauth-client",
  };
  const protectedResource = {
    resource: "https://mcp.example.com/public/mcp",
    authorization_servers: ["https://auth.example.com"],
    scopes_supported: ["records.read"],
  };
  const authorizationServer = {
    issuer: "https://auth.example.com",
    authorization_endpoint: "https://auth.example.com/authorize",
    token_endpoint: "https://auth.example.com/token",
    code_challenge_methods_supported: ["S256"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    scopes_supported: ["records.read"],
  };

  it("derives metadata locations and exact audience from the protected resource", () => {
    expect(protectedResourceMetadataCandidates(policy.resource_url)).toEqual([
      "https://mcp.example.com/.well-known/oauth-protected-resource/public/mcp",
      "https://mcp.example.com/.well-known/oauth-protected-resource",
    ]);
    const decision = validateRemoteMcpAuthorizationMetadata({
      policy,
      protected_resource: protectedResource,
      authorization_server: authorizationServer,
    });
    expect(decision.ok).toBe(true);
    const built = buildRemoteMcpAuthorizationUrl({
      binding: decision.binding!,
      state: "s".repeat(48),
      code_challenge: "c".repeat(43),
    });
    const url = new URL(built.url);
    expect(url.searchParams.get("resource")).toBe(policy.resource_url);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("rejects caller-selected authorization servers, redirect drift, and callback state drift", () => {
    expect(validateRemoteMcpAuthorizationMetadata({
      policy,
      protected_resource: protectedResource,
      authorization_server: { ...authorizationServer, issuer: "https://evil.example" },
    })).toEqual({ ok: false, reason: "authorization_server_not_discovered" });
    expect(validateRemoteMcpAuthorizationMetadata({
      policy: { ...policy, redirect_uri: "https://evil.example/callback" },
      protected_resource: protectedResource,
      authorization_server: authorizationServer,
    })).toEqual({ ok: false, reason: "redirect_uri_not_allowlisted" });
    expect(validateRemoteMcpAuthorizationCallback({
      expected_state: "expected",
      received_state: "different",
      code: "code",
    })).toEqual({ ok: false, reason: "state_mismatch" });
  });
});

describe("AG-UI projection", () => {
  it("streams start/content in order while retaining assignment and authority metadata", () => {
    const events = projectWorkStreamEventToAgUi({
      kind: "assistant_delta",
      run_id: "run_1",
      message_id: "assistant:run_1",
      sequence: 0,
      delta: "Hello",
    }, {
      account_id: "acct_1",
      employee_id: "emp_1",
      assignment_id: "asn_1",
      authority_version: "authv_7",
      thread_id: "thread_1",
      sequence: 10,
      timestamp: 123,
    });
    expect(events.map((event) => event.type)).toEqual([
      "RUN_STARTED",
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
    ]);
    expect(events.map((event) => event.sequence)).toEqual([10, 11, 12]);
    expect(events[2].amtech).toMatchObject({ assignmentId: "asn_1", authorityVersion: "authv_7", projectionOnly: true });
  });

  it("accepts only finite command shapes; shape validity is not execution authority", () => {
    expect(validateAgUiClientCommandShape({
      profile: "amtech.ag-ui.v1",
      assignment_id: "asn_1",
      authority_version: "authv_7",
      resource_type: "approval",
      resource_id: "apr_1",
      action: "approve",
      idempotency_key: "agui:apr_1:approve",
    })).toBe(true);
    expect(validateAgUiClientCommandShape({ action: "approve" })).toBe(false);
  });
});

describe("streaming-first source boundary", () => {
  it("forwards Hermes deltas immediately and never recreates a started run after stream loss", async () => {
    const [live, runtime, stream] = await Promise.all([
      readFile("apps/manager/src/lib/hermes-live-turn.ts", "utf8"),
      readFile("apps/manager/src/lib/runtime.ts", "utf8"),
      readFile("packages/shared/src/work-stream.ts", "utf8"),
    ]);
    expect(live).toContain('kind: "assistant_delta"');
    expect(live).toContain("return pollCreatedRun(api, capabilities, runId)");
    expect(runtime).toContain('message_id: messageId');
    expect(stream).toContain('kind: "assistant_delta"');
    expect(live).not.toContain("stream failure -> create a second run");
  });
});
