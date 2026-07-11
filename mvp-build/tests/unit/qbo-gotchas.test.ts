/**
 * QuickBooks API gotchas — each ledger rule (quickbooks-api-gotchas.md) is a
 * dedicated test, not a comment. Wired into Phase A: PaymentType + single
 * department. Encoded for Phase B tools: sparse-update merge, ref preservation,
 * SyncToken staleness, JE balance.
 */
import { describe, expect, it } from "vitest";
import {
  isValidPaymentType,
  validateExpenseDepartments,
  REQUIRED_SPARSE_UPDATE_FIELDS,
  mergeSparseUpdateRequiredFields,
  preserveExpenseRefsOnLineEdit,
  isStaleSyncTokenError,
  syncTokenRetryMessage,
  validateJournalEntryBalance,
} from "../../apps/manager/src/lib/qbo-gotchas";

describe("qbo-gotchas: PaymentType (Purchase)", () => {
  it("accepts the three valid QBO payment types", () => {
    expect(isValidPaymentType("Cash")).toBe(true);
    expect(isValidPaymentType("Check")).toBe(true);
    expect(isValidPaymentType("CreditCard")).toBe(true);
  });
  it("rejects anything else (an expense with a bad/missing PaymentType 400s in QBO)", () => {
    expect(isValidPaymentType("Venmo")).toBe(false);
    expect(isValidPaymentType("")).toBe(false);
    expect(isValidPaymentType("cash")).toBe(false);
  });
});

describe("qbo-gotchas: single-department expense limit", () => {
  it("allows zero or one department", () => {
    expect(validateExpenseDepartments([]).ok).toBe(true);
    expect(validateExpenseDepartments(["East"]).ok).toBe(true);
    expect(validateExpenseDepartments(["East", "East"]).ok).toBe(true); // dedupes
    expect(validateExpenseDepartments(["East", "  ", ""]).ok).toBe(true);
  });
  it("rejects a multi-department expense with the two real workarounds explained", () => {
    const res = validateExpenseDepartments(["East", "West"]);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/split bills/i);
    expect(res.reason).toMatch(/journal entry/i);
  });
});

describe("qbo-gotchas: sparse-update required fields (Phase B)", () => {
  it("declares the per-entity required set", () => {
    expect(REQUIRED_SPARSE_UPDATE_FIELDS.Bill).toEqual(["VendorRef"]);
    expect(REQUIRED_SPARSE_UPDATE_FIELDS.Purchase).toEqual(["PaymentType"]);
    expect(REQUIRED_SPARSE_UPDATE_FIELDS.JournalEntry).toEqual([]);
  });
  it("merges the required field from the current entity when the caller omits it", () => {
    const merged = mergeSparseUpdateRequiredFields("Bill", { PrivateNote: "x" }, { VendorRef: { value: "9" } });
    expect(merged.VendorRef).toEqual({ value: "9" });
  });
  it("does not overwrite a required field the caller supplied", () => {
    const merged = mergeSparseUpdateRequiredFields("Purchase", { PaymentType: "Check" }, { PaymentType: "Cash" });
    expect(merged.PaymentType).toBe("Check");
  });
});

describe("qbo-gotchas: expense line-edit strips DepartmentRef/EntityRef (Phase B)", () => {
  it("re-includes both refs from the current entity when a line edit omits them", () => {
    const merged = preserveExpenseRefsOnLineEdit({ Line: [] }, { DepartmentRef: { value: "3" }, EntityRef: { value: "7", type: "Vendor" } });
    expect(merged.DepartmentRef).toEqual({ value: "3" });
    expect(merged.EntityRef).toEqual({ value: "7", type: "Vendor" });
  });
});

describe("qbo-gotchas: SyncToken optimistic concurrency (Phase B)", () => {
  it("recognizes a stale-token fault from several signals", () => {
    expect(isStaleSyncTokenError({ message: "Error code 5010: stale object" })).toBe(true);
    expect(isStaleSyncTokenError(new Error("The SyncToken provided is invalid"))).toBe(true);
    expect(isStaleSyncTokenError(new Error("some other error"))).toBe(false);
  });
  it("has an owner-safe retry message (never the raw fault)", () => {
    expect(syncTokenRetryMessage()).toMatch(/changed in QuickBooks/i);
  });
});

describe("qbo-gotchas: JournalEntry balance (Phase B)", () => {
  it("accepts a balanced entry in integer cents", () => {
    expect(validateJournalEntryBalance([
      { postingType: "Debit", amount_cents: 10000 },
      { postingType: "Credit", amount_cents: 10000 },
    ]).ok).toBe(true);
  });
  it("rejects an unbalanced entry before it reaches the API", () => {
    const res = validateJournalEntryBalance([
      { postingType: "Debit", amount_cents: 10000 },
      { postingType: "Credit", amount_cents: 9999 },
    ]);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/does not balance/i);
  });
});
