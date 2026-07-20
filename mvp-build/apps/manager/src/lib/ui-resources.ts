import { createHash } from "node:crypto";
import {
  AMTECH_PROTOCOL_AUTHORITY_VERSION,
  type AuthorityProjection,
  type McpAppSecurityMetadata,
  type UiResourceEnvelope,
  type WorkDeliverableDescriptor,
  type WorkView,
} from "@amtech/shared";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const MCP_APP_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

const BASE_STYLE = `
  :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  *{box-sizing:border-box}
  body{margin:0;padding:16px;font-size:14px;line-height:1.45;color:#111;background:#fff}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #d9e0ea;vertical-align:top}
  th{font-weight:650;color:#4a5568;background:#f7f9fc}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}
  .k{color:#637083;font-size:12px}
  button{min-height:44px;font:inherit;font-weight:650;padding:10px 16px;border-radius:10px;border:1px solid #c9d2df;cursor:pointer;background:#fff;color:#111}
  button:hover{background:#f7f9fc}
  button.primary{background:#e11d2a;color:#fff;border-color:#e11d2a}
  button.primary:hover{background:#bd1722;border-color:#bd1722}
  button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
  label{display:block;margin:10px 0 4px;font-size:12px;font-weight:650;color:#4a5568}
  input,select{min-height:44px;font:inherit;padding:9px 10px;border:1px solid #aeb9c8;border-radius:8px;width:100%;color:#111;background:#fff}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
`;

type McpAppEnvelope = UiResourceEnvelope & { _meta: McpAppSecurityMetadata };

function authorityProjection(d: WorkDeliverableDescriptor): AuthorityProjection | null {
  const refs = d.refs ?? {};
  const assignmentId = refs.assignment_id;
  const authorityVersion = refs.authority_version;
  const resourceType = refs.resource_type
    ?? (refs.approval_id ? "approval" : refs.artifact_id ? "artifact" : undefined);
  const resourceId = refs.resource_id ?? refs.approval_id ?? refs.artifact_id;
  if (!assignmentId || !authorityVersion || !resourceType || !resourceId) return null;
  return {
    protocol_version: AMTECH_PROTOCOL_AUTHORITY_VERSION,
    protocol: "mcp_app",
    assignment_id: assignmentId,
    authority_version: authorityVersion,
    resource_type: resourceType,
    resource_id: resourceId,
    allowed_actions: [...d.acceptance],
    issued_at: refs.authority_issued_at ?? new Date().toISOString(),
    expires_at: refs.authority_expires_at ?? null,
  };
}

/** MCP Apps JSON-RPC bridge. It can request one finite surface intent only. */
function actionScript(authority: AuthorityProjection | null): string {
  if (!authority) return "";
  return `
    <script>
      var A=${JSON.stringify(authority)};
      var N=0;
      function amtech(intent,payload){
        parent.postMessage({
          jsonrpc:'2.0',id:'amtech-ui-'+(++N),method:'tools/call',
          params:{name:'amtech.surface.intent',arguments:{intent:intent,payload:payload||{},authority:A}}
        },'*');
      }
      document.addEventListener('click',function(e){
        var b=e.target.closest('[data-intent]'); if(!b) return;
        var intent=b.getAttribute('data-intent');
        if(intent==='respond'){
          var f={}; document.querySelectorAll('[data-field]').forEach(function(el){f[el.getAttribute('data-field')]=el.value});
          amtech('respond',{fields:f});
        } else { amtech(intent); }
      });
    </script>`;
}

function gateButtons(d: WorkDeliverableDescriptor, bulk: boolean, authority: AuthorityProjection | null): string {
  if (!authority || !d.refs?.approval_id) return "";
  const acceptLabel = bulk ? "Accept all" : "Approve";
  return `<div class="row">
    <button class="primary" data-intent="${bulk ? "accept_all" : "accept"}">${acceptLabel}</button>
    <button data-intent="reject">Not now</button>
  </div>`;
}

