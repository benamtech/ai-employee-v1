/**
 * QuickBooks Online API gotchas, encoded as validated business logic — NOT
 * documentation. Every rule here has a dedicated unit test (qbo-gotchas.test.ts)
 * so it's a real code path, not a comment. Source ledger:
 * mvp-build/docs/quickbooks-api-gotchas.md. Pure functions so they're directly
 * testable and reusable across write tools.
 *
 * Wired into Phase-A write tools now: PaymentType presence + single-department
 * expense limit. Encoded + tested now, wired when their tools land in Phase B:
 * sparse-update required-field merge, expense line-edit ref preservation,
 * SyncToken staleness translation, JournalEntry balance.
 */

export interface GotchaCheck {
  ok: boolean;
  reason?: string;
}

// --- Purchase (expense) PaymentType (Phase A, create_expense) -----------
export type QboPaymentType = "Cash" | "Check" | "CreditCard";
const VALID_PAYMENT_TYPES: QboPaymentType[] = ["Cash", "Check", "CreditCard"];

export function isValidPaymentType(pt: string): pt is QboPaymentType {
  return VALID_PAYMENT_TYPES.includes(pt as QboPaymentType);
}

// --- Single-department expense limit (Phase A, create_expense) ----------
// QBO expenses support only ONE department at the header level; a line-level
// department is rejected outright. A single vendor charge spanning multiple
// departments cannot be one expense — reject with the two real workarounds
// rather than silently collapsing to one department.
export function validateExpenseDepartments(departmentNames: string[]): GotchaCheck {
  const distinct = [...new Set(departmentNames.filter((d) => d && d.trim()))];
  if (distinct.length <= 1) return { ok: true };
  return {
    ok: false,
    reason:
      "QuickBooks expenses support only one department (location) at the header level, so a single vendor " +
      "charge cannot be split across departments on one expense. Two workarounds: (1) split bills — one " +
      "expense per department from the same vendor charge; (2) a reclassification journal entry after the fact.",
  };
}

// --- Sparse-update required fields (Phase B updates) --------------------
// QBO "sparse update" still silently REQUIRES certain fields per entity or it
// 400s. Merge the current entity's value in automatically before any sparse
// update — never leave it to the caller to remember.
export const REQUIRED_SPARSE_UPDATE_FIELDS: Record<string, string[]> = {
  JournalEntry: [],
  Bill: ["VendorRef"],
  Purchase: ["PaymentType"],
};

export function mergeSparseUpdateRequiredFields(
  entityType: string,
  updatePayload: Record<string, unknown>,
  currentEntity: Record<string, unknown>,
): Record<string, unknown> {
  const required = REQUIRED_SPARSE_UPDATE_FIELDS[entityType] ?? [];
  const merged = { ...updatePayload };
  for (const field of required) {
    if (merged[field] === undefined && currentEntity[field] !== undefined) {
      merged[field] = currentEntity[field];
    }
  }
  return merged;
}

// --- Expense line edit strips DepartmentRef/EntityRef (Phase B) ---------
// Known upstream bug: a full (non-sparse) expense line edit silently drops
// DepartmentRef (location) and EntityRef (vendor/payee) unless re-copied from
// the current entity. Always re-include both, even when unchanged.
export function preserveExpenseRefsOnLineEdit(
  updatePayload: Record<string, unknown>,
  currentEntity: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...updatePayload };
  for (const field of ["DepartmentRef", "EntityRef"]) {
    if (merged[field] === undefined && currentEntity[field] !== undefined) {
      merged[field] = currentEntity[field];
    }
  }
  return merged;
}

// --- SyncToken optimistic concurrency (Phase B updates) ----------------
// Every update requires the entity's current SyncToken; QBO rejects a stale
// one. Translate to an owner-safe message + re-fetch/retry once, rather than
// surfacing the raw fault.
export function isStaleSyncTokenError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "").toLowerCase();
  return msg.includes("5010") || msg.includes("stale") || msg.includes("synctoken");
}

export function syncTokenRetryMessage(): string {
  return "This was changed in QuickBooks since we last looked — refreshing and retrying.";
}

// --- JournalEntry debit/credit balance (Phase B, create_journal_entry) --
// Validate balance in integer cents BEFORE the API call so an unbalanced JE
// never reaches QBO as an opaque fault.
export interface JournalEntryLine {
  postingType: "Debit" | "Credit";
  amount_cents: number;
}

export function validateJournalEntryBalance(lines: JournalEntryLine[]): GotchaCheck {
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    if (line.postingType === "Debit") debit += Math.round(line.amount_cents);
    else credit += Math.round(line.amount_cents);
  }
  if (debit === credit) return { ok: true };
  return { ok: false, reason: `Journal entry does not balance: debits ${debit}c vs credits ${credit}c.` };
}
