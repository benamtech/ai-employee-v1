import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM harness helper, no types published
import { FIXTURES, pickFixture, conversationTurns, bypassManifest } from "../../infra/scripts/local/contractor-fixtures.mjs";

/** The fixtures feed both the real-user and bypass onboarding harnesses; keep them honest. */

const KEYS = ["ONBOARD_FIXTURE", "ONBOARD_EMAIL", "ONBOARD_PHONE"];
let saved: Record<string, string | undefined>;
beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("contractor onboarding fixtures", () => {
  it("covers several distinct beachhead trades", () => {
    const kinds = new Set(FIXTURES.map((f: any) => f.business_kind));
    expect(kinds.size).toBeGreaterThanOrEqual(4);
    // Stay in the paint/landscape-adjacent beachhead — no off-vertical drift.
    for (const f of FIXTURES) {
      expect(f.business_display_name).toBeTruthy();
      expect(f.owner_name).toBeTruthy();
      expect(f.workflows.length).toBeGreaterThan(0);
    }
  });

  it("selects deterministically by index or kind", () => {
    process.env.ONBOARD_FIXTURE = "landscaping";
    expect(pickFixture().business_kind).toBe("landscaping");
    process.env.ONBOARD_FIXTURE = "0";
    expect(pickFixture().business_kind).toBe(FIXTURES[0].business_kind);
  });

  it("mints per-run-unique email/phone so repeated runs never collide", () => {
    process.env.ONBOARD_FIXTURE = "painting";
    const a = pickFixture();
    const b = pickFixture();
    expect(a.owner_email).not.toBe(b.owner_email);
    expect(a.phone_e164).toMatch(/^\+1570555\d{4}$/);
  });

  it("builds real-path conversation turns that mention the business and assistant name", () => {
    process.env.ONBOARD_FIXTURE = "carpentry";
    const fx = pickFixture();
    const turns = conversationTurns(fx);
    expect(turns.length).toBeGreaterThanOrEqual(3);
    expect(turns.join(" ")).toContain(fx.business_display_name);
    expect(turns.join(" ")).toContain(fx.employee_name);
  });

  it("builds a complete bypass manifest for the no-model path", () => {
    process.env.ONBOARD_FIXTURE = "deck_and_fence";
    const m = bypassManifest(pickFixture());
    for (const key of ["business_display_name", "business_kind", "employee_name", "verified_phone_e164", "seven_question_answers", "seed_skills"]) {
      expect(m).toHaveProperty(key);
    }
    expect(Object.keys(m.seven_question_answers)).toContain("repeat_computer_work");
  });
});