function tableHtml(v: Extract<WorkView, { kind: "table" }>, d: WorkDeliverableDescriptor, authority: AuthorityProjection | null): string {
  const head = v.columns.map((c) => `<th>${esc(c)}</th>`).join("");
  const body = v.rows.map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${gateButtons(d, Boolean(v.bulk_accept), authority)}`;
}

function scheduleHtml(v: Extract<WorkView, { kind: "schedule" }>, d: WorkDeliverableDescriptor, authority: AuthorityProjection | null): string {
  const items = v.slots.map((s) => `<div class="row"><span class="k">${esc(s.when)}</span> ${esc(s.label)}</div>`).join("");
  return `<div>${items}</div>${gateButtons(d, false, authority)}`;
}

function diffHtml(v: Extract<WorkView, { kind: "diff" }>, d: WorkDeliverableDescriptor, authority: AuthorityProjection | null): string {
  const keys = Array.from(new Set([...Object.keys(v.before), ...Object.keys(v.after)]));
  const rows = keys.map((k) => `<tr><td class="k">${esc(k)}</td><td>${esc(v.before[k] ?? "")}</td><td>${esc(v.after[k] ?? "")}</td></tr>`).join("");
  return `<table><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody>${rows}</tbody></table>${gateButtons(d, false, authority)}`;
}

function formHtml(v: Extract<WorkView, { kind: "form" }>, authority: AuthorityProjection | null): string {
  const fields = v.fields.map((f) => {
    const required = f.required ? " required" : "";
    if (f.type === "select" && f.options?.length) {
      const opts = f.options.map((o) => `<option ${o === f.value ? "selected" : ""}>${esc(o)}</option>`).join("");
      return `<label>${esc(f.label)}</label><select data-field="${esc(f.name)}"${required}>${opts}</select>`;
    }
    return `<label>${esc(f.label)}</label><input data-field="${esc(f.name)}" type="${esc(f.type ?? "text")}" value="${esc(f.value ?? "")}"${required}/>`;
  }).join("");
  const action = authority ? `<div class="row"><button class="primary" data-intent="respond">Send</button></div>` : "";
  return `<form onsubmit="return false">${fields}${action}</form>`;
}

function renderViewHtml(view: WorkView, d: WorkDeliverableDescriptor, authority: AuthorityProjection | null): string {
  switch (view.kind) {
    case "table": return tableHtml(view, d, authority);
    case "schedule": return scheduleHtml(view, d, authority);
    case "diff": return diffHtml(view, d, authority);
    case "form": return formHtml(view, authority);
  }
}

export const SUPPORTED_WORK_VIEW_KINDS = Object.freeze(["table", "schedule", "diff", "form"] as WorkView["kind"][]);

/**
 * Compile bounded AMTECH data into a negotiated MCP Apps resource. Missing authority
 * produces a useful display-only app rather than an unsafe or broken action surface.
 */
export function compileDeliverableUiResource(d: WorkDeliverableDescriptor): UiResourceEnvelope | undefined {
  if (!d.view) return undefined;
  const authority = authorityProjection(d);
  const inner = renderViewHtml(d.view, d, authority);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="${MCP_APP_CSP}"><style>${BASE_STYLE}</style></head>`
    + `<body>${inner}${actionScript(authority)}</body></html>`;
  const resourceId = authority?.resource_id ?? d.refs?.approval_id ?? d.refs?.artifact_id ?? "view";
  const uri = `ui://amtech/${d.type}/${encodeURIComponent(resourceId)}` as `ui://${string}`;
  const resourceHash = createHash("sha256").update(html).digest("hex");
  const metadata: McpAppSecurityMetadata = {
    extension: "io.modelcontextprotocol/ui",
    resource_uri: uri,
    mime_type: "text/html;profile=mcp-app",
    resource_hash: resourceHash,
    csp: { connect_domains: [], resource_domains: [], frame_domains: [] },
    permissions: [],
    host_methods: authority ? ["ui/initialize", "ui/notifications/tool-input", "ui/notifications/tool-result", "tools/call"] : ["ui/initialize"],
    authority: authority ?? {
      protocol_version: AMTECH_PROTOCOL_AUTHORITY_VERSION,
      protocol: "mcp_app",
      assignment_id: "unbound",
      authority_version: "unbound",
      resource_type: "display",
      resource_id: resourceId,
      allowed_actions: [],
      issued_at: new Date().toISOString(),
      expires_at: null,
    },
  };
  return {
    type: "resource",
    resource: { uri, mimeType: metadata.mime_type, text: html },
    _meta: metadata,
  } as McpAppEnvelope;
}

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
