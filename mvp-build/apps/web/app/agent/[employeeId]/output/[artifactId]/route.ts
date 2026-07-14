import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { uiFixtureMode } from "../../../../_lib/ui-fixtures";
import { managerPost } from "../../../../api/_lib/manager";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; artifactId: string }> },
) {
  const { employeeId, artifactId } = await params;
  if (uiFixtureMode()) {
    return new Response(fixtureArtifactHtml(employeeId, artifactId), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const token = new URL(req.url).searchParams.get("t");
  const cookieStore = await cookies();
  const res = await managerPost(MANAGER_API.artifactResolve(employeeId, artifactId), {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
    signed_token: token,
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && typeof json.html === "string") {
    return new Response(json.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (!res.ok || !json.signed_url) {
    return NextResponse.json(json, { status: res.status });
  }
  return NextResponse.redirect(json.signed_url);
}

function fixtureArtifactHtml(employeeId: string, artifactId: string): string {
  const safeEmployeeId = escapeHtml(employeeId);
  const title = artifactId.includes("before") ? "Before/after media preview" :
    artifactId.includes("report") ? "Weekly pipeline report" :
      "Estimate — Jane Miller, kitchen repaint";
  const body = artifactId.includes("before")
    ? `<h1>Before/after media preview</h1><p>This fixture stands in for image/video/gallery preview design without storage or media pipelines.</p><div class="media"><div>Before</div><div>After</div></div>`
    : artifactId.includes("report")
      ? `<h1>Weekly pipeline report</h1><p>Three open estimates this week. Everything customer-facing is staged and waiting on approvals.</p><table><thead><tr><th>Customer</th><th>Work</th><th>Status</th></tr></thead><tbody><tr><td>Jane Miller</td><td>Kitchen repaint</td><td>needs approval</td></tr><tr><td>Ridgeview HOA</td><td>Exterior touch-up</td><td>deposit draft</td></tr><tr><td>Maple Street</td><td>Trim repair</td><td>needs photos</td></tr></tbody></table>`
      : `
      <div class="letterhead">
        <div>
          <div class="biz">Brightside Painting Co<span class="dot">.</span></div>
          <div class="biz-sub">Residential painting &middot; Scranton, PA</div>
        </div>
        <div class="est-mark">
          <div class="est-word">Estimate</div>
          <div class="est-meta">No. 2026-014 &middot; Jul 12, 2026 &middot; valid 30 days</div>
        </div>
      </div>
      <div class="parties">
        <div><span class="lbl">Prepared for</span>Jane Miller<br/>41 Maple Street</div>
        <div><span class="lbl">Job</span>Kitchen repaint<br/>Walls and trim, two coats</div>
      </div>
      <table>
        <thead><tr><th>Work</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>Prep and protect &mdash; mask cabinets, floors, fixtures</td><td>$650</td></tr>
          <tr><td>Walls and trim, two coats &mdash; premium interior</td><td>$2,950</td></tr>
          <tr><td>Materials and cleanup</td><td>$600</td></tr>
          <tr class="total"><th>Total</th><th>$4,200</th></tr>
        </tbody>
      </table>
      <div class="notes">
        <div><span class="lbl">Assumptions</span>Ceiling not included &middot; existing paint sound, no skim coat &middot; furniture moved by customer</div>
        <div class="flag"><span class="lbl">Please confirm</span>Trim color match &mdash; existing trim brand unknown, priced as standard white semi-gloss</div>
      </div>
      <div class="terms">30% deposit to schedule &middot; balance on completion &middot; prepared by your AI employee, sent only after owner approval</div>`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 24px; font-family: Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; background: #f4f4f4; }
      main { max-width: 762px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(10,10,10,0.10); }
      .head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 15px 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
      .logo, .meta { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
      .logo .dot { color: #e11d2a; }
      .meta { color: rgba(10,10,10,0.62); font-weight: 500; }
      .doc { padding: 24px; }
      h1 { margin: 0 0 9px; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; }
      p { color: rgba(10,10,10,0.62); line-height: 1.6; font-size: 12px; margin: 0 0 9px; max-width: 480px; }
      .letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; flex-wrap: wrap; padding-bottom: 18px; border-bottom: 3px solid #0a0a0a; }
      .biz { font-size: 21px; font-weight: 900; letter-spacing: -0.03em; }
      .biz .dot { color: #e11d2a; }
      .biz-sub { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-top: 3px; }
      .est-mark { text-align: right; }
      .est-word { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; }
      .est-meta { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.03em; color: rgba(10,10,10,0.62); margin-top: 3px; }
      .parties { display: flex; gap: 36px; flex-wrap: wrap; padding: 15px 0 6px; font-size: 12px; line-height: 1.6; }
      .lbl { display: block; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-bottom: 3px; }
      tr.total th { font-size: 18px; font-weight: 800; letter-spacing: -0.015em; border-top: 3px solid #0a0a0a; }
      .notes { display: grid; gap: 9px; margin-top: 18px; font-size: 12px; line-height: 1.6; color: rgba(10,10,10,0.82); }
      .notes .flag { border-left: 3px solid #e11d2a; padding-left: 9px; }
      .terms { margin-top: 18px; padding-top: 9px; border-top: 1px solid rgba(10,10,10,0.10); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.03em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; border: 1px solid rgba(10,10,10,0.10); }
      th, td { border-bottom: 1px solid rgba(10,10,10,0.10); padding: 9px 12px; text-align: left; font-size: 15px; }
      thead th { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
      tr:last-child th, tr:last-child td { border-bottom: 0; }
      tbody tr:last-child th, tbody tr:last-child td { font-weight: 700; border-top: 1px solid #0a0a0a; }
      th:last-child, td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
      .media { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(10,10,10,0.10); border: 1px solid rgba(10,10,10,0.10); margin-top: 18px; }
      .media div { aspect-ratio: 4 / 3; display: grid; place-items: center; background: #f4f4f4; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
    </style>
  </head>
  <body>
    <main>
      <div class="head">
        <span class="logo">AMTECH<span class="dot">.</span></span>
        <span class="meta">UI fixture · ${safeEmployeeId}</span>
      </div>
      <div class="doc">
        ${body}
      </div>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char] ?? char));
}
