import { describe, expect, it, vi } from "vitest";
import {
  loadCurrentAssignmentAuthorityVersion,
  validateProjectedProtocolAuthority,
} from "../../apps/manager/src/lib/protocol-projection-authority.js";

function dbResult(result: { data: Record<string, unknown> | null; error: unknown }) {
  const maybeSingle = vi.fn(async () => result);
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    maybeSingle,
  };
  const db = { from: vi.fn(() => builder) };
  return { db: db as never, builder, maybeSingle };
}

describe("projected protocol authority", () => {
  it("does not require projected metadata for non-protocol owner actions", async () => {
    const { db } = dbResult({ data: null, error: null });
    await expect(validateProjectedProtocolAuthority(db, "asn_1", {})).resolves.toEqual({
      ok: true,
      authority_version: null,
    });
    expect((db as any).from).not.toHaveBeenCalled();
  });

  it("rejects incomplete projected authority before a database read", async () => {
    const { db } = dbResult({ data: null, error: null });
    await expect(validateProjectedProtocolAuthority(db, "asn_1", {
      protocol_assignment_id: "asn_1",
    })).resolves.toEqual({
      ok: false,
      status: 400,
      error: "protocol_authority_incomplete",
    });
    expect((db as any).from).not.toHaveBeenCalled();
  });

  it("rejects projected assignment drift before effect dispatch", async () => {
    const { db } = dbResult({ data: { current_version: "7" }, error: null });
    await expect(validateProjectedProtocolAuthority(db, "asn_current", {
      protocol_assignment_id: "asn_stale",
      protocol_authority_version: "7",
    })).resolves.toEqual({
      ok: false,
      status: 409,
      error: "protocol_assignment_mismatch",
    });
    expect((db as any).from).not.toHaveBeenCalled();
  });

  it("accepts only the current non-revoked assignment authority version", async () => {
    const { db, builder } = dbResult({ data: { current_version: 7 }, error: null });
    await expect(validateProjectedProtocolAuthority(db, "asn_1", {
      protocol_assignment_id: "asn_1",
      protocol_authority_version: "7",
    })).resolves.toEqual({ ok: true, authority_version: "7" });
    expect((db as any).from).toHaveBeenCalledWith("authority_versions");
    expect(builder.eq).toHaveBeenCalledWith("scope_type", "employee_assignment");
    expect(builder.eq).toHaveBeenCalledWith("scope_id", "asn_1");
    expect(builder.is).toHaveBeenCalledWith("revoked_at", null);
  });

  it("rejects stale or unavailable authority versions", async () => {
    const stale = dbResult({ data: { current_version: "8" }, error: null });
    await expect(validateProjectedProtocolAuthority(stale.db, "asn_1", {
      protocol_assignment_id: "asn_1",
      protocol_authority_version: "7",
    })).resolves.toEqual({
      ok: false,
      status: 409,
      error: "protocol_authority_version_stale",
    });

    const unavailable = dbResult({ data: null, error: null });
    await expect(loadCurrentAssignmentAuthorityVersion(unavailable.db, "asn_1")).resolves.toBeNull();
  });

  it("propagates authority-store failures instead of treating them as stale", async () => {
    const failure = { code: "XX001", message: "database read failed" };
    const { db } = dbResult({ data: null, error: failure });
    await expect(loadCurrentAssignmentAuthorityVersion(db, "asn_1")).rejects.toBe(failure);
  });
});
