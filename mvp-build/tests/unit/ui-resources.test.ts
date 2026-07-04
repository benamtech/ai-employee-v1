import { describe, expect, it } from "vitest";
import { compileDeliverableUiResource, withUiResource } from "../../apps/manager/src/lib/ui-resources";
import type { WorkDeliverableDescriptor } from "@amtech/shared";

const tableDeliverable = (over: Partial<WorkDeliverableDescriptor> = {}): WorkDeliverableDescriptor => ({
  type: "dataset_report", title: "Overdue invoices", refs: { approval_id: "appr_1" },
  acceptance: ["approve", "reject"],
  view: { kind: "table", columns: ["Customer", "Amount"], rows: [["Acme", "$500"]], bulk_accept: true },
  ...over,
});

describe("compileDeliverableUiResource", () => {
  it("produces a real ui:// MCP-UI resource", () => {
    const ui = compileDeliverableUiResource(tableDeliverable())!;
    expect(ui.type).toBe("resource");
    expect(ui.resource.uri).toBe("ui://amtech/dataset_report/appr_1");
    expect(ui.resource.mimeType).toContain("text/html");
    expect(ui.resource.text).toContain("Acme");
  });

  it("binds actions to the approval id and offers bulk accept", () => {
    const ui = compileDeliverableUiResource(tableDeliverable())!;
    const html = ui.resource.text ?? "";
    expect(html).toContain('data-intent="accept_all"');
    expect(html).toContain('"appr_1"');
  });

  it("HTML-escapes owner data and embeds no secret", () => {
    const ui = compileDeliverableUiResource(tableDeliverable({
      view: { kind: "table", columns: ["Note"], rows: [["<script>steal()</script>"]] },
      refs: { approval_id: "appr_1", api_key: "sk_live_should_never_render" },
    }))!;
    const html = ui.resource.text ?? "";
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>steal");
    expect(html).not.toContain("sk_live_should_never_render");
  });

  it("returns undefined when there is no view", () => {
    expect(compileDeliverableUiResource(tableDeliverable({ view: undefined }))).toBeUndefined();
  });
});

describe("withUiResource", () => {
  it("attaches a compiled resource when a view is present", () => {
    const d = withUiResource({ deliverable: tableDeliverable() }).deliverable!;
    expect(d.ui_resource?.resource.uri).toContain("ui://amtech/dataset_report");
  });
  it("leaves a viewless deliverable untouched", () => {
    const d = withUiResource({ deliverable: tableDeliverable({ view: undefined }) }).deliverable!;
    expect(d.ui_resource).toBeUndefined();
  });
});
