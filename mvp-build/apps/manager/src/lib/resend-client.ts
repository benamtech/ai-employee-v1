export interface ResendSendInput {
  from: string;
  to: string;
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  idempotency_key: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface ResendSendResult {
  ok: boolean;
  provider_message_id?: string | null;
  provider_status?: number;
  error_code?: string;
  error_message?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_missing`);
  return value;
}

function fromDomain(from: string): string | null {
  const match = from.match(/<[^@<>]+@([^<>]+)>/) ?? from.match(/^[^@<>\s]+@([^<>\s]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
}

export function assertResendPublicEstimatorEnv(): { ok: true } | { ok: false; reason: string } {
  if (process.env.PUBLIC_ESTIMATOR_EMAIL_ENABLED !== "1") return { ok: false, reason: "email_disabled" };
  const required = ["RESEND_API_KEY", "PUBLIC_ESTIMATOR_FROM_EMAIL", "PUBLIC_ESTIMATOR_REPLY_TO", "PUBLIC_ESTIMATOR_SENDING_DOMAIN"];
  for (const name of required) if (!process.env[name]) return { ok: false, reason: `${name.toLowerCase()}_missing` };
  const domain = fromDomain(String(process.env.PUBLIC_ESTIMATOR_FROM_EMAIL));
  if (domain !== String(process.env.PUBLIC_ESTIMATOR_SENDING_DOMAIN).toLowerCase()) return { ok: false, reason: "sending_domain_mismatch" };
  return { ok: true };
}

function providerError(json: Record<string, unknown>, fallback: string): { code: string; message: string } {
  const nested = json.error && typeof json.error === "object" ? json.error as Record<string, unknown> : {};
  const name = String(json.name ?? nested.name ?? nested.type ?? json.type ?? fallback);
  const message = String(json.message ?? nested.message ?? (typeof json.error === "string" ? json.error : fallback));
  return { code: name.slice(0, 80), message: message.slice(0, 500) };
}

export async function sendResendEmail(input: ResendSendInput): Promise<ResendSendResult> {
  const env = assertResendPublicEstimatorEnv();
  if (!env.ok) return { ok: false, error_code: env.reason, error_message: "Email is not configured." };
  const apiKey = requiredEnv("RESEND_API_KEY");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "amtech-public-estimator/1.0",
        "Idempotency-Key": input.idempotency_key.slice(0, 256),
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.reply_to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = providerError(json, res.status === 429 ? "rate_limited" : `resend_${res.status}`);
      return {
        ok: false,
        provider_status: res.status,
        error_code: err.code,
        error_message: err.message,
      };
    }
    return {
      ok: true,
      provider_status: res.status,
      provider_message_id: String(json.id ?? json.message_id ?? "") || null,
    };
  } catch {
    return {
      ok: false,
      error_code: "resend_unreachable",
      error_message: "Email provider is unreachable.",
    };
  }
}
