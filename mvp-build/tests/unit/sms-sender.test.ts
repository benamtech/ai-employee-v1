import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEmployeeSmsSender } from "../../apps/manager/src/lib/sms-sender";
import { makeFakeDb } from "./_helpers/fake-supabase";

const origEnv = { ...process.env };
beforeEach(() => { delete process.env.TWILIO_TEST_NUMBER; process.env.NODE_ENV = "test"; });
afterEach(() => { process.env = { ...origEnv }; vi.restoreAllMocks(); });

describe("sms-sender resolveEmployeeSmsSender", () => {
  it("returns the employee's dedicated number", async () => {
    const db = makeFakeDb({ runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", sms_number_e164: "+15559990000" }] });
    expect(await resolveEmployeeSmsSender(db.asClient(), "emp_1")).toBe("+15559990000");
  });

  it("uses TWILIO_TEST_NUMBER as a dev-only fallback", async () => {
    process.env.NODE_ENV = "test";
    process.env.TWILIO_TEST_NUMBER = "+15551234567";
    const db = makeFakeDb({ runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1" }] });
    expect(await resolveEmployeeSmsSender(db.asClient(), "emp_1")).toBe("+15551234567");
  });

  it("fails closed in production with no dedicated number", async () => {
    process.env.NODE_ENV = "production";
    process.env.TWILIO_TEST_NUMBER = "+15551234567"; // ignored in production
    const db = makeFakeDb({ runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1" }] });
    await expect(resolveEmployeeSmsSender(db.asClient(), "emp_1")).rejects.toThrow("employee_sender_missing");
  });
});
