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
  writeAndActivateCaddySnippet,
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

function skipSmsProvisioning(): boolean {
  const skip = process.env.PROVISIONER_SKIP_SMS === "1" || process.env.PROVISIONER_SKIP_SMS === "true";
  if (skip && process.env.NODE_ENV === "production") {
    throw new Error("PROVISIONER_SKIP_SMS cannot be enabled in production.");
  }
  return skip;
}

export function smsPlan(req: ProvisionerRequest): {
  enabled: boolean;
  configure_webhook: boolean;
  send_first_message: boolean;
} {
  const sms = req.options?.sms;
  const enabled = sms?.enabled ?? true;
  return {
    enabled,
    configure_webhook: enabled && (sms?.configure_webhook ?? true),
    send_first_message: enabled && (sms?.send_first_message ?? true),
  };
}

export function runtimeApiBaseUrl(req: ProvisionerRequest): string {
  if (req.params.runtime_backend === "docker") {
    return `http://amtech-hermes-${req.employee_id}:${req.params.gateway_port}`;
  }
  return `http://localhost:${req.params.gateway_port}`;
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
      if (rendered.deployed_plugins.length) logs.push(`plugins:${rendered.deployed_plugins.join(",")}`);

      const caddy = await writeAndActivateCaddySnippet(req.params);
      logs.push(`caddy:${caddy}`);

      const skipSms = skipSmsProvisioning();
      const plan = skipSms ? { enabled: false, configure_webhook: false, send_first_message: false } : smsPlan(req);
      const smsNumber = plan.enabled ? employeeNumber() : null;
      if (smsNumber && plan.configure_webhook) {
        const webhook = await setIncomingSmsWebhook(smsNumber, req.params.webhook_url);
        logs.push(`twilio_webhook:${webhook.phone_number_sid}`);
      } else if (smsNumber) {
        logs.push("twilio_webhook:skipped");
      } else {
        logs.push("sms:skipped");
      }

      const runtime = await runRuntimeStart(rendered.generated_path);
      logs.push(`runtime:${runtime}`);

      const first = smsNumber && plan.send_first_message
        ? await sendSms({
          to: req.params.owner_phone_e164,
          from: smsNumber,
          body: "I'm live. Text me the job you just walked, an estimate you need, or the office work you want off your plate.",
        })
        : null;
      if (first) logs.push(`first_sms:${first.sid}`);
      else if (smsNumber) logs.push("first_sms:skipped");

      const result: ProvisionerResult = {
        status: "ok",
        profile_id: rendered.profile_id,
        generated_path: rendered.generated_path,
        workspace_dir: rendered.workspace_dir,
        sms_number_e164: smsNumber ?? undefined,
        twilio_webhook_url: smsNumber ? req.params.webhook_url : undefined,
        webchat_api_url: runtimeApiBaseUrl(req),
        api_base_url: runtimeApiBaseUrl(req),
        api_session_id: "amtech-owner-thread",
        public_web_route: `/agent/${req.employee_id}`,
        gateway_port: req.params.gateway_port,
        validation_status: "passed",
        validation_output: rendered.validation_output,
        smoke_output: runtime,
        first_sms_sid: first?.sid,
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
