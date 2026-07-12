/**
 * Signed mobile review route (Phase 3). The `?t=` token is the auth — no owner
 * login. This server component resolves the token to a WorkResource through Manager
 * (which decodes the scoped resource), then hands it to the client action bar. In
 * UI-fixture mode it renders representative resources with no Manager/creds.
 */
import { MANAGER_API, type WorkResource } from "@amtech/shared";
import { managerPost } from "../../../api/_lib/manager";
import { ReviewClient } from "./ReviewClient";

const UI_FIXTURE_MODE = process.env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";

export const metadata = { title: "Review — AMTECH" };

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { employeeId } = await params;
  const { t } = await searchParams;
  const token = t ?? "";

  if (UI_FIXTURE_MODE) {
    return <ReviewClient employeeId={employeeId} token={token} resource={fixtureResource(token)} />;
  }

  if (!token) {
    return <ReviewClient employeeId={employeeId} token="" error="denied" />;
  }

  const res = await managerPost(MANAGER_API.previewResolve, { signed_token: token });
  const json = await res.json().catch(() => ({}));
  if (res.status === 410 || json?.expired) {
    return <ReviewClient employeeId={employeeId} token={token} error="expired" />;
  }
  if (res.status === 404) {
    return <ReviewClient employeeId={employeeId} token={token} error="not_found" />;
  }
  if (!res.ok || !json?.resource) {
    return <ReviewClient employeeId={employeeId} token={token} error="denied" />;
  }
  return <ReviewClient employeeId={json.employee_id ?? employeeId} token={token} resource={json.resource as WorkResource} />;
}

/** Representative resources for UI-only work (no Manager/Supabase/creds). */
function fixtureResource(token: string): WorkResource {
  if (token.includes("media")) {
    return {
      resource_type: "artifact",
      resource_id: "art_fixture_media",
      title: "Ridgeview before / after",
      subtitle: "Job photos",
      summary: "Two photos from the Ridgeview HOA exterior touch-up, ready for the review request.",
      body_kind: "media",
      media: {
        url: "data:image/svg+xml," + encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'><rect width='600' height='450' fill='#f4f4f4'/><rect x='12' y='12' width='282' height='426' fill='#dcdcdc'/><rect x='306' y='12' width='282' height='426' fill='#c3c3c3'/><g font-family='monospace' font-size='21' fill='#0a0a0a'><text x='36' y='240'>BEFORE</text><text x='330' y='240'>AFTER</text></g><text x='36' y='420' font-family='monospace' font-size='12' fill='#666666'>FIXTURE PHOTO PLACEHOLDER</text></svg>",
        ),
        kind: "image",
        caption: "Ridgeview HOA — exterior touch-up",
      },
      actions: [
        { action: "respond", label: "Reply", style: "default" },
        { action: "acknowledge", label: "Got it", style: "default" },
      ],
    };
  }
  if (token.includes("receipt")) {
    return {
      resource_type: "work_event",
      resource_id: "we_fixture_receipt",
      title: "Estimate sent to Jane",
      subtitle: "Receipt",
      summary: "The kitchen repaint estimate went out after your approval. Jane can reply directly; I will bring her answer back to you.",
      body_kind: "structured",
      fields: [
        { label: "Sent to", value: "jane@example.com" },
        { label: "Sent at", value: "2026-07-12 09:41" },
        { label: "Approved by", value: "You, via text" },
      ],
      receipts: [
        { label: "View sent email", value: "#fixture-proof-email" },
        { label: "View estimate", value: "#fixture-proof-estimate" },
      ],
      actions: [{ action: "acknowledge", label: "Got it", style: "default" }],
    };
  }
  if (token.includes("failure") || token.includes("connector")) {
    return {
      resource_type: "connector",
      resource_id: "conn_fixture_stripe",
      title: "Payments need attention",
      subtitle: "Connected account",
      risk: "high",
      summary: "The payments connection stopped working, so I paused new payment links. Nothing was sent while it was down. Reconnect and I pick the work back up.",
      body_kind: "structured",
      fields: [
        { label: "Connection", value: "Payments" },
        { label: "State", value: "Needs you" },
        { label: "Held work", value: "1 deposit invoice" },
      ],
      actions: [
        { action: "respond", label: "Tell my employee what to do", style: "primary" },
        { action: "acknowledge", label: "Got it", style: "default" },
      ],
    };
  }
  if (token.includes("report")) {
    return {
      resource_type: "artifact",
      resource_id: "art_fixture_report",
      title: "Weekly pipeline report",
      subtitle: "Report",
      body_kind: "document",
      body_html: "<!doctype html><meta charset='utf-8'><body style=\"font-family:system-ui;padding:16px;color:#23211c\"><h2 style='margin-top:0'>This week</h2><table style='width:100%;border-collapse:collapse'><tr><td style='padding:6px;border-bottom:1px solid #eee'>Jane Miller — kitchen repaint</td><td style='padding:6px;border-bottom:1px solid #eee;text-align:right'>needs approval</td></tr><tr><td style='padding:6px;border-bottom:1px solid #eee'>Ridgeview HOA — exterior</td><td style='padding:6px;border-bottom:1px solid #eee;text-align:right'>deposit draft</td></tr></table></body>",
      actions: [
        { action: "respond", label: "Reply", style: "default" },
        { action: "acknowledge", label: "Got it", style: "default" },
      ],
    };
  }
  if (token.includes("estimate") || token.includes("artifact")) {
    return {
      resource_type: "artifact",
      resource_id: "art_fixture_estimate",
      title: "Estimate for Jane Miller",
      subtitle: "Estimate",
      amount: "$4,200.00",
      body_kind: "document",
      body_html: "<!doctype html><meta charset='utf-8'><body style=\"font-family:system-ui;padding:16px;color:#23211c\"><table style='width:100%;border-collapse:collapse'><tr><td style='padding:6px'>Prep and protect</td><td style='padding:6px;text-align:right'>$650</td></tr><tr><td style='padding:6px'>Walls and trim, two coats</td><td style='padding:6px;text-align:right'>$2,950</td></tr><tr><td style='padding:6px'>Materials and cleanup</td><td style='padding:6px;text-align:right'>$600</td></tr><tr><td style='padding:6px;font-weight:700'>Total</td><td style='padding:6px;text-align:right;font-weight:700'>$4,200</td></tr></table></body>",
      actions: [
        { action: "respond", label: "Reply", style: "default" },
        { action: "acknowledge", label: "Got it", style: "default" },
      ],
    };
  }
  return {
    resource_type: "approval",
    resource_id: "appr_fixture",
    title: "Needs your decision",
    subtitle: "Send estimate email",
    amount: "$4,200.00",
    recipient: "Jane Miller",
    risk: "medium",
    summary: "Send the kitchen repaint estimate to Jane so she can review and put down a deposit.",
    body_kind: "structured",
    fields: [
      { label: "Customer", value: "Jane Miller" },
      { label: "Job", value: "Kitchen repaint" },
    ],
    actions: [
      { action: "approve", label: "Approve", style: "primary", gated: true },
      { action: "reject", label: "Decline", style: "danger", gated: true },
      { action: "respond", label: "Reply", style: "default" },
    ],
  };
}
