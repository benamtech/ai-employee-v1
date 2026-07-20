import {
  authorizationServerMetadataCandidates,
  protectedResourceMetadataCandidates,
  validateRemoteMcpAuthorizationMetadata,
  type RemoteMcpAuthorizationPolicy,
  type RemoteMcpAuthorizationServerMetadata,
  type RemoteMcpMetadataDecision,
  type RemoteMcpProtectedResourceMetadata,
} from "@amtech/shared";

const MAX_METADATA_BYTES = Math.max(4_096, Number(process.env.REMOTE_MCP_METADATA_MAX_BYTES ?? 64 * 1024));

function safeHttpsUrl(value: string, label: string): URL {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${label}_invalid_url`); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) {
    throw new Error(`${label}_unsafe_url`);
  }
  return parsed;
}

function splitChallenges(value: string): string[] {
  const challenges: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of value) {
    if (char === '"') quoted = !quoted;
    if (char === "," && !quoted && /\bBearer\s/i.test(current)) {
      challenges.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) challenges.push(current.trim());
  return challenges;
}

/** Extract only the protected server's Bearer `resource_metadata` challenge value. */
export function remoteMcpResourceMetadataFromChallenge(header: string | null, resourceUrl: string): string | null {
  if (!header) return null;
  const resource = safeHttpsUrl(resourceUrl, "remote_mcp_resource");
  for (const challenge of splitChallenges(header)) {
    if (!/^Bearer\b/i.test(challenge)) continue;
    const match = challenge.match(/(?:^|[,\s])resource_metadata="([^"]+)"/i);
    if (!match?.[1]) continue;
    const metadata = safeHttpsUrl(match[1], "remote_mcp_resource_metadata");
    if (metadata.origin !== resource.origin) throw new Error("remote_mcp_resource_metadata_cross_origin");
    return metadata.toString();
  }
  return null;
}

async function jsonMetadata<T>(fetcher: typeof fetch, url: string): Promise<T | null> {
  const response = await fetcher(url, {
    method: "GET",
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.includes("application/json") && !type.includes("+json")) return null;
  const text = await response.text();
  if (!text || Buffer.byteLength(text, "utf8") > MAX_METADATA_BYTES) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

export interface RemoteMcpDiscoveryResult {
  decision: RemoteMcpMetadataDecision;
  protected_resource_metadata_url?: string;
  authorization_server_metadata_url?: string;
}

/**
 * Manager performs discovery itself. The model/runtime may provide only the protected
 * resource URL; authorization servers are accepted exclusively from validated
 * protected-resource metadata and exact issuer metadata.
 */
export async function discoverRemoteMcpAuthorization(input: {
  fetcher: typeof fetch;
  policy: RemoteMcpAuthorizationPolicy;
  resource_metadata_url?: string | null;
}): Promise<RemoteMcpDiscoveryResult> {
  const resource = safeHttpsUrl(input.policy.resource_url, "remote_mcp_resource");
  const explicitMetadata = input.resource_metadata_url
    ? safeHttpsUrl(input.resource_metadata_url, "remote_mcp_resource_metadata")
    : null;
  if (explicitMetadata && explicitMetadata.origin !== resource.origin) {
    return { decision: { ok: false, reason: "resource_metadata_cross_origin" } };
  }
  const protectedCandidates = [
    ...(explicitMetadata ? [explicitMetadata.toString()] : []),
    ...protectedResourceMetadataCandidates(resource.toString()),
  ].filter((value, index, values) => values.indexOf(value) === index);

  for (const protectedUrl of protectedCandidates) {
    const protectedMetadata = await jsonMetadata<RemoteMcpProtectedResourceMetadata>(input.fetcher, protectedUrl);
    if (!protectedMetadata?.resource || !Array.isArray(protectedMetadata.authorization_servers)) continue;
    for (const issuerValue of protectedMetadata.authorization_servers) {
      let issuer: URL;
      try { issuer = safeHttpsUrl(issuerValue, "remote_mcp_authorization_server"); } catch { continue; }
      for (const authorizationUrl of authorizationServerMetadataCandidates(issuer.toString())) {
        const authorizationMetadata = await jsonMetadata<RemoteMcpAuthorizationServerMetadata>(input.fetcher, authorizationUrl);
        if (!authorizationMetadata?.issuer || !authorizationMetadata.authorization_endpoint || !authorizationMetadata.token_endpoint) continue;
        const decision = validateRemoteMcpAuthorizationMetadata({
          policy: input.policy,
          protected_resource: protectedMetadata,
          authorization_server: authorizationMetadata,
        });
        if (decision.ok) {
          return {
            decision,
            protected_resource_metadata_url: protectedUrl,
            authorization_server_metadata_url: authorizationUrl,
          };
        }
      }
    }
  }
  return { decision: { ok: false, reason: "remote_mcp_authorization_metadata_unavailable" } };
}
