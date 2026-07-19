"use client";

/**
 * Renders a Manager-compiled MCP-UI resource (ui:// rawHtml) in a sandboxed iframe
 * and relays its owner-safe `intent` actions to the host. This is the utilitarian
 * MCP-UI client: real ui:// resources + the postMessage action protocol, rendered
 * through an opaque-origin script sandbox with no access to parent state, cookies,
 * or arbitrary network context. The heavier @mcp-ui/client AppFrame and sandbox
 * proxy host remain the documented upgrade path.
 *
 * Every action still routes through the host's existing approval/respond handlers,
 * so money/customer actions gate and audit exactly as a text-card action would.
 */
import { useEffect, useRef } from "react";
import type { UiResourceEnvelope } from "@amtech/shared";

export type McpUiIntent = "accept" | "accept_all" | "reject" | "respond";

export function McpUiResource({
  resource,
  onIntent,
}: {
  resource: UiResourceEnvelope;
  onIntent: (intent: McpUiIntent, approvalId: string | undefined, payload: Record<string, unknown>) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const html = resource.resource.text ?? "";

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      const data = e.data as { source?: string; type?: string; intent?: string; approval_id?: string; payload?: Record<string, unknown> };
      if (data?.source !== "amtech-mcp-ui" || data.type !== "intent") return;
      const intent = data.intent as McpUiIntent;
      if (!["accept", "accept_all", "reject", "respond"].includes(intent)) return;
      onIntent(intent, data.approval_id || undefined, data.payload ?? {});
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onIntent]);

  return (
    <iframe
      ref={ref}
      title="work item"
      sandbox="allow-scripts"
      srcDoc={html}
      style={{ width: "100%", minHeight: 162, border: "1px solid rgba(17,17,17,0.08)", marginTop: 9, background: "transparent" }}
    />
  );
}
