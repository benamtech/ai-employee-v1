import { getCurrentDraft } from "../_lib";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return getCurrentDraft(url.searchParams.get("visitor_session_id") ?? "");
}
