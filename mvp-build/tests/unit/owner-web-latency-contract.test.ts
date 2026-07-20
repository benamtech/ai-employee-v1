import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("owner web latency and next-generation client contract", () => {
  it("defaults to a streaming Talk surface and mounts the heavy workspace only in Operate mode", async () => {
    const source = await readFile("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx", "utf8");
    expect(source).toContain('useState<PrimaryMode>("talk")');
    expect(source).toContain('fixtureMode || mode !== "talk"');
    expect(source).toContain('mode === "operate" ?');
    expect(source).toContain("<AgentSurface employeeId={employeeId} fixtureMode={fixtureMode} />");
    expect(source).toContain('source.addEventListener("assistant_delta"');
    expect(source).toContain('source.addEventListener("run_completed"');
    expect(source).toContain("installOwnerSnapshot(payload, employeeId)");
    expect(source).toContain('validateScopedFrame(payload, scope, kind)');
  });

  it("shows owner intent optimistically, streams first words, and does not lock the composer for a full Hermes run", async () => {
    const source = await readFile("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx", "utf8");
    const optimistic = source.indexOf("setPending((current) => [...current");
    const dispatch = source.indexOf("await fetch(`/api/employee/${employeeId}/message`");
    expect(optimistic).toBeGreaterThan(-1);
    expect(dispatch).toBeGreaterThan(optimistic);
    expect(source).toContain("setInput(\"\")");
    expect(source).toContain("window.setTimeout(() => setDispatching(false), 1_200)");
    expect(source).toContain('event.key === "Enter" && !event.shiftKey');
    expect(source).toContain('text: `${previous?.text ?? ""}${delta}`');
    expect(source).toContain("Queued safely. The employee will answer in order.");
  });

  it("forwards the exact installed assignment authority through the private Next proxy", async () => {
    const source = await readFile("apps/web/app/api/employee/[employeeId]/message/route.ts", "utf8");
    expect(source).toContain("protocol_assignment_id: body.protocol_assignment_id");
    expect(source).toContain("protocol_authority_version: body.protocol_authority_version");
    expect(source).toContain('cookieStore.get("amtech_owner_session")');
  });

  it("streams queued turns through the same scoped delta protocol instead of the disabled legacy bus", async () => {
    const source = await readFile("apps/manager/src/lib/turn-drain.ts", "utf8");
    expect(source).toContain("executeHermesTurnLive");
    expect(source).toContain("const progressScope: ProgressScope | null");
    expect(source).toContain('kind: "assistant_delta"');
    expect(source).toContain('kind: "run_completed"');
    expect(source).toContain("assignment_id: assignmentId");
    expect(source).toContain("account_id: accountId");
    expect(source).not.toContain("publishProgress(job.employee_id");
    expect(source).not.toContain("publishProgress(employeeId");
  });
});
