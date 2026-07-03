import { describe, expect, it } from "vitest";
import { base64url, buildMimeMessage, encodeHeaderWord } from "../../apps/manager/src/lib/mime";

describe("mime builder", () => {
  it("builds a plain text message with required headers", () => {
    const msg = buildMimeMessage({ from: "me@shop.com", to: "jane@example.com", subject: "Your estimate", text: "Hi Jane" });
    expect(msg).toContain("From: me@shop.com");
    expect(msg).toContain("To: jane@example.com");
    expect(msg).toContain("Subject: Your estimate");
    expect(msg).toContain("MIME-Version: 1.0");
    expect(msg).toContain("Content-Transfer-Encoding: base64");
    // body is base64 of "Hi Jane"
    expect(msg).toContain(Buffer.from("Hi Jane", "utf8").toString("base64"));
  });

  it("builds multipart/mixed with a PDF attachment", () => {
    const pdf = Buffer.from("%PDF-1.4\n%%EOF").toString("base64");
    const msg = buildMimeMessage({
      from: "me@shop.com", to: "jane@example.com", subject: "Estimate", text: "See attached",
      attachments: [{ filename: "estimate.pdf", contentType: "application/pdf", contentBase64: pdf }],
    });
    expect(msg).toContain("multipart/mixed; boundary=");
    expect(msg).toContain('Content-Disposition: attachment; filename="estimate.pdf"');
    expect(msg).toContain(pdf);
    // boundary opens and closes
    const boundary = msg.match(/boundary="(amtech_[a-f0-9]+)"/)?.[1];
    expect(boundary).toBeTruthy();
    expect(msg).toContain(`--${boundary}--`);
  });

  it("RFC 2047 encodes non-ASCII subjects only", () => {
    expect(encodeHeaderWord("plain ascii")).toBe("plain ascii");
    expect(encodeHeaderWord("café")).toMatch(/^=\?UTF-8\?B\?.+\?=$/);
  });

  it("base64url has no +/= padding chars", () => {
    const enc = base64url("a??>>>bÿ");
    expect(enc).not.toMatch(/[+/=]/);
  });
});
