export const AMTECH_PROTOCOL_AUTHORITY_VERSION = "amtech.protocol-authority.v1" as const;

export type PresentationProtocol = "web" | "mcp_app" | "ag_ui";

export interface AuthorityProjection {
  protocol_version: typeof AMTECH_PROTOCOL_AUTHORITY_VERSION;
  protocol: PresentationProtocol;
  assignment_id: string;
  authority_version: string;
  resource_type: string;
  resource_id: string;
  allowed_actions: string[];
  issued_at: string;
  expires_at?: string | null;
}

export interface CurrentAuthorityBoundary {
  assignment_id: string;
  authority_version: string;
  resource_type: string;
  resource_id: string;
  allowed_actions: string[];
  active: boolean;
  now?: string;
}

export type ProjectedActionDenial =
  | "projection_protocol_invalid"
  | "assignment_mismatch"
  | "authority_version_mismatch"
  | "resource_mismatch"
  | "projection_expired"
  | "authority_inactive"
  | "action_not_projected"
  | "action_not_currently_authorized";

export type ProjectedActionDecision =
  | { ok: true; action: string }
  | { ok: false; reason: ProjectedActionDenial };

/**
 * Final presentation-to-command interception. A browser, MCP App, or AG-UI client
 * may return only a finite intent. Manager intersects that intent with both the
 * signed/projected authority and freshly resolved durable authority.
 */
export function decideProjectedAction(input: {
  projection: AuthorityProjection;
  current: CurrentAuthorityBoundary;
  requested_action: string;
}): ProjectedActionDecision {
  const { projection, current, requested_action } = input;
  if (projection.protocol_version !== AMTECH_PROTOCOL_AUTHORITY_VERSION) return { ok: false, reason: "projection_protocol_invalid" };
  if (projection.assignment_id !== current.assignment_id) return { ok: false, reason: "assignment_mismatch" };
  if (projection.authority_version !== current.authority_version) return { ok: false, reason: "authority_version_mismatch" };
  if (projection.resource_type !== current.resource_type || projection.resource_id !== current.resource_id) {
    return { ok: false, reason: "resource_mismatch" };
  }
  const now = new Date(current.now ?? new Date().toISOString()).getTime();
  if (projection.expires_at && new Date(projection.expires_at).getTime() <= now) return { ok: false, reason: "projection_expired" };
  if (!current.active) return { ok: false, reason: "authority_inactive" };
  if (!projection.allowed_actions.includes(requested_action)) return { ok: false, reason: "action_not_projected" };
  if (!current.allowed_actions.includes(requested_action)) return { ok: false, reason: "action_not_currently_authorized" };
  return { ok: true, action: requested_action };
}

export interface McpAppSecurityMetadata {
  extension: "io.modelcontextprotocol/ui";
  resource_uri: `ui://${string}`;
  mime_type: "text/html;profile=mcp-app";
  resource_hash: string;
  csp: {
    connect_domains: string[];
    resource_domains: string[];
    frame_domains: string[];
  };
  permissions: string[];
  host_methods: string[];
  authority: AuthorityProjection;
}

export function validateMcpAppSecurityMetadata(metadata: McpAppSecurityMetadata): { ok: boolean; reason?: string } {
  if (metadata.extension !== "io.modelcontextprotocol/ui") return { ok: false, reason: "mcp_app_extension_not_negotiated" };
  if (!metadata.resource_uri.startsWith("ui://")) return { ok: false, reason: "mcp_app_resource_uri_invalid" };
  if (metadata.mime_type !== "text/html;profile=mcp-app") return { ok: false, reason: "mcp_app_mime_type_invalid" };
  if (!/^[a-f0-9]{64}$/i.test(metadata.resource_hash)) return { ok: false, reason: "mcp_app_resource_hash_invalid" };
  if (metadata.csp.connect_domains.length) return { ok: false, reason: "mcp_app_direct_network_forbidden" };
  if (metadata.csp.frame_domains.length) return { ok: false, reason: "mcp_app_nested_frames_forbidden" };
  const methods = new Set(metadata.host_methods);
  const allowed = new Set(["ui/initialize", "ui/notifications/tool-input", "ui/notifications/tool-result", "tools/call"]);
  if ([...methods].some((method) => !allowed.has(method))) return { ok: false, reason: "mcp_app_host_method_not_allowed" };
  return { ok: true };
}
