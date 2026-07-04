import type { SupabaseClient } from "@amtech/db";
import { orThrow } from "./db.js";

let warnedDevFallback = false;

export async function resolveEmployeeSmsSender(db: SupabaseClient, employeeId: string): Promise<string> {
  const row = orThrow(
    await db.from("runtime_endpoints").select("sms_number_e164").eq("employee_id", employeeId).maybeSingle(),
    "runtime_endpoints.sms_sender",
  ) as { sms_number_e164?: string | null } | null;
  const sender = row?.sms_number_e164;
  if (sender) return sender;
  if (process.env.NODE_ENV !== "production" && process.env.TWILIO_TEST_NUMBER) {
    if (!warnedDevFallback) {
      warnedDevFallback = true;
      // eslint-disable-next-line no-console
      console.warn("[manager] using TWILIO_TEST_NUMBER as employee sender fallback (dev only).");
    }
    return process.env.TWILIO_TEST_NUMBER;
  }
  throw new Error("employee_sender_missing");
}
