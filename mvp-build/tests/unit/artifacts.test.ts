import { describe, expect, it } from "vitest";
import {
  artifactLinkTtlSeconds,
  artifactStoragePath,
  decodePdfBase64,
  sanitizeFilename,
} from "../../apps/manager/src/lib/artifacts";
import { renderArtifactHtml } from "../../apps/manager/src/lib/artifact-view";

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

  it("renders structured artifact payloads as escaped owner-safe HTML", () => {
    const html = renderArtifactHtml({
      id: "art_1",
      kind: "estimate",
      payload: {
        customer_name: "<script>alert(1)</script>",
        total_amount: 1200,
        line_items: [
          { description: "Walls <prep>", amount: 900 },
          { description: "Trim", amount: 300 },
        ],
      },
    });
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("<table>");
    expect(html).toContain("$1,200.00");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("does not render empty or non-object artifact payloads", () => {
    expect(renderArtifactHtml({ payload: {} })).toBeNull();
    expect(renderArtifactHtml({ payload: "plain text" })).toBeNull();
  });
});
