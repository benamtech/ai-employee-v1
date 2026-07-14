/**
 * Admin console fixtures — UI-only representative data so the operator console
 * can be designed and browser-tested without Manager, Supabase, or credentials.
 * Mirrors the owner-fixture world (Sage @ Ferraro Grounds & Gardens) plus a
 * degraded second account so every health/billing/readiness state renders.
 * This is not acceptance proof for any admin behavior.
 */
import type { AdminDashboard, AdminEnvironmentReadiness, AdminReadinessReport } from "@amtech/shared";

const NOW = "2026-07-12T02:30:00.000Z";

export const fixtureEnvironment: AdminEnvironmentReadiness = {
  generated_at: NOW,
  status: "needs_proof",
  proof_tier: "local_mirror",
  environment_name: "ui-fixture",
  public_domain: "amtechai.com",
  network_name: "amtech_runtime",
  checks: [
    { key: "compose_core", label: "Compose core (manager/web/caddy)", status: "pass", detail: "All three services healthy on the local mirror.", proof_path: "infra/proofs/deploy-smoke.json", checked_at: NOW },
    { key: "employee_dns", label: "Employee container DNS", status: "pass", detail: "Caddy resolves employees by Docker DNS alias.", proof_path: "infra/proofs/caddy-proof.json", checked_at: NOW },
    { key: "public_tls", label: "Public DNS + TLS", status: "skipped", detail: "Wildcard DNS-01 path is designed; live zone proof not captured.", proof_path: null, checked_at: null },
    { key: "egress_policy", label: "Egress default-deny", status: "warn", detail: "Policy designed (dry run); --apply needs a root host.", proof_path: "infra/proofs/egress-policy.json", checked_at: NOW },
  ],
  latest_proofs: {
    deploy_smoke: { kind: "deploy-smoke", status: "pass", proof_tier: "local_mirror", checked_at: NOW, proof_path: "infra/proofs/deploy-smoke.json" },
    capacity: { kind: "capacity", status: "pass_tier_5", proof_tier: "local_mirror", checked_at: NOW, proof_path: "infra/proofs/capacity.json" },
  },
};

export const fixtureDashboard: AdminDashboard = {
  generated_at: NOW,
  accounts: [
    {
      id: "acct_fixture_ferraro",
      display_name: "Ferraro Grounds & Gardens",
      owner_email: "o***@f***.com",
      created_at: "2026-07-05T14:00:00.000Z",
      account_state: "trial",
      billing_state: "free_mvp",
      health: "green",
      employee_count: 1,
      pending_approvals: 2,
      repair_items: 0,
      degraded_employees: 0,
    },
    {
      id: "acct_fixture_miller",
      display_name: "Miller Painting Co",
      owner_email: "j***@m***.com",
      created_at: "2026-07-08T09:30:00.000Z",
      account_state: "trial",
      billing_state: "free_mvp",
      health: "yellow",
      employee_count: 1,
      pending_approvals: 1,
      repair_items: 2,
      degraded_employees: 1,
    },
  ],
  totals: { accounts: 2, employees: 2, unhealthy_employees: 1, pending_approvals: 3, repair_items: 2, estimated_month_cost_cents: 12600 },
  readiness_warnings: [
    "1 employee reports a degraded payments connection (Miller Painting Co).",
    "Public DNS/TLS proof not yet captured for this environment.",
  ],
  environment: fixtureEnvironment,
};

