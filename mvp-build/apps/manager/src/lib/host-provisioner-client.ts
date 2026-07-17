import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import type { ProvisionerRequest, ProvisionerResult } from "@amtech/shared";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function socketPath(): string {
  return process.env.PROVISIONER_SOCKET_PATH ?? "/run/amtech-provisioner/provisioner.sock";
}

export function signedProvisionerEnvelope(req: ProvisionerRequest): ProvisionerRequest {
  const issued = new Date();
  const expires = new Date(issued.getTime() + 30_000);
  return {
    ...req,
    request_id: req.request_id ?? randomUUID(),
    operation: req.operation ?? "ensure_runtime",
    issued_at: issued.toISOString(),
    expires_at: expires.toISOString(),
    nonce: randomBytes(24).toString("base64url"),
    idempotency_key: req.idempotency_key ?? `runtime:${req.employee_id}:${req.manifest_id}`,
  };
}

export async function callHostProvisioner(input: ProvisionerRequest): Promise<{ status: number; body: ProvisionerResult }> {
  const envelope = signedProvisionerEnvelope(input);
  const raw = Buffer.from(JSON.stringify(envelope));
  const signature = createHmac("sha256", requiredEnv("PROVISIONER_SIGNING_SECRET")).update(raw).digest("hex");

  return await new Promise((resolve, reject) => {
    const req = httpRequest({
      socketPath: socketPath(),
      path: "/v1/runtime",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(raw.length),
        "x-amtech-signature": `sha256=${signature}`,
      },
      timeout: Number(process.env.PROVISIONER_REQUEST_TIMEOUT_MS ?? 120_000),
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body: ProvisionerResult;
        try {
          body = JSON.parse(text || "{}") as ProvisionerResult;
        } catch {
          body = { status: "failed", failure_state: "host_provisioner_invalid_json", logs: [text.slice(0, 500)] };
        }
        resolve({ status: res.statusCode ?? 500, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("host_provisioner_timeout")));
    req.on("error", reject);
    req.end(raw);
  });
}

export async function requireHostProvisioner(input: ProvisionerRequest): Promise<ProvisionerResult> {
  const result = await callHostProvisioner(input);
  if (result.status >= 400 || result.body.status !== "ok") {
    const err = new Error(result.body.failure_state ?? `host_provisioner_${result.status}`);
    Object.assign(err, { provisioner_result: result.body, http_status: result.status });
    throw err;
  }
  return result.body;
}

export function hostProvisionerSocketPath(): string {
  return socketPath();
}
