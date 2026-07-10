import { describe, expect, it } from "vitest";
import { makeFakeDb } from "./_helpers/fake-supabase";
import {
  bearerToken,
  mintEmployeeMcpCredential,
  revokeEmployeeMcpCredential,
  verifyEmployeeMcpCredential,
} from "../../apps/manager/src/lib/mcp-auth";

describe("employee MCP credentials", () => {
  it("mints a scoped token, stores only its hash, and derives identity on verify", async () => {
    const db = makeFakeDb({ employee_mcp_credentials: [] });
    const minted = await mintEmployeeMcpCredential(db.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    expect(minted.token).toMatch(/^mcp_/);
    expect(db.tables.employee_mcp_credentials![0].token_hash).not.toContain(minted.token);
    expect(db.tables.employee_mcp_credentials![0].token_prefix).toBe(minted.token.slice(0, 12));

    const identity = await verifyEmployeeMcpCredential(db.asClient(), `Bearer ${minted.token}`);
    expect(identity).toEqual({ account_id: "acct_1", employee_id: "emp_1", credential_id: minted.credential_id });
    expect(db.tables.employee_mcp_credentials![0].last_used_at).toBeTruthy();
  });

  it("rejects non-MCP, revoked, and expired tokens", async () => {
    const db = makeFakeDb({ employee_mcp_credentials: [] });
    const minted = await mintEmployeeMcpCredential(db.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    expect(await verifyEmployeeMcpCredential(db.asClient(), "Bearer global-internal-token")).toBeNull();

    await revokeEmployeeMcpCredential(db.asClient(), minted.credential_id);
    expect(await verifyEmployeeMcpCredential(db.asClient(), `Bearer ${minted.token}`)).toBeNull();

    const expired = await mintEmployeeMcpCredential(db.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    db.tables.employee_mcp_credentials!.find((r) => r.id === expired.credential_id)!.expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await verifyEmployeeMcpCredential(db.asClient(), `Bearer ${expired.token}`)).toBeNull();
  });

  it("parses bearer tokens strictly", () => {
    expect(bearerToken("Bearer mcp_abc")).toBe("mcp_abc");
    expect(bearerToken("mcp_abc")).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
  });
});
