import { describe, it, expect, beforeAll } from "vitest";
import {
  mintSignedToken,
  verifySignedToken,
  tokenHash,
} from "../../apps/manager/src/lib/signed-links";

beforeAll(() => {
  process.env.SIGNING_SECRET = "unit-test-signing-secret-key-0123456789";
});

describe("signed links (claim + artifact)", () => {
  it("round-trips a valid claim token", () => {
    const t = mintSignedToken("claim_link", "+15705551234", 600);
    const p = verifySignedToken(t, "claim_link");
    expect(p?.subject).toBe("+15705551234");
  });

  it("rejects a token used for the wrong purpose", () => {
    const t = mintSignedToken("claim_link", "+15705551234", 600);
    expect(verifySignedToken(t, "artifact_link")).toBeNull();
  });

  it("rejects an expired token", () => {
    const t = mintSignedToken("artifact_link", "art_1", -1);
    expect(verifySignedToken(t, "artifact_link")).toBeNull();
  });

  it("rejects a tampered token", () => {
    const t = mintSignedToken("claim_link", "+15705551234", 600);
    expect(verifySignedToken(t + "x", "claim_link")).toBeNull();
  });

  it("stores a hash, never the raw token", () => {
    const t = mintSignedToken("artifact_link", "art_1", 600);
    const h = tokenHash(t);
    expect(h).not.toContain(t);
    expect(h).toHaveLength(64); // sha256 hex
  });
});
