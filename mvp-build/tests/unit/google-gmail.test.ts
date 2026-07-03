import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  exchangeCodeForTokens,
  getProfile,
  historyList,
  refreshAccessToken,
  sendMessage,
  watch,
} from "../../apps/manager/src/lib/google-gmail";

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

beforeAll(() => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("google-gmail client (stubbed fetch)", () => {
  it("exchanges an auth code for tokens", async () => {
    const f = mockFetchOnce(200, { access_token: "at", refresh_token: "rt", expires_in: 3600, scope: "s" });
    vi.stubGlobal("fetch", f);
    const tokens = await exchangeCodeForTokens("code123", "https://cb");
    expect(tokens.access_token).toBe("at");
    expect(tokens.refresh_token).toBe("rt");
    const call = f.mock.calls[0]!;
    expect(call[0]).toBe("https://oauth2.googleapis.com/token");
    expect(String((call[1] as RequestInit).body)).toContain("grant_type=authorization_code");
  });

  it("refreshes an access token", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { access_token: "new-at", expires_in: 3600 }));
    const tokens = await refreshAccessToken("rt");
    expect(tokens.access_token).toBe("new-at");
  });

  it("fetches the Gmail profile", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { emailAddress: "shop@gmail.com", historyId: "555" }));
    const profile = await getProfile("at");
    expect(profile.emailAddress).toBe("shop@gmail.com");
    expect(profile.historyId).toBe("555");
  });

  it("sends a message and returns ids", async () => {
    const f = mockFetchOnce(200, { id: "msg_1", threadId: "thr_1" });
    vi.stubGlobal("fetch", f);
    const res = await sendMessage("at", "cmVhbA");
    expect(res.id).toBe("msg_1");
    expect(res.threadId).toBe("thr_1");
    expect(String(f.mock.calls[0]![0])).toContain("/messages/send");
  });

  it("starts a watch", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { historyId: "600", expiration: "1700000000000" }));
    const res = await watch("at", "projects/p/topics/t");
    expect(res.historyId).toBe("600");
  });

  it("lists history", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { historyId: "601", history: [{ messagesAdded: [{ message: { id: "m1", threadId: "thr_1" } }] }] }));
    const res = await historyList("at", "600");
    expect(res.history?.[0]?.messagesAdded?.[0]?.message.id).toBe("m1");
  });

  it("throws a typed error with status on non-2xx", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(404, { error: { message: "history not found", status: "NOT_FOUND" } }));
    await expect(historyList("at", "1")).rejects.toMatchObject({ status: 404 });
  });
});
