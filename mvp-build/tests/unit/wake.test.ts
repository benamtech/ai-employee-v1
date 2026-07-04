import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { wakeEmployeeForDescriptor } from "../../apps/manager/src/lib/wake";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => { process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key"; });
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
  vi.restoreAllMocks();
});

const seededDb = () => makeFakeDb({
  employees: [{ id: "emp_1", account_id: "acct_1" }],
  runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1" }],
  runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
}, { uniques: SCHEMA_UNIQUES });

const payload = {
  account_id: "acct_1", employee_id: "emp_1", source_event_id: "evt_1",
  event_type: "gmail.reply_received", provider_id: "gmsg_1",
  safe_summary: "A customer replied.", normalized_payload: { snippet: "hi" },
};

function stubChat(text: string) {
  vi.stubGlobal("fetch", routerFetch([
    { match: "/v1/capabilities", body: { features: { session_chat: true } } },
    { match: "/chat", body: { text } },
    { match: "/api/sessions", body: { id: "sess_1" } },
  ]));
}

describe("wake — descriptor production", () => {
  it("parses a fenced json block and stamps owner identity + proof", async () => {
    stubChat("Here you go:\n```json\n{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\",\"account_id\":\"HACKED\"}\n```");
    const d = await wakeEmployeeForDescriptor(seededDb().asClient(), payload);
    expect(d.move).toBe("notify");
    expect(d.account_id).toBe("acct_1"); // model's HACKED value overridden by Manager stamp
    expect(d.employee_id).toBe("emp_1");
    expect(d.source_event_id).toBe("evt_1");
    expect(d.proof?.provider_id).toBe("gmsg_1");
  });

  it("parses bare-brace json without a fence", async () => {
    stubChat("{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\"}");
    const d = await wakeEmployeeForDescriptor(seededDb().asClient(), payload);
    expect(d.title).toBe("Replied");
  });

  it("retries once then throws wake_descriptor_invalid on malformed output", async () => {
    stubChat("```json\n{\"move\":\"notify\",\"title\":\"\",\"summary\":\"\"}\n```");
    await expect(wakeEmployeeForDescriptor(seededDb().asClient(), payload)).rejects.toThrow(/wake_descriptor_invalid/);
  });

  it("returns the stored descriptor on a duplicate wake (same source event)", async () => {
    const db = seededDb();
    stubChat("```json\n{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\"}\n```");
    const first = await wakeEmployeeForDescriptor(db.asClient(), payload);
    // Second wake for the same source event must not re-run the model; force a throw if it does.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("model should not be called on duplicate"); }));
    const second = await wakeEmployeeForDescriptor(db.asClient(), payload);
    expect(second.title).toBe(first.title);
  });
});
