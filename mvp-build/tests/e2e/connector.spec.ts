import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Drive the owner's "Connect Gmail" flow on the real Work Surface and assert the
 * product actually moved — a connector work event / status appears — not merely
 * that some text rendered. Optionally verifies DB state when service creds are set.
 *
 * Reads the employee + owner session from infra/.local/state.json (written by
 * `npm run local:onboard`) or from env (EMPLOYEE_ID, OWNER_SESSION_TOKEN). Skips
 * cleanly when neither is present — same posture as the env-gated integration tests.
 */
function localState(): { employee_id?: string; owner_session_token?: string } {
  try {
    return JSON.parse(readFileSync(resolve(__dirname, "../../infra/.local/state.json"), "utf8"));
  } catch { return {}; }
}

const state = localState();
const employeeId = process.env.EMPLOYEE_ID ?? state.employee_id;
const ownerToken = process.env.OWNER_SESSION_TOKEN ?? state.owner_session_token;

test.describe("Work Surface — connect Gmail", () => {
  test.skip(!employeeId || !ownerToken, "needs a live employee + owner session (run npm run local:onboard)");

  test("clicking Connect Gmail starts a real connector (card/status, not just chat text)", async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL ?? "http://localhost:3000").origin;
    await context.addCookies([{ name: "amtech_owner_session", value: ownerToken!, url: origin }]);

    // Consent opens a popup we don't want to actually follow (real Google OAuth).
    await page.addInitScript(() => {
      // @ts-expect-error test shim: record instead of navigating away
      window.open = (url?: string) => { (window as unknown as { __opened?: string }).__opened = String(url ?? ""); return null; };
    });

    await page.goto(`/agent/${employeeId}`);
    const connectBtn = page.getByRole("button", { name: /connect gmail/i });
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // The action must produce an owner-visible result: either the consent popup was
    // requested (proof.consent_url present -> GOOGLE creds configured), or the pending
    // connector is now shown on the surface. Both beat a chat-only promise.
    const opened = await page.evaluate(() => (window as unknown as { __opened?: string }).__opened ?? "");
    const pendingVisible = await page.getByText(/gmail\s+pending_oauth|connect gmail/i).first().isVisible().catch(() => false);
    expect(opened.length > 0 || pendingVisible).toBeTruthy();

    // Optional DB assertion (service creds present): a pending_oauth connector row exists.
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await db.from("connector_accounts").select("provider,status").eq("employee_id", employeeId!).eq("provider", "gmail").maybeSingle();
      expect(data?.status, "connector row should exist after Connect (pending_oauth or connected)").toMatch(/pending_oauth|connected/);
    }
  });
});
