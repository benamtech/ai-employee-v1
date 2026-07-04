/**
 * Real Hermes API Server contract proof.
 *
 * Skips unless HERMES_CONTRACT_BASE_URL and HERMES_CONTRACT_API_TOKEN are set.
 * This is proof scaffolding only; runtime-accepted status still requires recording
 * real proof ids in the implementation records.
 */
import { describe, expect, it } from "vitest";

const base = process.env.HERMES_CONTRACT_BASE_URL?.replace(/\/$/, "");
const token = process.env.HERMES_CONTRACT_API_TOKEN;
const hasHermes = Boolean(base && token);
const sessionId = process.env.HERMES_CONTRACT_SESSION_ID ?? `amtech-contract-${Date.now()}`;
const sessionKey = process.env.HERMES_CONTRACT_SESSION_KEY ?? `amtech:v1:contract:${Date.now()}`;

async function hermes(path: string, init: RequestInit = {}) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function hasFeature(capabilities: any, names: string[]): boolean {
  const features = capabilities?.features ?? {};
  const endpoints = capabilities?.endpoints ?? {};
  return names.some((name) => features[name] === true || Boolean(endpoints[name]) || Object.values(endpoints).some((v) => typeof v === "string" && v.includes(name)));
}

describe.skipIf(!hasHermes)("Hermes v0.18 API Server contract", () => {
  it("proves auth, capabilities, Sessions fallback, and Runs when advertised", async () => {
    const health = await hermes("/health");
    expect(health.ok).toBe(true);

    const capsRes = await hermes("/v1/capabilities");
    expect(capsRes.ok).toBe(true);
    const caps = await capsRes.json();
    expect(caps).toBeTruthy();

    if (hasFeature(caps, ["session_chat", "sessions", "chat"])) {
      const session = await hermes("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ id: sessionId, title: "AMTECH contract test" }),
      });
      expect([200, 201, 409]).toContain(session.status);
      const chat = await hermes(`/api/sessions/${encodeURIComponent(sessionId)}/chat`, {
        method: "POST",
        body: JSON.stringify({ input: "Reply with only: ok" }),
      });
      expect(chat.ok).toBe(true);
    }

    if (hasFeature(caps, ["runs", "/v1/runs"])) {
      const run = await hermes("/v1/runs", {
        method: "POST",
        headers: hasFeature(caps, ["session_key", "session_key_header", "X-Hermes-Session-Key"]) ? { "X-Hermes-Session-Key": sessionKey } : {},
        body: JSON.stringify({ input: "Reply with only: ok", session_id: sessionId }),
      });
      expect(run.ok).toBe(true);
      const json = await run.json();
      expect(json.run_id ?? json.id).toBeTruthy();
    }
  }, 120_000);
});
