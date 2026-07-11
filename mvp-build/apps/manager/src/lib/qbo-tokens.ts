/**
 * QuickBooks Online token custody — the ONLY place that opens/refreshes/
 * re-seals QBO tokens. Mirrors gmail-tokens.ts. `intuit-oauth` (Intuit's own
 * maintained OAuth2 client) owns the actual refresh HTTP call; @apigrate/
 * quickbooks is never used for OAuth (see quickbooks-connector-implementation-
 * plan.md's Client Library Decision) so exactly one library ever owns
 * refresh-token rotation.
 *
 * QBO rotates the refresh token on every use — the old one is invalidated the
 * moment a new one is issued — so two concurrent refreshes of the SAME
 * connector must never race. The lock is a single atomic conditional UPDATE
 * on connector_accounts.token_refresh_lease_until (a real Postgres UPDATE
 * statement is row-atomic on its own; no separate lock table/RPC is needed
 * here, unlike employee_turn_locks, which had to coordinate a lock across
 * MANY job rows for one employee — this is one row, one lock).
 */
import OAuthClient from "intuit-oauth";
import type { SupabaseClient } from "@amtech/db";
import { sealSecret, openSecret } from "./secrets.js";
import { mustWrite } from "./db.js";

export type QboEnvironment = "sandbox" | "production";

export interface QboTokenBundle {
  access_token: string;
  refresh_token: string;
}

export function qboRedirectUri(): string {
  return process.env.QBO_OAUTH_REDIRECT_URI ??
    `${(process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "")}/webhooks/quickbooks/oauth/callback`;
}

export function qboOAuthClient(environment: QboEnvironment): OAuthClient {
  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("QBO_CLIENT_ID/QBO_CLIENT_SECRET missing.");
  return new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri: qboRedirectUri(),
  });
}

export function sealQboTokenBundle(bundle: QboTokenBundle): string {
  return sealSecret(JSON.stringify(bundle));
}

export function openQboTokenBundle(ref: string): QboTokenBundle {
  return JSON.parse(openSecret(ref)) as QboTokenBundle;
}

/** QBO access tokens live only 1 hour (vs. Google's longer-lived ones), so
 *  refresh proactively with a wider skew than Gmail's 60s. */
export function qboTokenExpiryIso(expiresIn?: number): string {
  return new Date(Date.now() + (expiresIn ?? 3600) * 1000).toISOString();
}

export interface QboConnectorTokenRow {
  id: string;
  token_secret_ref: string | null;
  token_expiry: string | null;
  realm_id: string | null;
  environment: string | null;
}

export interface FreshQboAccess {
  access_token: string;
  realm_id: string;
  environment: QboEnvironment;
}

const EXPIRY_SKEW_MS = 5 * 60 * 1000;
const REFRESH_LEASE_SECONDS = 30;
const CONTENDED_POLL_MS = 200;
const CONTENDED_POLL_ATTEMPTS = 5;

function envOf(row: QboConnectorTokenRow): QboEnvironment {
  return row.environment === "production" ? "production" : "sandbox";
}

/** Atomic compare-and-swap claim of the per-connector refresh lease. A single
 *  UPDATE ... WHERE ... is row-atomic in Postgres, so at most one caller ever
 *  wins each branch. Two branches (IS NULL, then <= now) emulate an OR without
 *  needing `.or()` support from the query builder. */
async function claimQboRefreshLease(db: SupabaseClient, connectorId: string): Promise<boolean> {
  const leaseUntil = new Date(Date.now() + REFRESH_LEASE_SECONDS * 1000).toISOString();
  const nowIso = new Date().toISOString();
  const first = await db
    .from("connector_accounts")
    .update({ token_refresh_lease_until: leaseUntil })
    .eq("id", connectorId)
    .is("token_refresh_lease_until", null)
    .select("id");
  if ((first.data as unknown[] | null)?.length) return true;
  const second = await db
    .from("connector_accounts")
    .update({ token_refresh_lease_until: leaseUntil })
    .eq("id", connectorId)
    .lte("token_refresh_lease_until", nowIso)
    .select("id");
  return Boolean((second.data as unknown[] | null)?.length);
}

async function releaseQboRefreshLease(db: SupabaseClient, connectorId: string): Promise<void> {
  try {
    await db.from("connector_accounts").update({ token_refresh_lease_until: null }).eq("id", connectorId);
  } catch {
    // best-effort: a stuck lease self-clears after REFRESH_LEASE_SECONDS anyway.
  }
}

/**
 * Return a valid access token for a QBO connector, refreshing + re-sealing +
 * persisting if the stored token is within the skew window of expiry. Throws
 * `quickbooks_not_connected` if no token/realm is stored yet.
 */
export async function getFreshQboAccessToken(db: SupabaseClient, connector: QboConnectorTokenRow): Promise<FreshQboAccess> {
  if (!connector.token_secret_ref || !connector.realm_id) throw new Error("quickbooks_not_connected");
  const environment = envOf(connector);
  const bundle = openQboTokenBundle(connector.token_secret_ref);
  const expiry = connector.token_expiry ? new Date(connector.token_expiry).getTime() : 0;
  if (expiry - EXPIRY_SKEW_MS > Date.now()) {
    return { access_token: bundle.access_token, realm_id: connector.realm_id, environment };
  }

  const claimed = await claimQboRefreshLease(db, connector.id);
  if (!claimed) {
    // Someone else is refreshing this connector right now. Poll briefly for
    // the fresh token they will persist rather than racing a second refresh
    // (QBO invalidates the prior refresh token the instant a new one issues).
    for (let attempt = 0; attempt < CONTENDED_POLL_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, CONTENDED_POLL_MS));
      const { data } = await db
        .from("connector_accounts")
        .select("token_secret_ref,token_expiry")
        .eq("id", connector.id)
        .maybeSingle();
      const row = data as { token_secret_ref: string | null; token_expiry: string | null } | null;
      if (row?.token_secret_ref && row.token_expiry && new Date(row.token_expiry).getTime() - EXPIRY_SKEW_MS > Date.now()) {
        return { access_token: openQboTokenBundle(row.token_secret_ref).access_token, realm_id: connector.realm_id, environment };
      }
    }
    throw new Error("quickbooks_token_refresh_contended");
  }

  try {
    const client = qboOAuthClient(environment);
    await client.refreshUsingToken(bundle.refresh_token);
    const token = client.getToken();
    const next: QboTokenBundle = {
      access_token: token.access_token,
      refresh_token: token.refresh_token || bundle.refresh_token,
    };
    // mustWrite: QBO rotates the refresh token on every use — a swallowed
    // persist error would drop the new refresh_token and silently disconnect
    // QuickBooks on the next refresh attempt.
    await mustWrite(
      db
        .from("connector_accounts")
        .update({
          token_secret_ref: sealQboTokenBundle(next),
          token_expiry: qboTokenExpiryIso(token.expires_in),
          token_refresh_lease_until: null,
        })
        .eq("id", connector.id),
      "connector_accounts.qbo_token_refresh",
    );
    return { access_token: next.access_token, realm_id: connector.realm_id, environment };
  } catch (err) {
    await releaseQboRefreshLease(db, connector.id);
    throw err;
  }
}
