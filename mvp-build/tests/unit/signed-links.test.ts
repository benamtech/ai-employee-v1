import { describe, it, expect, beforeAll } from "vitest";
import {
  decodeSignedToken,
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

  it("decodes an expired but validly signed token with an expired flag", () => {
    const t = mintSignedToken("artifact_link", "art_1", -1);
    const decoded = decodeSignedToken(t, "artifact_link");
    expect(decoded?.payload.subject).toBe("art_1");
    expect(decoded?.expired).toBe(true);
  });

  it("mints unique cryptographic jti values", () => {
    const first = decodeSignedToken(mintSignedToken("artifact_link", "art_1", 300), "artifact_link");
    const second = decodeSignedToken(mintSignedToken("artifact_link", "art_1", 300), "artifact_link");
    expect(first?.payload.jti).toMatch(/^[0-9a-f]{24}$/);
    expect(second?.payload.jti).toMatch(/^[0-9a-f]{24}$/);
    expect(first?.payload.jti).not.toBe(second?.payload.jti);
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
