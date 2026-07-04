#!/usr/bin/env node
/**
 * Phase 4-core live employee proof hook.
 *
 * Env-gated by design. Without a live employee id and Manager env, it exits
 * skipped rather than manufacturing proof.
 */

const employeeId = process.env.SMOKE_EMPLOYEE_ID;
const manager = (process.env.MANAGER_BASE_URL || process.env.MANAGER_API_ORIGIN || "").replace(/\/$/, "");
const token = process.env.MANAGER_INTERNAL_TOKEN;

if (!employeeId || !manager || !token) {
  console.log(JSON.stringify({
    run: "run9-live-employee",
    status: "skipped",
    reason: "SMOKE_EMPLOYEE_ID, MANAGER_BASE_URL/MANAGER_API_ORIGIN, and MANAGER_INTERNAL_TOKEN are required",
  }, null, 2));
  process.exit(0);
}

const res = await fetch(`${manager}/manager/employee/${employeeId}/resources`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ owner_session_token: process.env.SMOKE_OWNER_SESSION_TOKEN || "" }),
});

console.log(JSON.stringify({
  run: "run9-live-employee",
  status: res.ok ? "ready_for_manual_live_steps" : "blocked",
  employee_id: employeeId,
  manager_status: res.status,
  next: [
    "curl Hermes /health and /v1/capabilities for the provisioned profile",
    "send owner SMS and capture inbound/reply SIDs",
    "drive verified Gmail Pub/Sub reply to ingestEvent -> claimed inbound event -> wake descriptor",
    "verify active web heartbeat routes delivery_decisions.chosen_channel=web, then expired presence routes SMS",
  ],
}, null, 2));
