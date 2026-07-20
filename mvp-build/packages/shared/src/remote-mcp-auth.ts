export interface RemoteMcpProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}

export interface RemoteMcpAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  code_challenge_methods_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
  scopes_supported?: string[];
  registration_endpoint?: string;
  client_id_metadata_document_supported?: boolean;
}

export interface RemoteMcpAuthorizationPolicy {
  resource_url: string;
  redirect_uri: string;
  allowed_redirect_uris: string[];
  requested_scopes: string[];
  client_id: string;
}

export interface RemoteMcpAuthorizationBinding {
  profile: "mcp-oauth-2025-11-25";
  resource: string;
  authorization_server: string;
  authorization_endpoint: string;
  token_endpoint: string;
  redirect_uri: string;
  client_id: string;
  scopes: string[];
  state: string;
  code_challenge: string;
  code_challenge_method: "S256";
}

export interface RemoteMcpMetadataDecision {
  ok: boolean;
  reason?: string;
  binding?: Omit<RemoteMcpAuthorizationBinding, "state" | "code_challenge" | "code_challenge_method">;
}

function exactHttpsUrl(value: string, code: string): URL {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${code}_invalid_url`); }
  if (parsed.protocol !== "https:") throw new Error(`${code}_https_required`);
  if (parsed.username || parsed.password || parsed.hash) throw new Error(`${code}_unsafe_url`);
  return parsed;
}

function normalizeExactUrl(value: string, code: string): string {
  const parsed = exactHttpsUrl(value, code);
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function equalStringSets(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

export function protectedResourceMetadataCandidates(resourceUrl: string): string[] {
  const resource = exactHttpsUrl(resourceUrl, "remote_mcp_resource");
  const path = resource.pathname === "/" ? "" : resource.pathname.replace(/\/$/, "");
  const root = new URL("/.well-known/oauth-protected-resource", resource.origin).toString();
  const pathSpecific = path
    ? new URL(`/.well-known/oauth-protected-resource${path}`, resource.origin).toString()
    : root;
  return [...new Set([pathSpecific, root])];
}

export function authorizationServerMetadataCandidates(issuerUrl: string): string[] {
  const issuer = exactHttpsUrl(issuerUrl, "remote_mcp_issuer");
  const path = issuer.pathname === "/" ? "" : issuer.pathname.replace(/\/$/, "");
  return [
    new URL(`/.well-known/oauth-authorization-server${path}`, issuer.origin).toString(),
    new URL(`/.well-known/openid-configuration${path}`, issuer.origin).toString(),
  ];
}

/**
 * Validate discovery as Manager-owned policy. The caller cannot nominate an
 * authorization server, audience, redirect, or scope outside discovered metadata.
 */
export function validateRemoteMcpAuthorizationMetadata(input: {
  policy: RemoteMcpAuthorizationPolicy;
  protected_resource: RemoteMcpProtectedResourceMetadata;
  authorization_server: RemoteMcpAuthorizationServerMetadata;
}): RemoteMcpMetadataDecision {
  try {
    const resource = normalizeExactUrl(input.policy.resource_url, "remote_mcp_resource");
    const advertisedResource = normalizeExactUrl(input.protected_resource.resource, "remote_mcp_metadata_resource");
    if (resource !== advertisedResource) return { ok: false, reason: "resource_audience_mismatch" };

    const allowedRedirects = input.policy.allowed_redirect_uris.map((value) => normalizeExactUrl(value, "remote_mcp_redirect"));
    const redirect = normalizeExactUrl(input.policy.redirect_uri, "remote_mcp_redirect");
    if (!allowedRedirects.includes(redirect)) return { ok: false, reason: "redirect_uri_not_allowlisted" };

    const discoveredServers = input.protected_resource.authorization_servers
      .map((value) => normalizeExactUrl(value, "remote_mcp_authorization_server"));
    if (!discoveredServers.length) return { ok: false, reason: "authorization_server_missing" };

    const issuer = normalizeExactUrl(input.authorization_server.issuer, "remote_mcp_issuer");
    if (!discoveredServers.includes(issuer)) return { ok: false, reason: "authorization_server_not_discovered" };

    const authorizationEndpoint = normalizeExactUrl(input.authorization_server.authorization_endpoint, "remote_mcp_authorization_endpoint");
    const tokenEndpoint = normalizeExactUrl(input.authorization_server.token_endpoint, "remote_mcp_token_endpoint");
    const methods = input.authorization_server.code_challenge_methods_supported ?? [];
    if (!methods.includes("S256")) return { ok: false, reason: "pkce_s256_not_supported" };
    const responseTypes = input.authorization_server.response_types_supported ?? [];
    if (responseTypes.length && !responseTypes.includes("code")) return { ok: false, reason: "authorization_code_not_supported" };
    const grants = input.authorization_server.grant_types_supported ?? ["authorization_code"];
    if (!grants.includes("authorization_code")) return { ok: false, reason: "authorization_code_grant_not_supported" };

    const resourceScopes = new Set(input.protected_resource.scopes_supported ?? input.authorization_server.scopes_supported ?? []);
    if (resourceScopes.size && input.policy.requested_scopes.some((scope) => !resourceScopes.has(scope))) {
      return { ok: false, reason: "requested_scope_not_supported" };
    }
    const scopes = [...new Set(input.policy.requested_scopes)].sort();
    if (!equalStringSets(scopes, [...new Set(input.policy.requested_scopes)].sort())) {
      return { ok: false, reason: "scope_normalization_failed" };
    }

    return {
      ok: true,
      binding: {
        profile: "mcp-oauth-2025-11-25",
        resource,
        authorization_server: issuer,
        authorization_endpoint: authorizationEndpoint,
        token_endpoint: tokenEndpoint,
        redirect_uri: redirect,
        client_id: input.policy.client_id,
        scopes,
      },
    };
  } catch (error) {
    return { ok: false, reason: String((error as Error).message ?? error) };
  }
}

export function buildRemoteMcpAuthorizationUrl(input: {
  binding: Omit<RemoteMcpAuthorizationBinding, "state" | "code_challenge" | "code_challenge_method">;
  state: string;
  code_challenge: string;
}): { url: string; binding: RemoteMcpAuthorizationBinding } {
  if (!/^[A-Za-z0-9._~-]{32,256}$/.test(input.state)) throw new Error("remote_mcp_state_invalid");
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(input.code_challenge)) throw new Error("remote_mcp_code_challenge_invalid");
  const binding: RemoteMcpAuthorizationBinding = {
    ...input.binding,
    state: input.state,
    code_challenge: input.code_challenge,
    code_challenge_method: "S256",
  };
  const url = new URL(binding.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", binding.client_id);
  url.searchParams.set("redirect_uri", binding.redirect_uri);
  url.searchParams.set("resource", binding.resource);
  url.searchParams.set("state", binding.state);
  url.searchParams.set("code_challenge", binding.code_challenge);
  url.searchParams.set("code_challenge_method", binding.code_challenge_method);
  if (binding.scopes.length) url.searchParams.set("scope", binding.scopes.join(" "));
  return { url: url.toString(), binding };
}

export function validateRemoteMcpAuthorizationCallback(input: {
  expected_state: string;
  received_state?: string | null;
  code?: string | null;
  error?: string | null;
}): { ok: boolean; reason?: string; code?: string } {
  if (input.error) return { ok: false, reason: `authorization_error:${input.error}` };
  if (!input.received_state || input.received_state !== input.expected_state) return { ok: false, reason: "state_mismatch" };
  if (!input.code || input.code.length > 4096) return { ok: false, reason: "authorization_code_missing" };
  return { ok: true, code: input.code };
}
