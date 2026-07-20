import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

function redactFixture(): Record<string, unknown> {
  const script = `
    import { redact } from './infra/scripts/acceptance/production-proof-lib.mjs';
    const digest = 'nousresearch/hermes-agent@sha256:' + 'a'.repeat(64);
    const body = redact({
      kind: 'hermes_exact_image_filesystem',
      status: 'passed',
      git_sha: 'b'.repeat(40),
      resolved_digest: digest,
      content_sha256: 'sha256:' + 'c'.repeat(64),
      access_token: 'tok_' + 'd'.repeat(64),
      password_hash: 'e'.repeat(64),
      arbitrary: 'f'.repeat(64)
    });
    process.stdout.write(JSON.stringify(body));
  `;
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  })) as Record<string, unknown>;
}

describe("production proof redaction", () => {
  it("keeps exact public metadata, hashes, and OCI digests while redacting credentials and arbitrary long values", () => {
    const result = redactFixture();
    expect(result.kind).toBe("hermes_exact_image_filesystem");
    expect(result.status).toBe("passed");
    expect(result.git_sha).toBe("b".repeat(40));
    expect(result.resolved_digest).toBe(`nousresearch/hermes-agent@sha256:${"a".repeat(64)}`);
    expect(result.content_sha256).toBe(`sha256:${"c".repeat(64)}`);
    expect(result.access_token).toBe("[REDACTED]");
    expect(result.password_hash).toBe("[REDACTED]");
    expect(result.arbitrary).toBe("[REDACTED]");
  });
});
