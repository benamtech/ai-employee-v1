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

  it("seals tokens in Manager custody and rejects audience drift", () => {
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

describe("streaming protocol HTTP surfaces", () => {
  it("binds Manager stream frames to assignment authority before AG-UI projection", async () => {
    const [patch, route] = await Promise.all([
      readFile("apps/manager/scripts/patch-production-stream.mjs", "utf8"),
      readFile("apps/web/app/api/employee/[employeeId]/ag-ui/route.ts", "utf8"),
    ]);
    expect(patch).toContain('scope_type", "employee_assignment"');
    expect(patch).toContain("authority_version");
    expect(patch).toContain("...streamScope, ...p");
    expect(route).toContain("ag_ui_authority_scope_drift");
    expect(route).toContain("projectWorkStreamEventToAgUi");
    expect(route).toContain('"X-Accel-Buffering": "no"');
  });

  it("limits protocol actions to existing approval and owner-message authority routes", async () => {
    const route = await readFile("apps/web/app/api/employee/[employeeId]/protocol-action/route.ts", "utf8");
    expect(route).toContain("validateAgUiClientCommandShape");
    expect(route).toContain('command.resource_type === "approval"');
    expect(route).toContain('/manager/tools/resolve_approval');
    expect(route).toContain('/manager/employee/${employeeId}/message');
    expect(route).toContain("protocol_action_not_supported");
    for (const forbidden of ["api.stripe.com", "quickbooks.api.intuit.com", "accounts.google.com", "Authorization: Bearer"]) {
      expect(route).not.toContain(forbidden);
    }
  });
});
