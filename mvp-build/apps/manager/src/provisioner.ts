/**
 * Production-shaped host provisioner.
 *
 * This route may run in the same Node process for the MVP, but it is deliberately
 * modeled as a protected HTTP boundary so a VPS or tunnel-exposed local host
 * follows the same contract as production.
 */
import type { Hono } from "hono";
import type { ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import {
  failureResult,
  renderProfilePackage,
  runRuntimeStart,
  writeCaddySnippet,
} from "./lib/profile-renderer.js";
import { sendSms, setIncomingSmsWebhook } from "./lib/twilio.js";

function expectedToken(): string {
  const token = process.env.PROVISIONER_TOKEN;
  if (!token) throw new Error("PROVISIONER_TOKEN missing.");
  return token;
}

function authorized(header: string | undefined | null): boolean {
  return header === `Bearer ${expectedToken()}`;
}

function employeeNumber(): string {
  const number = process.env.TWILIO_EMPLOYEE_NUMBER ?? process.env.TWILIO_TEST_NUMBER;
  if (!number) throw new Error("TWILIO_EMPLOYEE_NUMBER or TWILIO_TEST_NUMBER missing.");
  return number;
}

export function registerProvisionerRoutes(app: Hono): void {
  app.get("/provision/health", (c) => c.json({ status: "ok" }));

  app.post("/provision", async (c) => {
    if (!authorized(c.req.header("Authorization"))) return c.json({ status: "failed", failure_state: "unauthorized" }, 401);
    const req = (await c.req.json()) as ProvisionerRequest;
    const logs: string[] = [];
    try {
      const rendered = await renderProfilePackage(req);
      logs.push(`rendered:${rendered.generated_path}`);

      const caddy = await writeCaddySnippet(req.params);
      logs.push(`caddy:${caddy}`);

      const smsNumber = employeeNumber();
      const webhook = await setIncomingSmsWebhook(smsNumber, req.params.webhook_url);
      logs.push(`twilio_webhook:${webhook.phone_number_sid}`);

      const runtime = await runRuntimeStart(rendered.generated_path);
      logs.push(`runtime:${runtime}`);

      const first = await sendSms({
        to: req.params.owner_phone_e164,
        from: smsNumber,
        body: "I'm live. Text me the job you just walked, an estimate you need, or the office work you want off your plate.",
      });
      logs.push(`first_sms:${first.sid}`);

      const result: ProvisionerResult = {
        status: "ok",
        profile_id: rendered.profile_id,
        generated_path: rendered.generated_path,
        workspace_dir: rendered.workspace_dir,
        sms_number_e164: smsNumber,
        twilio_webhook_url: req.params.webhook_url,
        webchat_api_url: `http://localhost:${req.params.gateway_port}`,
        public_web_route: `/agent/${req.employee_id}`,
        gateway_port: req.params.gateway_port,
        validation_status: "passed",
        validation_output: rendered.validation_output,
        smoke_output: runtime,
        first_sms_sid: first.sid,
        logs,
      };
      return c.json(result);
    } catch (err) {
      const result = failureResult("provisioner_failed", err);
      result.logs = [...logs, ...(result.logs ?? [])];
      return c.json(result, 500);
    }
  });
}
