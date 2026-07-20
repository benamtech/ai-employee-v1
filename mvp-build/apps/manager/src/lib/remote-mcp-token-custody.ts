import { openSecret, sealSecret } from "./secrets.js";

export interface RemoteMcpOAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  resource?: string;
}

export interface SealedRemoteMcpTokenSet {
  access_token_secret_ref: string;
  refresh_token_secret_ref: string | null;
  token_type: "Bearer";
  scope: string[];
  resource: string;
  issued_at: string;
  expires_at: string | null;
}

/**
 * Converts a provider token response into opaque Manager-held secret references.
 * Employee profiles, Hermes environments, Web, MCP Apps, and AG-UI receive only
 * health/capability projections and never the token material.
 */
export function sealRemoteMcpTokenSet(input: {
  token: RemoteMcpOAuthTokenResponse;
  expected_resource: string;
  requested_scopes: readonly string[];
  now?: string;
}): SealedRemoteMcpTokenSet {
  const accessToken = String(input.token.access_token ?? "").trim();
  if (!accessToken || accessToken.length > 32_768) throw new Error("remote_mcp_access_token_invalid");
  const tokenType = String(input.token.token_type ?? "Bearer").toLowerCase();
  if (tokenType !== "bearer") throw new Error("remote_mcp_token_type_unsupported");
  const resource = String(input.token.resource ?? input.expected_resource);
  if (resource !== input.expected_resource) throw new Error("remote_mcp_token_resource_mismatch");
  const granted = new Set(String(input.token.scope ?? input.requested_scopes.join(" ")).split(/\s+/).filter(Boolean));
  if (input.requested_scopes.some((scope) => !granted.has(scope))) throw new Error("remote_mcp_token_scope_missing");
  const issuedAt = input.now ?? new Date().toISOString();
  const expiresIn = input.token.expires_in == null ? null : Number(input.token.expires_in);
  if (expiresIn != null && (!Number.isFinite(expiresIn) || expiresIn <= 0 || expiresIn > 366 * 24 * 60 * 60)) {
    throw new Error("remote_mcp_token_expiry_invalid");
  }
  const refresh = input.token.refresh_token?.trim() || null;
  if (refresh && refresh.length > 32_768) throw new Error("remote_mcp_refresh_token_invalid");
  return {
    access_token_secret_ref: sealSecret(accessToken),
    refresh_token_secret_ref: refresh ? sealSecret(refresh) : null,
    token_type: "Bearer",
    scope: [...granted].sort(),
    resource,
    issued_at: issuedAt,
    expires_at: expiresIn == null ? null : new Date(Date.parse(issuedAt) + expiresIn * 1000).toISOString(),
  };
}

/** Manager-internal adapter use only; never serialize the returned value. */
export function openRemoteMcpAccessToken(tokenSet: SealedRemoteMcpTokenSet, now = Date.now()): string {
  if (tokenSet.expires_at && Date.parse(tokenSet.expires_at) <= now) throw new Error("remote_mcp_access_token_expired");
  return openSecret(tokenSet.access_token_secret_ref);
}
