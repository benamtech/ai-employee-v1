/**
 * MCP-UI resource compiler (Phase 5). Turns an agent-authored, owner-safe `view`
 * into a real MCP-UI `ui://` resource (@mcp-ui/server `createUIResource`, rawHtml)
 * that the Work Surface renders in a sandboxed iframe.
 *
 * Guardrail: the HTML is AMTECH-templated here — never raw model HTML — so a
 * money/customer card can never be spoofed by the model. Every interactive control
 * posts an owner-safe `intent` back to the host, which routes it through the SAME
 * approval/consent path as any other action (mirroring the MCP Apps consent model).
 * Only owner-safe strings from `view` are embedded, all HTML-escaped.
 */
import { createUIResource } from "@mcp-ui/server";
import type { UiResourceEnvelope, WorkDeliverableDescriptor, WorkView } from "@amtech/shared";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const BASE_STYLE = `
  :root{color-scheme:light dark;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  body{margin:0;padding:12px;font-size:14px;color:#1a1a1a;background:#fff}
  @media(prefers-color-scheme:dark){body{color:#eee;background:#111}}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #8883}
  th{font-weight:600;color:#666}
  .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
  .k{color:#888;font-size:12px}
  button{font:inherit;padding:7px 14px;border-radius:8px;border:1px solid #8884;cursor:pointer;background:#f4f4f5}
  button.primary{background:#2563eb;color:#fff;border-color:#2563eb}
  label{display:block;margin:6px 0 2px;font-size:12px;color:#888}
  input,select{font:inherit;padding:6px 8px;border:1px solid #8886;border-radius:6px;width:100%;box-sizing:border-box}
`;

/** The postMessage bridge. Every action is a single owner-safe `intent` envelope
 *  the host validates before routing. No network, no parent access. */
function actionScript(approvalId: string): string {
  return `
    <script>
      var A=${JSON.stringify(approvalId)};
      function amtech(intent,payload){
        parent.postMessage({source:'amtech-mcp-ui',type:'intent',intent:intent,approval_id:A,payload:payload||{}},'*');
      }
      document.addEventListener('click',function(e){
        var b=e.target.closest('[data-intent]'); if(!b) return;
        if(b.getAttribute('data-intent')==='respond'){
          var f={}; document.querySelectorAll('[data-field]').forEach(function(el){f[el.getAttribute('data-field')]=el.value});
          amtech('respond',{fields:f});
        } else { amtech(b.getAttribute('data-intent')); }
      });
    </script>`;
}

function gateButtons(d: WorkDeliverableDescriptor, bulk: boolean): string {
  const approvalId = d.refs?.approval_id;
  if (!approvalId) return ""; // ungated view: display only
  const acceptLabel = bulk ? "Accept all" : "Approve";
  return `<div class="row">
    <button class="primary" data-intent="${bulk ? "accept_all" : "accept"}">${acceptLabel}</button>
    <button data-intent="reject">Not now</button>
  </div>`;
}

function tableHtml(v: Extract<WorkView, { kind: "table" }>, d: WorkDeliverableDescriptor): string {
  const head = v.columns.map((c) => `<th>${esc(c)}</th>`).join("");
  const body = v.rows.map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${gateButtons(d, Boolean(v.bulk_accept))}`;
}

function scheduleHtml(v: Extract<WorkView, { kind: "schedule" }>, d: WorkDeliverableDescriptor): string {
  const items = v.slots.map((s) => `<div class="row"><span class="k">${esc(s.when)}</span> ${esc(s.label)}</div>`).join("");
  return `<div>${items}</div>${gateButtons(d, false)}`;
}

function diffHtml(v: Extract<WorkView, { kind: "diff" }>, d: WorkDeliverableDescriptor): string {
  const keys = Array.from(new Set([...Object.keys(v.before), ...Object.keys(v.after)]));
  const rows = keys.map((k) => `<tr><td class="k">${esc(k)}</td><td>${esc(v.before[k] ?? "")}</td><td>${esc(v.after[k] ?? "")}</td></tr>`).join("");
  return `<table><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody>${rows}</tbody></table>${gateButtons(d, false)}`;
}

function formHtml(v: Extract<WorkView, { kind: "form" }>): string {
  const fields = v.fields.map((f) => {
    if (f.type === "select" && f.options?.length) {
      const opts = f.options.map((o) => `<option ${o === f.value ? "selected" : ""}>${esc(o)}</option>`).join("");
      return `<label>${esc(f.label)}</label><select data-field="${esc(f.name)}">${opts}</select>`;
    }
    return `<label>${esc(f.label)}</label><input data-field="${esc(f.name)}" type="${esc(f.type ?? "text")}" value="${esc(f.value ?? "")}"/>`;
  }).join("");
  return `<form onsubmit="return false">${fields}<div class="row"><button class="primary" data-intent="respond">Send</button></div></form>`;
}

function renderViewHtml(view: WorkView, d: WorkDeliverableDescriptor): string {
  switch (view.kind) {
    case "table": return tableHtml(view, d);
    case "schedule": return scheduleHtml(view, d);
    case "diff": return diffHtml(view, d);
    case "form": return formHtml(view);
    default: return "";
  }
}

/** Compile a deliverable's `view` into an MCP-UI resource. Returns undefined when
 *  there is nothing rich to render (the surface falls back to its text card). */
export function compileDeliverableUiResource(d: WorkDeliverableDescriptor): UiResourceEnvelope | undefined {
  if (!d.view) return undefined;
  const inner = renderViewHtml(d.view, d);
  if (!inner) return undefined;
  const approvalId = d.refs?.approval_id ?? "";
  const htmlString = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head>`
    + `<body>${inner}${actionScript(approvalId)}</body></html>`;
  const uri: `ui://${string}` = `ui://amtech/${d.type}/${approvalId || "view"}`;
  return createUIResource({ uri, content: { type: "rawHtml", htmlString }, encoding: "text" }) as UiResourceEnvelope;
}

/** Attach a compiled ui_resource to a descriptor's deliverable when it carries a
 *  view. Pure — returns a new descriptor; never throws (a compile failure just
 *  leaves the text-card fallback in place). */
export function withUiResource<T extends { deliverable?: WorkDeliverableDescriptor }>(descriptor: T): T {
  const d = descriptor.deliverable;
  if (!d?.view) return descriptor;
  try {
    const ui = compileDeliverableUiResource(d);
    if (!ui) return descriptor;
    return { ...descriptor, deliverable: { ...d, ui_resource: ui } };
  } catch {
    return descriptor;
  }
}
