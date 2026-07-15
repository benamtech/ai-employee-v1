import { postWithVisitor } from "../_lib";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return postWithVisitor("/manager/public-estimator/action", {
    visitor_session_id: body.visitor_session_id,
    action: body.action,
    note: body.note,
  });
}
