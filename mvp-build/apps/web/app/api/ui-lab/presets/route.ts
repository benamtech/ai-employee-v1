import { NextResponse } from "next/server";
import { UiLabSavePresetRequest } from "@amtech/shared";
import {
  assertUiFixturesAllowed,
  isUiFixtureRequested,
} from "../../../_lib/ui-fixtures";
import {
  saveUiLabDraft,
  uiLabRegistrySnapshot,
} from "../../../_lib/ui-lab-registry.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!uiLabReadAllowed()) return new NextResponse(null, { status: 404 });
  const writeEnabled = uiLabWriteAllowed(request);
  const snapshot = await uiLabRegistrySnapshot(writeEnabled);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!uiLabWriteAllowed(request)) {
    return NextResponse.json(
      { error: "ui_lab_repository_writes_disabled" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = UiLabSavePresetRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: "invalid_ui_lab_preset",
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  try {
    const preset = await saveUiLabDraft(parsed.data);
    return NextResponse.json({ preset }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EEXIST") {
      return NextResponse.json({ error: "ui_lab_preset_version_exists" }, { status: 409 });
    }
    return NextResponse.json({
      error: "ui_lab_preset_save_failed",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

function uiLabReadAllowed(): boolean {
  if (!isUiFixtureRequested()) return false;
  try {
    assertUiFixturesAllowed();
    return true;
  } catch {
    return false;
  }
}

function uiLabWriteAllowed(request: Request): boolean {
  if (!uiLabReadAllowed()) return false;
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.AMTECH_UI_LAB_WRITE !== "1") return false;

  const requestUrl = new URL(request.url);
  if (!isLoopback(requestUrl.hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === requestUrl.origin;
  } catch {
    return false;
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}
