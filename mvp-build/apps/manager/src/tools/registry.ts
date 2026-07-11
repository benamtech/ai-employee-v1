/**
 * Manager tool registry. Aggregates every grouped tool module and guarantees the
 * registry covers the FULL 04-manager-tools.md surface (TOOL_NAMES). A missing
 * handler throws at construction — so "every tool exists" is enforced, not hoped.
 */
import { TOOL_NAMES, type ToolName } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { identityTools } from "./identity.stub.js";
import { provisioningTools } from "./provisioning.stub.js";
import { estimateTools } from "./estimate.stub.js";
import { gmailTools } from "./gmail.stub.js";
import { stripeTools } from "./stripe.stub.js";
import { eventTools } from "./events.stub.js";
import { repairTools } from "./repair.stub.js";
import { qboTools } from "./qbo.stub.js";

const merged: Partial<Record<ToolName, ToolHandler>> = {
  ...identityTools,
  ...provisioningTools,
  ...estimateTools,
  ...gmailTools,
  ...stripeTools,
  ...eventTools,
  ...repairTools,
  ...qboTools,
};

export function buildToolRegistry(): Map<ToolName, ToolHandler> {
  const reg = new Map<ToolName, ToolHandler>();
  const missing: string[] = [];
  for (const name of TOOL_NAMES) {
    const h = merged[name];
    if (!h) missing.push(name);
    else reg.set(name, h);
  }
  if (missing.length) {
    throw new Error(`Tool registry incomplete — missing handlers: ${missing.join(", ")}`);
  }
  return reg;
}

export const TOOL_REGISTRY = buildToolRegistry();
