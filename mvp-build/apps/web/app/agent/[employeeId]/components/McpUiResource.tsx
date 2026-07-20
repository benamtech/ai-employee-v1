"use client";

import { useEffect, useRef, useState } from "react";
import {
  validateMcpAppSecurityMetadata,
  type AuthorityProjection,
  type McpAppSecurityMetadata,
  type UiResourceEnvelope,
} from "@amtech/shared";

export type McpUiIntent = "accept" | "accept_all" | "reject" | "respond";
type McpAppEnvelope = UiResourceEnvelope & { _meta?: McpAppSecurityMetadata };

function projectedAction(intent: McpUiIntent): string {
  return intent === "accept" || intent === "accept_all" ? "approve" : intent;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * MCP Apps host boundary. The iframe has an opaque origin and an in-document CSP
 * that denies ambient network, nested frames, forms, and external resources. It may
 * return only one finite JSON-RPC intent plus the exact projected authority that the
 * native host forwards for fresh Manager reauthorization.
 */
export function McpUiResource({
  resource,
  onIntent,
}: {
  resource: UiResourceEnvelope;
  onIntent: (
    intent: McpUiIntent,
    approvalId: string | undefined,
    payload: Record<string, unknown>,
    authority: AuthorityProjection,
  ) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const envelope = resource as McpAppEnvelope;
  const html = envelope.resource.text ?? "";
  const [trustedHtml, setTrustedHtml] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const metadata = envelope._meta;
      if (!metadata) {
        if (!cancelled) setFailure("This interactive view is missing its negotiated host contract.");
        return;
      }
      const decision = validateMcpAppSecurityMetadata(metadata);
      if (!decision.ok) {
        if (!cancelled) setFailure("This interactive view was blocked because its sandbox contract is invalid.");
        return;
      }
      try {
        const actualHash = await sha256(html);
        if (actualHash !== metadata.resource_hash) {
          if (!cancelled) setFailure("This interactive view changed after Manager approved its resource.");
          return;
        }
        if (!cancelled) {
          setFailure(null);
          setTrustedHtml(html);
        }
      } catch {
        if (!cancelled) setFailure("This browser could not verify the interactive view.");
      }
    }
    void verify();
    return () => { cancelled = true; };
  }, [envelope._meta, html]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!ref.current || event.source !== ref.current.contentWindow || event.origin !== "null") return;
      const metadata = envelope._meta;
      if (!metadata || !validateMcpAppSecurityMetadata(metadata).ok) return;
      const message = event.data as {
        jsonrpc?: string;
        method?: string;
        params?: {
          name?: string;
          arguments?: {
            intent?: string;
            payload?: Record<string, unknown>;
            authority?: McpAppSecurityMetadata["authority"];
          };
        };
      };
      if (message?.jsonrpc !== "2.0" || message.method !== "tools/call" || message.params?.name !== "amtech.surface.intent") return;
      if (!metadata.host_methods.includes("tools/call")) return;
      const args = message.params.arguments;
      const intent = args?.intent as McpUiIntent;
      if (!( ["accept", "accept_all", "reject", "respond"] as string[]).includes(intent)) return;
      const returned = args?.authority;
      if (!returned
        || returned.protocol_version !== metadata.authority.protocol_version
        || returned.protocol !== metadata.authority.protocol
        || returned.assignment_id !== metadata.authority.assignment_id
        || returned.authority_version !== metadata.authority.authority_version
        || returned.resource_type !== metadata.authority.resource_type
        || returned.resource_id !== metadata.authority.resource_id) return;
      if (!metadata.authority.allowed_actions.includes(projectedAction(intent))) return;
      const approvalId = metadata.authority.resource_type === "approval" ? metadata.authority.resource_id : undefined;
      onIntent(intent, approvalId, args?.payload ?? {}, metadata.authority);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [envelope._meta, onIntent]);

  if (failure) return <div role="status" style={{ padding: 14, border: "1px solid rgba(17,17,17,.12)", borderRadius: 10 }}>{failure}</div>;
  if (!trustedHtml) return <div role="status" style={{ padding: 14 }}>Verifying interactive work…</div>;

  return (
    <iframe
      ref={ref}
      title="Interactive work"
      sandbox="allow-scripts"
      allow=""
      referrerPolicy="no-referrer"
      srcDoc={trustedHtml}
      style={{ width: "100%", minHeight: 162, border: "1px solid rgba(17,17,17,0.08)", marginTop: 9, background: "transparent" }}
    />
  );
}