export const fixtureAccountDetail: Record<string, any> = {
  acct_fixture_ferraro: {
    account: { id: "acct_fixture_ferraro", display_name: "Ferraro Grounds & Gardens", account_state: "trial", billing_status: "free_mvp", plan_key: "free_mvp" },
    metering: { estimated_cost_cents: 8400 },
    employees: [
      { id: "emp_fixture_sage", name: "Sage", status: "live", runtime_health: "healthy", pending_approvals: 2, repair_items: 0 },
    ],
    provisioning: [
      { id: "prov_01", employee_id: "emp_fixture_sage", state: "completed", backend: "docker", finished_at: "2026-07-05T14:12:00.000Z" },
    ],
    repairs: [],
    connectors: [
      { id: "conn_gmail_01", connector_key: "gmail", provider: "gmail", status: "connected", external_ref: "f***@gmail.com" },
      { id: "conn_stripe_01", connector_key: "stripe", provider: "stripe", status: "connected", external_ref: "acct_1***" },
    ],
    events: [
      { id: "evt_01", event_type: "gmail.reply_received", status: "processed", created_at: "2026-07-11T22:04:00.000Z" },
      { id: "evt_02", event_type: "manager.daily_brief", status: "delivered", created_at: "2026-07-11T13:00:00.000Z" },
    ],
    audit: [
      { id: "aud_01", actor: "employee", action: "tool:create_estimate_artifact", created_at: "2026-07-11T21:40:00.000Z" },
      { id: "aud_02", actor: "manager", action: "approval:created", created_at: "2026-07-11T21:41:00.000Z" },
    ],
  },
  acct_fixture_miller: {
    account: { id: "acct_fixture_miller", display_name: "Miller Painting Co", account_state: "trial", billing_status: "free_mvp", plan_key: "free_mvp" },
    metering: { estimated_cost_cents: 4200 },
    employees: [
      { id: "emp_fixture_ridge", name: "Ridge", status: "live", runtime_health: "degraded", pending_approvals: 1, repair_items: 2 },
    ],
    provisioning: [
      { id: "prov_02", employee_id: "emp_fixture_ridge", state: "completed", backend: "docker", finished_at: "2026-07-08T09:45:00.000Z" },
    ],
    repairs: [
      { id: "rep_01", kind: "connector_reauth", source: "stripe", state: "open", created_at: "2026-07-11T08:00:00.000Z" },
      { id: "rep_02", kind: "event_redelivery", source: "gmail", state: "open", created_at: "2026-07-11T09:15:00.000Z" },
    ],
    connectors: [
      { id: "conn_gmail_02", connector_key: "gmail", provider: "gmail", status: "connected", external_ref: "m***@gmail.com" },
      { id: "conn_stripe_02", connector_key: "stripe", provider: "stripe", status: "needs_reauth", external_ref: "acct_2***" },
    ],
    events: [
      { id: "evt_03", event_type: "stripe.webhook_failed", status: "failed", created_at: "2026-07-11T08:00:00.000Z" },
    ],
    audit: [
      { id: "aud_03", actor: "manager", action: "repair:opened", created_at: "2026-07-11T08:00:05.000Z" },
    ],
  },
};

export const fixtureEmployeeDetail: Record<string, any> = {
  emp_fixture_sage: {
    employee: { id: "emp_fixture_sage", name: "Sage", status: "live", needs_reprovision: false },
    materialization: {
      latest_envelopes: [
        { id: "env_01", title: "Estimate ready for Jane", kind: "approval", status: "open", owner_summary: "Estimate email staged; waiting on the owner." },
        { id: "env_02", title: "Deposit invoice drafted", kind: "invoice", status: "open", owner_summary: "A $1,260 deposit invoice is ready for Ridgeview HOA." },
        { id: "env_03", title: "Daily brief", kind: "message", status: "delivered", owner_summary: "Quiet day; two decisions waiting." },
      ],
    },
  },
  emp_fixture_ridge: {
    employee: { id: "emp_fixture_ridge", name: "Ridge", status: "live", needs_reprovision: true },
    materialization: {
      latest_envelopes: [
        { id: "env_04", title: "Payments need attention", kind: "connector", status: "open", owner_summary: "Stripe needs reconnection before live invoices." },
      ],
    },
  },
};

export const fixtureReadiness: Record<string, AdminReadinessReport> = {
  emp_fixture_sage: {
    account_id: "acct_fixture_ferraro",
    employee_id: "emp_fixture_sage",
    generated_at: NOW,
    status: "needs_review",
    checks: [
      { key: "runtime", label: "Runtime reachable", status: "pass", detail: "Container healthy; last check 62s ago." },
      { key: "connectors", label: "Connected accounts", status: "pass", detail: "Email and payments connected." },
      { key: "approvals", label: "Approval gate", status: "pass", detail: "2 gated items waiting on the owner — gate is holding." },
      { key: "live_proof", label: "Live provider proof", status: "unknown", detail: "No live tool-loop proof captured in fixture mode." },
    ],
  },
  emp_fixture_ridge: {
    account_id: "acct_fixture_miller",
    employee_id: "emp_fixture_ridge",
    generated_at: NOW,
    status: "blocked",
    checks: [
      { key: "runtime", label: "Runtime reachable", status: "pass", detail: "Container healthy." },
      { key: "connectors", label: "Connected accounts", status: "fail", detail: "Stripe token expired; reauth required." },
      { key: "repairs", label: "Open repairs", status: "warn", detail: "2 repair items open (reauth, redelivery)." },
    ],
  },
};
