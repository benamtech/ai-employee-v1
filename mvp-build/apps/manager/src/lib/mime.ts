/**
 * Minimal RFC 2822 / MIME builder for Gmail sends (08-connectors-email-v1.md).
 * Pure + dependency-free so it is fully unit-testable. The Gmail API wants the
 * whole RFC 2822 message base64url-encoded into the `raw` field of
 * users.messages.send, so `buildMimeMessage` returns the raw message string and
 * `base64url` does the final encoding.
 */
import { randomBytes } from "node:crypto";

export function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

/** RFC 2047 encode a header value when it contains non-ASCII characters. */
export function encodeHeaderWord(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Wrap base64 payloads at 76 chars per RFC 2045. */
function wrap76(b64: string): string {
  return b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

export interface MimeAttachment {
  filename: string;
  contentType: string;
  /** Standard base64 of the binary content. */
  contentBase64: string;
}

export interface MimeMessageInput {
  from: string;
  to: string;
  subject: string;
  /** Plain-text body (UTF-8). */
  text: string;
  attachments?: MimeAttachment[];
  inReplyTo?: string;
  references?: string;
}

/** Build an RFC 2822 message string (multipart/mixed when attachments exist). */
export function buildMimeMessage(input: MimeMessageInput): string {
  const headers: string[] = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderWord(input.subject)}`,
    "MIME-Version: 1.0",
  ];
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);

  const bodyPart = [
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(input.text, "utf8").toString("base64")),
  ].join("\r\n");

  if (!input.attachments?.length) {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push("Content-Transfer-Encoding: base64");
    return `${headers.join("\r\n")}\r\n\r\n${wrap76(Buffer.from(input.text, "utf8").toString("base64"))}`;
  }

  const boundary = `amtech_${randomBytes(12).toString("hex")}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  const segments: string[] = [];
  segments.push(`--${boundary}`);
  segments.push(bodyPart);
  for (const att of input.attachments) {
    segments.push(`--${boundary}`);
    segments.push(
      [
        `Content-Type: ${att.contentType}; name="${att.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${att.filename}"`,
        "",
        wrap76(att.contentBase64),
      ].join("\r\n"),
    );
  }
  segments.push(`--${boundary}--`);

  return `${headers.join("\r\n")}\r\n\r\n${segments.join("\r\n")}`;
}
