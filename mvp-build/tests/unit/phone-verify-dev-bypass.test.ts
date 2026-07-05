import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { identityTools } from "../../apps/manager/src/tools/identity.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

/**
 * The local/dev phone-verify bypass lets the real front-door verify path run
 * without live Twilio + SMS, and MUST fail closed in production (mirrors
 * PROVISIONER_SKIP_SMS). No provider mock is used — the production path simply
 * has no Twilio creds and therefore errors, which is exactly the fail-closed proof.
 */

function ctx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), actor: "front_door" } as ToolContext;
}

const SEND = identityTools.send_phone_verification!;
const CHECK = identityTools.check_phone_code!;

const ENV_KEYS = ["NODE_ENV", "TWILIO_VERIFY_DEV_BYPASS", "TWILIO_VERIFY_DEV_CODE",
  "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"];
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("phone-verify dev bypass (local no-SMS real path)", () => {
  it("completes send -> check with the dev code, minting a verified phone", async () => {
    process.env.NODE_ENV = "test";
    process.env.TWILIO_VERIFY_DEV_BYPASS = "1";
    const db = makeFakeDb({ phone_verification_attempts: [], verified_phones: [] });

    const send = await SEND(ctx(db), { phone_e164: "+15705550123", session_id: "onb_1" });
    expect(send.status).toBe("ok");
    expect(send.proof.dev_bypass).toBe(true);
    const attemptId = send.proof.verification_attempt_id as string;

    const check = await CHECK(ctx(db), { verification_attempt_id: attemptId, code: "000000" });
    expect(check.status).toBe("ok");
    expect(String(check.proof.verified_phone_ref)).toMatch(/^phone_/);
    expect(check.proof.dev_bypass).toBe(true);
  });

  it("honors a custom dev code and rejects a wrong code", async () => {
    process.env.NODE_ENV = "test";
    process.env.TWILIO_VERIFY_DEV_BYPASS = "1";
    process.env.TWILIO_VERIFY_DEV_CODE = "424242";
    const db = makeFakeDb({ phone_verification_attempts: [], verified_phones: [] });

    const send = await SEND(ctx(db), { phone_e164: "+15705550123", session_id: "onb_1" });
    const attemptId = send.proof.verification_attempt_id as string;

    const wrong = await CHECK(ctx(db), { verification_attempt_id: attemptId, code: "000000" });
    expect(wrong.status).toBe("failed");

    const right = await CHECK(ctx(db), { verification_attempt_id: attemptId, code: "424242" });
    expect(right.status).toBe("ok");
  });

  it("fails closed in production even when the flag is set (no bypass, real Twilio only)", async () => {
    process.env.NODE_ENV = "production";
    process.env.TWILIO_VERIFY_DEV_BYPASS = "1";
    // No Twilio creds -> the real verify path errors; the bypass must NOT engage.
    const db = makeFakeDb({ phone_verification_attempts: [], verified_phones: [] });

    const send = await SEND(ctx(db), { phone_e164: "+15705550123", session_id: "onb_1" });
    expect(send.status).toBe("failed");
    expect(send.proof?.dev_bypass).toBeUndefined();

    // No attempt row was minted as a dev bypass.
    const { data: attempts } = await db.asClient().from("phone_verification_attempts").select("*");
    expect((attempts ?? []).some((a: any) => a.twilio_verify_sid === "dev-bypass")).toBe(false);
  });

  it("does not bypass when the flag is off (real Twilio path errors without creds)", async () => {
    process.env.NODE_ENV = "test";
    const db = makeFakeDb({ phone_verification_attempts: [], verified_phones: [] });
    const send = await SEND(ctx(db), { phone_e164: "+15705550123", session_id: "onb_1" });
    expect(send.status).toBe("failed");
    expect(send.proof?.dev_bypass).toBeUndefined();
  });
});
