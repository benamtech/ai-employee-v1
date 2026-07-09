/**
 * Generic artifact HTML renderer — turns ANY artifact's stored structured
 * `payload` into an owner-safe, self-contained HTML document, with ZERO per-tool
 * code. This is the same principle as the schema-driven Work Surface
 * (`formViewFromJsonSchema`) and MCP-UI compiler (`ui-resources.ts`): the model
 * fills a typed payload; the RENDERER is deterministic and AMTECH-templated, so
 * the owner sees a consistent grammar and the model can never inject markup.
 *
 * Used when an artifact has no rendered file (`storage_ref`) yet — e.g. an
 * estimate created by `create_estimate_artifact` before any PDF exists. Every
 * artifact kind (estimate, report, record, plan, ...) renders from its payload:
 * arrays of objects become tables, scalars become key/value rows, nested objects
 * become sections. All values are HTML-escaped.
 */

export interface RenderableArtifact {
  id?: string | null;
  kind?: string | null;
  payload?: unknown;
  created_at?: string | null;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Money-ish keys get a `$` and 2 decimals; `*_percent` stays a plain number. */
function isMoneyKey(key: string): boolean {
  return /(?:price|total|amount|deposit|subtotal|cost|fee)/i.test(key) && !/percent|count|qty|quantity/i.test(key);
}

function fmtScalar(key: string, val: unknown): string {
  if (val == null) return "";
  if (typeof val === "number") {
    if (isMoneyKey(key)) return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return val.toLocaleString();
  }
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function renderTable(rows: Record<string, unknown>[]): string {
  const cols: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  const head = cols.map((c) => `<th>${esc(humanize(c))}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${cols.map((c) => `<td>${esc(fmtScalar(c, r[c]))}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderValue(key: string, val: unknown): string {
  if (Array.isArray(val)) {
    if (val.length === 0) return `<span class="faint">none</span>`;
    if (val.every((v) => isPlainObject(v))) return renderTable(val as Record<string, unknown>[]);
    return `<ul>${val.map((v) => `<li>${esc(fmtScalar(key, v))}</li>`).join("")}</ul>`;
  }
  if (isPlainObject(val)) return renderKeyValues(val);
  return `<span>${esc(fmtScalar(key, val))}</span>`;
}

function renderKeyValues(obj: Record<string, unknown>): string {
  const rows: string[] = [];
  const sections: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === "") continue;
    if (Array.isArray(v) || isPlainObject(v)) {
      sections.push(`<section><h2>${esc(humanize(k))}</h2>${renderValue(k, v)}</section>`);
    } else {
      rows.push(`<div class="kv"><span class="k">${esc(humanize(k))}</span><span class="v">${esc(fmtScalar(k, v))}</span></div>`);
    }
  }
  const head = rows.length ? `<div class="kvs">${rows.join("")}</div>` : "";
  return `${head}${sections.join("")}`;
}

function titleFor(artifact: RenderableArtifact): string {
  const kind = humanize(String(artifact.kind || "artifact"));
  const p = artifact.payload;
  const customer = isPlainObject(p) ? (p.customer_name ?? p.customer ?? p.title ?? p.name) : undefined;
  return customer ? `${kind} — ${customer}` : kind;
}

const STYLE = `
  :root{color-scheme:light dark;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  body{margin:0;padding:24px;max-width:760px;color:#141414;background:#fff;line-height:1.5}
  @media(prefers-color-scheme:dark){body{color:#eee;background:#111}}
  header{border-bottom:1px solid #8883;padding-bottom:12px;margin-bottom:16px}
  h1{font-size:20px;margin:0 0 2px}
  .meta{color:#888;font-size:12px;margin:0}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#888;margin:20px 0 6px}
  table{border-collapse:collapse;width:100%;font-size:14px;margin-top:4px}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #8883;vertical-align:top}
  th{font-weight:600;color:#666;font-size:12px}
  .kvs{display:grid;gap:4px;margin-top:4px}
  .kv{display:flex;gap:10px;font-size:14px}
  .kv .k{color:#888;min-width:160px}
  ul{margin:4px 0;padding-left:20px;font-size:14px}
  .faint{color:#aaa}
  footer{margin-top:28px;padding-top:12px;border-top:1px solid #8883;color:#aaa;font-size:11px}
`;

/**
 * Render an artifact to a complete, owner-safe HTML document from its structured
 * payload. Works for every artifact kind. Returns null when there is nothing to
 * show (no payload), so the caller can 404 truly-empty artifacts.
 */
export function renderArtifactHtml(artifact: RenderableArtifact): string | null {
  const payload = artifact.payload;
  if (!isPlainObject(payload) || Object.keys(payload).length === 0) return null;
  const body = renderKeyValues(payload);
  const meta = [humanize(String(artifact.kind || "artifact")), artifact.id]
    .filter(Boolean)
    .map((s) => esc(String(s)))
    .join(" · ");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titleFor(artifact))}</title><style>${STYLE}</style></head><body><header><h1>${esc(titleFor(artifact))}</h1><p class="meta">${meta}</p></header>${body}<footer>Generated by your AMTECH AI employee. Not yet a shareable PDF — ask it to finalize the document to send it out.</footer></body></html>`;
}
