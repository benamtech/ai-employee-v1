/**
 * Audit writer. Every Manager tool and provider-connected action writes an
 * audit row (04-manager-tools.md "Every tool writes audit";
 * 03-data-model.md "Audit every provider-connected action"). Details must be
 * safe — never raw tokens, keys, or full email/webhook bodies.
 */
import { newId, ID_PREFIX } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";

export interface AuditInput {
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  actor: "front_door" | "employee" | "manager" | "owner" | "scheduler";
  action: string;
  resource?: string;
  result: "ok" | "failed" | "denied" | "needs_confirmation";
  details?: Record<string, unknown>;
}

const SENSITIVE_KEY = /(access|refresh|id)?_?token|secret|password|authorization|signature|raw_?body|email_?body|webhook_?body|payload|code/i;
const SENSITIVE_VALUE = /(sk_(test|live)_[A-Za-z0-9_]+|whsec_[A-Za-z0-9_]+|ya29\.[A-Za-z0-9._-]+|Bearer\s+[A-Za-z0-9._-]+)/g;

export function sanitizeAuditValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") return value.replace(SENSITIVE_VALUE, "[redacted]");
  if (Array.isArray(value)) return value.map((v, i) => sanitizeAuditValue(String(i), v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = sanitizeAuditValue(k, v);
    return out;
  }
  return value;
}

export function sanitizeAuditDetails(details: Record<string, unknown> | undefined): Record<string, unknown> {
  return sanitizeAuditValue("details", details ?? {}) as Record<string, unknown>;
}

export async function writeAudit(db: SupabaseClient, input: AuditInput): Promise<string> {
  const id = newId(ID_PREFIX.audit);
  const inserted = await db.from("audit_log").insert({
    id,
    account_id: input.account_id ?? null,
    employee_id: input.employee_id ?? null,
    assignment_id: input.assignment_id ?? null,
    actor: input.actor,
    action: input.action,
    resource: input.resource ?? null,
    result: input.result,
    details: sanitizeAuditDetails(input.details),
  });
  if (inserted.error) throw inserted.error;
  return id;
}
