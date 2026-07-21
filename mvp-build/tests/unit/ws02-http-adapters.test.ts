import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import {
  discoverRemoteMcpAuthorization,
  remoteMcpResourceMetadataFromChallenge,
} from "../../apps/manager/src/lib/remote-mcp-discovery";
import {
  openRemoteMcpAccessToken,
  sealRemoteMcpTokenSet,
} from "../../apps/manager/src/lib/remote-mcp-token-custody";
import {
  publishProgress,
  subscribeProgress,
  type ProgressEvent,
  type ProgressScope,
} from "../../apps/manager/src/lib/progress-bus";

beforeAll(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789abcdef";
});

describe("remote MCP discovery and token custody", () => {
  it("discovers the authorization server only through protected-resource metadata", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      expect(init?.redirect).toBe("error");
      if (url === "https://mcp.example/.well-known/oauth-protected-resource/public/mcp") {
        return Response.json({
          resource: "https://mcp.example/public/mcp",
          authorization_servers: ["https://auth.example"],
          scopes_supported: ["records.read"],
        });
      }
      if (url === "https://auth.example/.well-known/oauth-authorization-server") {
        return Response.json({
          issuer: "https://auth.example",
          authorization_endpoint: "https://auth.example/authorize",
          token_endpoint: "https://auth.example/token",
          code_challenge_methods_supported: ["S256"],
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code"],
          scopes_supported: ["records.read"],
        });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    const result = await discoverRemoteMcpAuthorization({
      fetcher,
      policy: {
        resource_url: "https://mcp.example/public/mcp",
        redirect_uri: "https://app.amtechai.com/connectors/mcp/callback",
        allowed_redirect_uris: ["https://app.amtechai.com/connectors/mcp/callback"],
        requested_scopes: ["records.read"],
        client_id: "https://app.amtechai.com/.well-known/oauth-client",
      },
    });
    expect(result.decision.ok).toBe(true);
    expect(result.decision.binding).toMatchObject({
      resource: "https://mcp.example/public/mcp",
      authorization_server: "https://auth.example",
      token_endpoint: "https://auth.example/token",
    });
    expect(fetcher).not.toHaveBeenCalledWith(expect.stringContaining("evil"), expect.anything());
  });

  it("accepts challenge metadata only from the protected resource origin", () => {
    expect(remoteMcpResourceMetadataFromChallenge(
      'Bearer resource_metadata="https://mcp.example/.well-known/oauth-protected-resource/public/mcp"',
      "https://mcp.example/public/mcp",
    )).toContain("mcp.example/.well-known/oauth-protected-resource");
    expect(() => remoteMcpResourceMetadataFromChallenge(
      'Bearer resource_metadata="https://evil.example/metadata"',
      "https://mcp.example/public/mcp",
    )).toThrow("remote_mcp_resource_metadata_cross_origin");
  });

  it("seals tokens in the current Manager envelope backend and rejects audience drift", () => {
    const sealed = sealRemoteMcpTokenSet({
      token: {
        access_token: "access-secret-value",
        refresh_token: "refresh-secret-value",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "records.read",
        resource: "https://mcp.example/public/mcp",
      },
      expected_resource: "https://mcp.example/public/mcp",
      requested_scopes: ["records.read"],
      now: "2026-07-20T00:00:00.000Z",
    });
    expect(JSON.stringify(sealed)).not.toContain("access-secret-value");
    expect(openRemoteMcpAccessToken(sealed, Date.parse("2026-07-20T00:30:00.000Z"))).toBe("access-secret-value");
    expect(() => sealRemoteMcpTokenSet({
      token: { access_token: "token", resource: "https://other.example/mcp" },
      expected_resource: "https://mcp.example/public/mcp",
      requested_scopes: [],
    })).toThrow("remote_mcp_token_resource_mismatch");
  });
});

describe("assignment-scoped low-latency projection", () => {
  it("never delivers one assignment's progress to another assignment", () => {
    const scopeA: ProgressScope = { account_id: "acct_1", employee_id: "emp_1", assignment_id: "asn_a" };
    const scopeB: ProgressScope = { account_id: "acct_1", employee_id: "emp_1", assignment_id: "asn_b" };
    const received: ProgressEvent[] = [];
    const unsubscribe = subscribeProgress(scopeA, (event) => received.push(event));
    publishProgress(scopeB, { run_id: "run_b", verb: "Working", state: "step" });
    publishProgress(scopeA, { run_id: "run_a", verb: "Working", state: "step" });
    publishProgress("emp_1", { run_id: "legacy", verb: "Legacy", state: "step" });
    unsubscribe();
    expect(received.map((event) => event.run_id)).toEqual(["run_a"]);
  });
});

describe("streaming protocol HTTP surfaces", () => {
  it("binds Manager stream frames and subscriptions to assignment authority before AG-UI projection", async () => {
    const [server, route, bus] = await Promise.all([
      readFile("apps/manager/src/server.ts", "utf8"),
      readFile("apps/web/app/api/employee/[employeeId]/ag-ui/route.ts", "utf8"),
      readFile("apps/manager/src/lib/progress-bus.ts", "utf8"),
    ]);
    expect(server).toContain('action: "stream:read"');
    expect(server).toContain("const assignmentId = authority.assignment.assignment_id");
    expect(server).toContain("subscribeProgress({");
    expect(server).toContain("account_id: accountId");
    expect(server).toContain("employee_id: employeeId");
    expect(server).toContain("assignment_id: assignmentId");
    expect(server).toContain("buildEmployeeSnapshot(db, employeeId, accountId, assignmentId)");
    expect(server).toContain("fetchWorkEventsSince(db, employeeId, accountId, cursor, assignmentId)");
    expect(bus).toContain("progress:${scope.account_id}:${scope.employee_id}:${scope.assignment_id}");
    expect(route).toContain("ag_ui_authority_scope_drift");
    expect(route).toContain("projectWorkStreamEventToAgUi");
    expect(route).toContain('message: "ag_ui_stream_interrupted"');
    expect(route).not.toContain("message: String((error as Error).message");
  });

  it("routes MCP App actions through existing effects with current assignment/version interception", async () => {
    const [route, card, server] = await Promise.all([
      readFile("apps/web/app/api/employee/[employeeId]/protocol-action/route.ts", "utf8"),
      readFile("apps/web/app/agent/[employeeId]/components/WorkCard.tsx", "utf8"),
      readFile("apps/manager/src/server.ts", "utf8"),
    ]);
    expect(route).toContain("validateAgUiClientCommandShape");
    expect(route).toContain('command.resource_type === "approval"');
    expect(route).toContain('/manager/tools/resolve_approval');
    expect(route).toContain('/manager/employee/${employeeId}/message');
    expect(card).toContain('/api/employee/${employeeId}/protocol-action');
    expect(card).toContain('profile: "amtech.mcp-app.v1"');
    expect(server).toContain("protocol_assignment_mismatch");
    expect(server).toContain("protocol_authority_version_stale");
    expect(server).toContain("protocol_authority_incomplete");
    for (const forbidden of ["api.stripe.com", "quickbooks.api.intuit.com", "accounts.google.com", "Authorization: Bearer"]) {
      expect(route).not.toContain(forbidden);
    }
  });
});
