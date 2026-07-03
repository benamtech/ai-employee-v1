/**
 * Fetch-based Google OAuth + Gmail REST client (08-connectors-email-v1.md,
 * 09-event-mesh-v1.md). No SDK — matches lib/twilio.ts / lib/runtime.ts style.
 * Pure I/O wrappers around the official endpoints; tests stub globalThis.fetch.
 *
 * Never logs tokens. Callers store tokens by secret reference (lib/gmail-tokens.ts).
 */

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

export interface GmailSendResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

export interface GmailWatchResult {
  historyId: string;
  expiration: string; // epoch ms as string
}

export interface GmailHistoryResult {
  history?: Array<{
    id?: string;
    messages?: Array<{ id: string; threadId: string }>;
    messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds?: string[] } }>;
  }>;
  historyId?: string;
  nextPageToken?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
}

function clientId(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_OAUTH_CLIENT_ID missing.");
  return v;
}

function clientSecret(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET missing.");
  return v;
}

async function asJson(res: Response, what: string): Promise<any> {
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const detail = json?.error?.message ?? json?.error_description ?? json?.error ?? `status_${res.status}`;
    const err = new Error(`google_${what}_failed: ${detail}`) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = typeof json?.error === "string" ? json.error : json?.error?.status;
    throw err;
  }
  return json;
}

/** Exchange an authorization code for tokens (OAuth callback). */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  return asJson(res, "token_exchange");
}

/** Refresh an access token using a stored refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }).toString(),
  });
  return asJson(res, "token_refresh");
}

function authHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getProfile(accessToken: string): Promise<GmailProfile> {
  const res = await fetch(`${GMAIL_BASE}/profile`, { headers: authHeaders(accessToken) });
  return asJson(res, "profile");
}

/** Send a pre-built RFC 2822 message that has already been base64url-encoded. */
export async function sendMessage(accessToken: string, rawBase64url: string, threadId?: string): Promise<GmailSendResult> {
  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(threadId ? { raw: rawBase64url, threadId } : { raw: rawBase64url }),
  });
  return asJson(res, "send");
}

export async function watch(accessToken: string, topicName: string): Promise<GmailWatchResult> {
  const res = await fetch(`${GMAIL_BASE}/watch`, {
    method: "POST",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ topicName, labelIds: ["INBOX"] }),
  });
  return asJson(res, "watch");
}

export async function stopWatch(accessToken: string): Promise<void> {
  const res = await fetch(`${GMAIL_BASE}/stop`, { method: "POST", headers: authHeaders(accessToken) });
  if (!res.ok && res.status !== 204) await asJson(res, "stop");
}

export async function historyList(accessToken: string, startHistoryId: string, pageToken?: string): Promise<GmailHistoryResult> {
  const params = new URLSearchParams({ startHistoryId, historyTypes: "messageAdded" });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`${GMAIL_BASE}/history?${params.toString()}`, { headers: authHeaders(accessToken) });
  return asJson(res, "history_list");
}

export async function getMessage(accessToken: string, id: string, format: "minimal" | "metadata" | "full" = "metadata"): Promise<GmailMessage> {
  const params = new URLSearchParams({ format });
  if (format === "metadata") {
    params.append("metadataHeaders", "From");
    params.append("metadataHeaders", "Subject");
    params.append("metadataHeaders", "Message-Id");
  }
  const res = await fetch(`${GMAIL_BASE}/messages/${id}?${params.toString()}`, { headers: authHeaders(accessToken) });
  return asJson(res, "get_message");
}
