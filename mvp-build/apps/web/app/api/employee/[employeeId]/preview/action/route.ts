import { NextResponse } from "next/server";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../../_lib/manager";

/**
 * Owner-authenticated signed preview action (Phase 3). The signed token is the
 * credential (no owner session needed); Manager verifies scope, idempotency, and
 * account/employee binding. Thin proxy — same shape as approval/resolve.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await managerPost(MANAGER_API.previewAction, {
    signed_token: body.signed_token,
    action: body.action,
    note: body.note,
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
