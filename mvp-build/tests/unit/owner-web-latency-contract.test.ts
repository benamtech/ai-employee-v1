import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("owner web latency and next-generation client contract", () => {
  it("defaults to a streaming Talk surface and mounts the heavy workspace only in Operate mode", async () => {
    const shell = await readFile("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx", "utf8");
    const controller = await readFile("apps/web/app/agent/[employeeId]/owner-projection-controller.ts", "utf8");
    expect(shell).toContain('useState<PrimaryMode>("talk")');
    expect(shell).toContain('fixtureMode || mode !== "talk"');
    expect(shell).toContain('mode === "operate" ?');
    expect(shell).toContain("<AgentSurface");
    expect(shell).toContain("openOwnerProjectionController");
    expect(shell).toContain('eventKinds: ["assistant_delta", "work_progress", "run_completed", "approval_update"]');
    expect(controller).toContain("new EventSource");
    expect(controller).toContain('source.addEventListener("snapshot"');
    expect(controller).toContain("installOwnerSnapshot(payload, options.employeeId)");
    expect(controller).toContain("validateScopedFrame(payload, scope, kind)");
  });

  it("shows owner intent optimistically, streams first words, and does not lock the composer for a full Hermes run", async () => {
    const shell = await readFile("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx", "utf8");
    const optimistic = shell.indexOf("setPending((current) => [...current");
    const dispatch = shell.indexOf("await fetch(`/api/employee/${employeeId}/message`");
    expect(optimistic).toBeGreaterThan(-1);
    expect(dispatch).toBeGreaterThan(optimistic);
    expect(shell).toContain("setInput(\"\")");
    expect(shell).toContain("window.setTimeout(() => setDispatching(false), 1_200)");
    expect(shell).toContain('event.key === "Enter" && !event.shiftKey');
    expect(shell).toContain('text: (previous?.text ?? "") + delta');
    expect(shell).toContain("Queued safely. The employee will answer in order.");
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
