import { describe, expect, it } from "vitest";
import {
  compileDeliverableUiResource,
  SUPPORTED_WORK_VIEW_KINDS,
  withUiResource,
} from "../../apps/manager/src/lib/ui-resources";
import type { McpAppSecurityMetadata, UiResourceEnvelope, WorkDeliverableDescriptor, WorkView } from "@amtech/shared";

type TestMcpAppEnvelope = UiResourceEnvelope & { _meta: McpAppSecurityMetadata };

const tableDeliverable = (over: Partial<WorkDeliverableDescriptor> = {}): WorkDeliverableDescriptor => ({
  type: "dataset_report",
  title: "Overdue invoices",
  refs: {
    approval_id: "appr_1",
    assignment_id: "asn_1",
    authority_version: "authv_7",
    resource_type: "approval",
    resource_id: "appr_1",
  },
  acceptance: ["approve", "reject"],
  view: { kind: "table", columns: ["Customer", "Amount"], rows: [["Acme", "$500"]], bulk_accept: true },
  ...over,
});

const supportedViews: WorkView[] = [
  { kind: "table", columns: ["Customer"], rows: [["Acme"]] },
  { kind: "schedule", span: "day", slots: [{ when: "9:00 AM", label: "Call customer" }] },
  { kind: "diff", before: { status: "draft" }, after: { status: "approved" } },
  { kind: "form", fields: [{ name: "answer", label: "Answer", required: true }] },
];

describe("compileDeliverableUiResource", () => {
  it("produces a negotiated ui:// MCP Apps resource", () => {
    const ui = compileDeliverableUiResource(tableDeliverable())! as TestMcpAppEnvelope;
    expect(ui.type).toBe("resource");
    expect(ui.resource.uri).toBe("ui://amtech/dataset_report/appr_1");
    expect(ui.resource.mimeType).toBe("text/html;profile=mcp-app");
    expect(ui.resource.text).toContain("Acme");
    expect(ui._meta.extension).toBe("io.modelcontextprotocol/ui");
  });

  it("binds actions to assignment, authority version, resource, and approval id before offering bulk accept", () => {
    const ui = compileDeliverableUiResource(tableDeliverable())! as TestMcpAppEnvelope;
    const html = ui.resource.text ?? "";
    expect(html).toContain('data-intent="accept_all"');
    expect(html).toContain('"assignment_id":"asn_1"');
    expect(html).toContain('"authority_version":"authv_7"');
    expect(html).toContain('"resource_id":"appr_1"');
    expect(ui._meta.authority.allowed_actions).toEqual(["approve", "reject"]);
  });

  it("makes an under-scoped generated view display-only instead of manufacturing authority", () => {
    const ui = compileDeliverableUiResource(tableDeliverable({ refs: { approval_id: "appr_1" } }))! as TestMcpAppEnvelope;
    expect(ui.resource.text).not.toContain("data-intent=");
    expect(ui._meta.authority.allowed_actions).toEqual([]);
    expect(ui._meta.host_methods).toEqual(["ui/initialize"]);
  });

  it("HTML-escapes owner data and embeds no secret", () => {
    const ui = compileDeliverableUiResource(tableDeliverable({
      view: { kind: "table", columns: ["Note"], rows: [["<script>steal()</script>"]] },
      refs: {
        approval_id: "appr_1",
        assignment_id: "asn_1",
        authority_version: "authv_7",
        resource_type: "approval",
        resource_id: "appr_1",
        api_key: "sk_live_should_never_render",
      },
    }))!;
    const html = ui.resource.text ?? "";
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>steal");
    expect(html).not.toContain("sk_live_should_never_render");
  });

  it("keeps the shared WorkView vocabulary congruent with the MCP Apps renderer registry", () => {
    expect([...SUPPORTED_WORK_VIEW_KINDS].sort()).toEqual(["diff", "form", "schedule", "table"]);
    for (const view of supportedViews) {
      const ui = compileDeliverableUiResource(tableDeliverable({ view })) as TestMcpAppEnvelope | undefined;
      expect(ui?.resource.uri).toBe("ui://amtech/dataset_report/appr_1");
      expect(ui?.resource.mimeType).toBe("text/html;profile=mcp-app");
      expect(ui?._meta.extension).toBe("io.modelcontextprotocol/ui");
      expect(ui?._meta.resource_hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("uses the canonical light surface, AMTECH red action, accessible targets, and focus", () => {
    const html = compileDeliverableUiResource(tableDeliverable())?.resource.text ?? "";
    expect(html).toContain("color-scheme:light");
    expect(html).not.toContain("prefers-color-scheme:dark");
    expect(html).toContain("background:#e11d2a");
    expect(html).toContain("min-height:44px");
    expect(html).toContain(":focus-visible");
    expect(html).toContain("prefers-reduced-motion:reduce");
  });

  it("returns undefined when there is no view", () => {
    expect(compileDeliverableUiResource(tableDeliverable({ view: undefined }))).toBeUndefined();
  });
});

describe("withUiResource", () => {
  it("attaches a compiled resource when a view is present", () => {
    const deliverable = withUiResource({ deliverable: tableDeliverable() }).deliverable!;
    expect(deliverable.ui_resource?.resource.uri).toContain("ui://amtech/dataset_report");
  });
  it("leaves a viewless deliverable untouched", () => {
    const deliverable = withUiResource({ deliverable: tableDeliverable({ view: undefined }) }).deliverable!;
    expect(deliverable.ui_resource).toBeUndefined();
  });
});
