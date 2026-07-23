/**
 * Manager tool registry. Aggregates every grouped tool module and guarantees the
 * registry covers the FULL 04-manager-tools.md surface (TOOL_NAMES). A missing
 * handler throws at construction — so "every tool exists" is enforced, not hoped.
 */
import { TOOL_NAMES, type ToolName } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { identityTools } from "./identity.stub.js";
import { provisioningTools } from "./provisioning.stub.js";
import { verifiedProvisioningTools } from "./verified-provisioning.stub.js";
import { estimateTools } from "./estimate.stub.js";
import { gmailTools } from "./gmail.stub.js";
import { stripeTools } from "./stripe.stub.js";
import { eventTools } from "./events.stub.js";
import { repairTools } from "./repair.stub.js";
import { qboTools } from "./qbo.stub.js";
import { approvalAuthorityTools } from "./approval-authority.stub.js";
import { approvedActionTools } from "./approved-actions.stub.js";
import { qboApprovalPromotionTools } from "./qbo-approval-promotion.stub.js";
import { assignmentArtifactTools } from "./assignment-artifacts.stub.js";
import { connectEmailWithOwnerReturn } from "./gmail-connect-owner.js";
import { connectQuickBooksWithOwnerReturn } from "./qbo-connect-owner.js";
import { artifactWorkbenchTools } from "./artifact-workbench-tools.js";
import { requestApprovalWithArtifactSupport } from "./artifact-approval-authority.js";
import { managerExtensionTools } from "./manager-extension-tools.js";

const merged: Partial<Record<ToolName, ToolHandler>> = {
  ...identityTools,
  ...provisioningTools,
  ...verifiedProvisioningTools,
  ...estimateTools,
  ...gmailTools,
  ...stripeTools,
  ...eventTools,
  ...repairTools,
  ...qboTools,
  // Canonical assignment and approval overrides. Legacy feature-local checks
  // remain unreachable compatibility code; every transport resolves here.
  ...assignmentArtifactTools,
  ...qboApprovalPromotionTools,
  ...approvalAuthorityTools,
  ...approvedActionTools,
  // Provider implementations remain canonical. These wrappers only bind a safe,
  // signed owner return target to their consent-start seams.
  connect_email: connectEmailWithOwnerReturn,
  connect_quickbooks: connectQuickBooksWithOwnerReturn,
  // Existing resources stay on the canonical handler; only artifact publication
  // enters the additive immutable-snapshot branch.
  request_approval: requestApprovalWithArtifactSupport,
};

export function buildToolRegistry(): Map<ToolName, ToolHandler> {
  const reg = new Map<ToolName, ToolHandler>();
  const missing: string[] = [];
  for (const name of TOOL_NAMES) {
    const handler = merged[name];
    if (!handler) missing.push(name);
    else reg.set(name, handler);
  }
  if (missing.length) {
    throw new Error(`Tool registry incomplete — missing handlers: ${missing.join(", ")}`);
  }
  // Artifact workbench and experience tools extend the historical phase registry
  // without creating a second dispatcher or weakening Manager custody.
  for (const [name, handler] of Object.entries(artifactWorkbenchTools)) {
    reg.set(name as ToolName, handler);
  }
  for (const [name, handler] of Object.entries(managerExtensionTools)) {
    reg.set(name as ToolName, handler);
  }
  return reg;
}

export const TOOL_REGISTRY = buildToolRegistry();
