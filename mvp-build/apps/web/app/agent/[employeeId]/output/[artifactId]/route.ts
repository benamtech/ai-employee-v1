import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../../api/_lib/manager";

const UI_FIXTURE_MODE = process.env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; artifactId: string }> },
) {
  const { employeeId, artifactId } = await params;
  if (UI_FIXTURE_MODE) {
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
      "Estimate preview";
  const body = artifactId.includes("before")
    ? `<div class="media"><div>Before</div><div>After</div></div><p>This fixture stands in for image/video/gallery preview design without storage or media pipelines.</p>`
    : artifactId.includes("report")
      ? `<table><thead><tr><th>Customer</th><th>Work</th><th>Status</th></tr></thead><tbody><tr><td>Jane Miller</td><td>Kitchen repaint</td><td>needs approval</td></tr><tr><td>Ridgeview HOA</td><td>Exterior touch-up</td><td>deposit draft</td></tr><tr><td>Maple Street</td><td>Trim repair</td><td>needs photos</td></tr></tbody></table>`
      : `<table><tbody><tr><td>Prep and protect</td><td>$650</td></tr><tr><td>Walls and trim, two coats</td><td>$2,950</td></tr><tr><td>Materials and cleanup</td><td>$600</td></tr><tr><th>Total</th><th>$4,200</th></tr></tbody></table>`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; color: #242018; background: #f3f1ec; }
      main { max-width: 760px; margin: 0 auto; background: #fffefa; border: 1px solid #ded8cb; border-radius: 8px; padding: 22px; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { color: #716b60; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #ded8cb; padding: 10px; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
      .media { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
      .media div { aspect-ratio: 4 / 3; border: 1px solid #ded8cb; border-radius: 8px; display: grid; place-items: center; background: #e8f1f8; font-weight: 700; }
      .meta { font-size: 12px; text-transform: uppercase; color: #969086; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <div class="meta">UI fixture · ${safeEmployeeId}</div>
      <h1>${title}</h1>
      <p>This is a local UI-only artifact preview. It does not use Manager, Supabase Storage, Docker, Hermes, or provider credentials.</p>
      ${body}
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
