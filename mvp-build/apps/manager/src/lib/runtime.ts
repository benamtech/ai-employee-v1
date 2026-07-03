import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";

export async function deliverToRuntime(apiUrl: string, body: string, channel: "sms" | "web"): Promise<string> {
  if (!apiUrl) throw new Error("employee runtime API missing");
  const path = process.env.HERMES_MESSAGE_PATH ?? "/messages";
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HERMES_API_TOKEN ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: body, channel }),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(json?.error ?? `runtime_${res.status}`);
  return json.output_text ?? json.message ?? json.text ?? "I received it.";
}

export interface RuntimeEventPayload {
  account_id: string;
  employee_id: string;
  event_type: string;
  provider_id?: string | null;
  safe_summary: string;
  normalized_payload?: Record<string, unknown>;
  suggested_next_action?: string;
}

export async function wakeEmployeeForEvent(apiUrl: string, payload: RuntimeEventPayload): Promise<WorkEventDescriptor> {
  if (!apiUrl) throw new Error("employee runtime API missing");
  const path = process.env.HERMES_EVENT_PATH ?? "/events/work";
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HERMES_API_TOKEN ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "amtech.employee_event",
      payload,
      response_schema: "WorkEventDescriptor",
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { work_event_descriptor?: WorkEventDescriptor; descriptor?: WorkEventDescriptor; error?: string };
  if (!res.ok) throw new Error(json?.error ?? `runtime_${res.status}`);
  return assertWorkEventDescriptor(json.work_event_descriptor ?? json.descriptor as WorkEventDescriptor);
}
