import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  AMTECH_PROTOCOL_AUTHORITY_VERSION,
  validateMcpAppSecurityMetadata,
  type McpAppSecurityMetadata,
} from "../../packages/shared/src/index";

const metadata: McpAppSecurityMetadata = {
  extension: "io.modelcontextprotocol/ui",
  resource_uri: "ui://amtech/approval/apr_1",
  mime_type: "text/html;profile=mcp-app",
  resource_hash: "a".repeat(64),
  csp: { connect_domains: [], resource_domains: [], frame_domains: [] },
  permissions: [],
  host_methods: ["ui/initialize", "tools/call"],
  authority: {
    protocol_version: AMTECH_PROTOCOL_AUTHORITY_VERSION,
    protocol: "mcp_app",
    assignment_id: "asn_1",
    authority_version: "7",
    resource_type: "approval",
    resource_id: "apr_1",
    allowed_actions: ["approve", "reject"],
    issued_at: "2026-07-20T00:00:00.000Z",
    expires_at: "2026-07-20T01:00:00.000Z",
  },
};

describe("WS-02 hardening regressions", () => {
  it("rejects all MCP App external-resource and permission requests", () => {
    expect(validateMcpAppSecurityMetadata(metadata)).toEqual({ ok: true });
    expect(validateMcpAppSecurityMetadata({
      ...metadata,
      csp: { ...metadata.csp, resource_domains: ["https://cdn.example"] },
    })).toEqual({ ok: false, reason: "mcp_app_direct_network_forbidden" });
    expect(validateMcpAppSecurityMetadata({
      ...metadata,
      permissions: ["clipboard-write"],
    })).toEqual({ ok: false, reason: "mcp_app_permission_not_allowed" });
  });

  it("enforces a document CSP instead of relying on iframe metadata", async () => {
    const source = await readFile("apps/manager/src/lib/ui-resources.ts", "utf8");
    for (const marker of [
      'http-equiv="Content-Security-Policy"',
      "default-src 'none'",
      "connect-src 'none'",
      "frame-src 'none'",
      "form-action 'none'",
    ]) expect(source).toContain(marker);
  });

  it("revalidates assignment policy and authority immediately before MCP dispatch", async () => {
    const source = await readFile("apps/manager/src/lib/mcp-capability-authority.ts", "utf8");
    expect(source).toContain('from("employee_assignments")');
    expect(source).toContain('from("authority_versions")');
    expect(source).toContain("current_policy_version");
    expect(source).toContain("current_authority_version");
    expect(source).toContain("authorityVersionMatches");
    expect(source).not.toContain("authority_version_matches: true");
  });

  it("rejects stale projected owner actions through one typed current-authority gate", async () => {
    const [server, authority] = await Promise.all([
      readFile("apps/manager/src/server.ts", "utf8"),
      readFile("apps/manager/src/lib/protocol-projection-authority.ts", "utf8"),
    ]);
    expect(server).toContain("validateProjectedProtocolAuthority");
    expect(server).toContain("loadCurrentAssignmentAuthorityVersion");
    expect(authority).toContain("protocol_assignment_mismatch");
    expect(authority).toContain("protocol_authority_version_stale");
    expect(authority).toContain("protocol_authority_incomplete");
    expect(authority).toContain('from("authority_versions")');
    expect(authority).toContain('eq("scope_type", "employee_assignment")');
    expect(authority).toContain('is("revoked_at", null)');
  });
});
