import { describe, expect, it } from "vitest";
import { evaluateAuthorityVersion } from "../../packages/shared/src/index.js";

describe("S9 authority version contract", () => {
  it("accepts only the exact current non-revoked authority version", () => {
    expect(evaluateAuthorityVersion({
      issued: { scope_type: "human_principal", scope_id: "human_1", issued_version: 4 },
      current: { scope_type: "human_principal", scope_id: "human_1", current_version: 4 },
    })).toEqual({ ok: true, current_version: 4, issued_version: 4 });
  });

  it("denies stale, revoked, mismatched, and malformed authority snapshots", () => {
    const stale = evaluateAuthorityVersion({
      issued: { scope_type: "human_principal", scope_id: "human_1", issued_version: 4 },
      current: { scope_type: "human_principal", scope_id: "human_1", current_version: 5 },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.reason).toBe("authority_version_stale");

    const revoked = evaluateAuthorityVersion({
      issued: { scope_type: "human_principal", scope_id: "human_1", issued_version: 5 },
      current: {
        scope_type: "human_principal",
        scope_id: "human_1",
        current_version: 5,
        revoked_at: "2026-07-18T20:00:00.000Z",
      },
    });
    expect(revoked.ok).toBe(false);
    if (!revoked.ok) expect(revoked.reason).toBe("authority_revoked");

    const mismatch = evaluateAuthorityVersion({
      issued: { scope_type: "human_principal", scope_id: "human_1", issued_version: 5 },
      current: { scope_type: "human_principal", scope_id: "human_2", current_version: 5 },
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.reason).toBe("authority_scope_mismatch");

    const invalid = evaluateAuthorityVersion({
      issued: { scope_type: "human_principal", scope_id: "human_1", issued_version: 0 },
      current: { scope_type: "human_principal", scope_id: "human_1", current_version: 1 },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.reason).toBe("authority_version_invalid");
  });
});
