/**
 * Gmail token custody (10-security-ops-observability.md: "Store OAuth tokens by
 * secret reference"). The connector row holds only `token_secret_ref` (an opaque
 * sealed bundle) + non-secret `token_expiry` metadata. This module is the ONLY
 * place that opens/refreshes/re-seals Gmail tokens. Never log token values.
 */
import type { SupabaseClient } from "@amtech/db";
import { sealSecret, openSecret } from "./secrets.js";
import { refreshAccessToken } from "./google-gmail.js";
import { mustWrite } from "./db.js";

export interface GmailTokenBundle {
  access_token: string;
  refresh_token: string;
  scope?: string;
}

export function sealTokenBundle(bundle: GmailTokenBundle): string {
  return sealSecret(JSON.stringify(bundle));
}

export function openTokenBundle(ref: string): GmailTokenBundle {
  return JSON.parse(openSecret(ref)) as GmailTokenBundle;
}

export function tokenExpiryIso(expiresIn?: number): string {
  return new Date(Date.now() + (expiresIn ?? 3600) * 1000).toISOString();
}

export interface ConnectorTokenRow {
  id: string;
  token_secret_ref: string | null;
  token_expiry: string | null;
}

const EXPIRY_SKEW_MS = 60 * 1000;

/**
 * Return a valid access token for a connector, refreshing + re-sealing + persisting
 * if the stored token is within the skew window of expiry. Throws `gmail_not_connected`
 * if no token is stored yet.
 */
export async function getFreshAccessToken(db: SupabaseClient, connector: ConnectorTokenRow): Promise<string> {
  if (!connector.token_secret_ref) throw new Error("gmail_not_connected");
  const bundle = openTokenBundle(connector.token_secret_ref);
  const expiry = connector.token_expiry ? new Date(connector.token_expiry).getTime() : 0;
  if (expiry - EXPIRY_SKEW_MS > Date.now()) return bundle.access_token;

  const refreshed = await refreshAccessToken(bundle.refresh_token);
  const next: GmailTokenBundle = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? bundle.refresh_token,
    scope: refreshed.scope ?? bundle.scope,
  };
  // mustWrite: Google rotates refresh tokens, so a swallowed persist error would
  // drop the new refresh_token and silently disconnect Gmail on the next refresh.
  // Throwing surfaces the failure at rotation time instead.
  await mustWrite(
    db
      .from("connector_accounts")
      .update({ token_secret_ref: sealTokenBundle(next), token_expiry: tokenExpiryIso(refreshed.expires_in) })
      .eq("id", connector.id),
    "connector_accounts.token_refresh",
  );
  return next.access_token;
}
