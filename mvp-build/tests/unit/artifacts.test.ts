import { describe, expect, it } from "vitest";
import {
  artifactLinkTtlSeconds,
  artifactStoragePath,
  decodePdfBase64,
  sanitizeFilename,
} from "../../apps/manager/src/lib/artifacts";

describe("artifact helpers", () => {
  it("builds account-scoped storage paths", () => {
    expect(artifactStoragePath({
      account_id: "acct_1",
      employee_id: "emp_1",
      artifact_id: "art_1",
      filename: "Estimate 1042.pdf",
    })).toBe("accounts/acct_1/employees/emp_1/artifacts/art_1/estimate-1042.pdf");
  });

  it("sanitizes and forces pdf filenames", () => {
    expect(sanitizeFilename("Jane Estimate")).toBe("jane-estimate.pdf");
    expect(sanitizeFilename("ok.PDF")).toBe("ok.pdf");
  });

  it("accepts real-looking PDF bytes and rejects non-PDF data", () => {
    const pdf = Buffer.from("%PDF-1.4\n%%EOF");
    expect(decodePdfBase64(pdf.toString("base64")).toString("utf8")).toContain("%PDF");
    expect(() => decodePdfBase64(Buffer.from("not a pdf").toString("base64"))).toThrow("pdf_header_invalid");
  });

  it("bounds artifact link ttl", () => {
    expect(artifactLinkTtlSeconds(1)).toBe(60);
    expect(artifactLinkTtlSeconds(90)).toBe(90);
    expect(artifactLinkTtlSeconds(60 * 60 * 24 * 60)).toBe(60 * 60 * 24 * 30);
  });
});
