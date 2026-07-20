import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AMTECH_AG_UI_PROFILE,
  AMTECH_PROTOCOL_AUTHORITY_VERSION,
  MANAGER_API,
  validateAgUiClientCommandShape,
  type AuthorityProjection,
} from "@amtech/shared";
import { managerPost } from "../../../_lib/manager";

interface McpAppCommand {
  profile: "amtech.mcp-app.v1";
  authority: AuthorityProjection;
  action: string;
  idempotency_key: string;
  payload?: Record<string, unknown>;
}

type AgUiCommand = {
  profile: typeof AMTECH_AG_UI_PROFILE;
  assignment_id: string;
  authority_version: string;
  resource_type: string;
  resource_id: string;
  action: string;
  idempotency_key: string;
  payload?: Record<string, unknown>;
};

function normalize(value: unknown): {
  assignment_id: string;
  authority_version: string;
  resource_type: string;
  resource_id: string;
  action: string;
  idempotency_key: string;
  payload: Record<string, unknown>;
} | null {
  if (!value || typeof value !== "object") return null;
  const command = value as McpAppCommand | AgUiCommand;
  if (command.profile === AMTECH_AG_UI_PROFILE) {
    if (!validateAgUiClientCommandShape(command)) return null;
    return { ...command, payload: command.payload ?? {} };
  }
  if (command.profile !== "amtech.mcp-app.v1") return null;
  const authority = command.authority;
  if (!authority
    || authority.protocol_version !== AMTECH_PROTOCOL_AUTHORITY_VERSION
    || authority.protocol !== "mcp_app"
    || !authority.allowed_actions.includes(command.action)
    || !/^[A-Za-z0-9:_-]{8,160}$/.test(command.idempotency_key)) return null;
  return {
    assignment_id: authority.assignment_id,
    authority_version: authority.authority_version,
    resource_type: authority.resource_type,
    resource_id: authority.resource_id,
    action: command.action,
    idempotency_key: command.idempotency_key,
    payload: command.payload ?? {},
  };
}

function ownerResponseText(payload: Record<string, unknown>): string | null {
  if (typeof payload.text === "string" && payload.text.trim()) return payload.text.trim().slice(0, 10_000);
  if (!payload.fields || typeof payload.fields !== "object" || Array.isArray(payload.fields)) return null;
  const entries = Object.entries(payload.fields as Record<string, unknown>)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 50)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 1_000)}`);
  return entries.length ? entries.join("\n") : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const ownerSession = (await cookies()).get("amtech_owner_session")?.value;
  if (!ownerSession) return NextResponse.json({ error: "owner_session_missing" }, { status: 401 });
  const command = normalize(await request.json().catch(() => null));
  if (!command) return NextResponse.json({ error: "protocol_command_invalid" }, { status: 400 });

  if (command.resource_type === "approval" && (command.action === "approve" || command.action === "reject")) {
    const resourcesResponse = await managerPost(MANAGER_API.employeeResources(employeeId), {
      owner_session_token: ownerSession,
    });
    const resources = await resourcesResponse.json().catch(() => ({})) as { account_id?: string };
    if (!resourcesResponse.ok || !resources.account_id) {
      return NextResponse.json(resources, { status: resourcesResponse.status });
    }
    const response = await managerPost("/manager/tools/resolve_approval", {
      owner_session_token: ownerSession,
      account_id: resources.account_id,
      employee_id: employeeId,
      approval_id: command.resource_id,
      owner_response: command.action === "approve" ? "approved" : "rejected",
      channel: "web",
      protocol_assignment_id: command.assignment_id,
      protocol_authority_version: command.authority_version,
      protocol_idempotency_key: command.idempotency_key,
    });
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  }

  if (command.action === "respond" || command.action === "edit") {
    const message = ownerResponseText(command.payload);
    if (!message) return NextResponse.json({ error: "protocol_response_missing" }, { status: 400 });
    const response = await managerPost(`/manager/employee/${employeeId}/message`, {
      owner_session_token: ownerSession,
      message,
      intent_id: command.idempotency_key,
      protocol_assignment_id: command.assignment_id,
      protocol_authority_version: command.authority_version,
    });
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  }

  return NextResponse.json({ error: "protocol_action_not_supported" }, { status: 403 });
}
