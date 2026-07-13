"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import * as adminFixtures from "./fixtures";
import type {
  AdminAccountSummary,
  AdminDashboard,
  AdminEnvironmentReadiness,
  AdminReadinessReport,
  AdminSupportAction,
  AdminSupportActionResult,
} from "@amtech/shared";

type View = "dashboard" | "environment" | "accounts" | "provisioning" | "repairs" | "providers" | "billing";

const NAV: Array<{ id: View; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "environment", label: "Environment" },
  { id: "accounts", label: "Accounts" },
  { id: "provisioning", label: "Provisioning" },
  { id: "repairs", label: "Repairs" },
  { id: "providers", label: "Providers" },
  { id: "billing", label: "Billing" },
];

const DEFAULT_REASON = "Operator review for pilot readiness";
const UI_FIXTURE_MODE = process.env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";

async function adminFetch(path: string, opts: { method?: "GET" | "POST"; body?: unknown; reason?: string; adminToken?: string } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-AMTECH-Support-Reason": opts.reason ?? DEFAULT_REASON,
  };
  if (opts.adminToken) headers["X-AMTECH-Admin-Token"] = opts.adminToken;
  const res = await fetch(`/api/admin/${path.replace(/^\/+/, "")}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "admin_request_failed");
  return json;
}

export function AdminClient() {
  const [view, setView] = useState<View>("dashboard");
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [adminToken, setAdminToken] = useState("");
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [environment, setEnvironment] = useState<AdminEnvironmentReadiness | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<AdminReadinessReport | null>(null);
  const [status, setStatus] = useState("");

  async function loadDashboard(tokenOverride?: string) {
    if (UI_FIXTURE_MODE) {
      const fx = adminFixtures;
      setDashboard(fx.fixtureDashboard);
      setEnvironment(fx.fixtureEnvironment);
      setStatus("");
      return;
    }
    try {
      setStatus("");
      const nextDashboard = await adminFetch("dashboard", { reason, adminToken: tokenOverride ?? adminToken }) as AdminDashboard;
      setDashboard(nextDashboard);
      setEnvironment(nextDashboard.environment ?? null);
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  async function openAccount(accountId: string) {
    if (UI_FIXTURE_MODE) {
      const fx = adminFixtures;
      setSelectedAccount(accountId);
      setAccountDetail(fx.fixtureAccountDetail[accountId] ?? null);
      setSelectedEmployee(null);
      setEmployeeDetail(null);
      setReadiness(null);
      setView("accounts");
      return;
    }
    try {
      setSelectedAccount(accountId);
      setAccountDetail(await adminFetch(`accounts/${accountId}`, { reason, adminToken }));
      setSelectedEmployee(null);
      setEmployeeDetail(null);
      setReadiness(null);
      setView("accounts");
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  async function loadEnvironment() {
    if (UI_FIXTURE_MODE) {
      const fx = adminFixtures;
      setEnvironment(fx.fixtureEnvironment);
      return;
    }
    try {
      setEnvironment(await adminFetch("environment/readiness", { reason, adminToken }));
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  async function openEmployee(employeeId: string) {
    if (UI_FIXTURE_MODE) {
      const fx = adminFixtures;
      setSelectedEmployee(employeeId);
      setEmployeeDetail(fx.fixtureEmployeeDetail[employeeId] ?? null);
      setReadiness(fx.fixtureReadiness[employeeId] ?? null);
      return;
    }
    try {
      setSelectedEmployee(employeeId);
      setEmployeeDetail(await adminFetch(`employees/${employeeId}`, { reason, adminToken }));
      setReadiness(await adminFetch(`employees/${employeeId}/readiness`, { reason, adminToken }));
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  async function runAction(action: AdminSupportAction, input: Record<string, unknown> = {}) {
    if (!selectedAccount) return;
    if (UI_FIXTURE_MODE) {
      setStatus(`UI fixture mode: "${action.replace(/_/g, " ")}" simulated locally — no Manager call.`);
      return;
    }
    try {
      const result = await adminFetch("support-action", {
        method: "POST",
        reason,
        adminToken,
        body: {
          action,
          account_id: selectedAccount,
          employee_id: selectedEmployee ?? input.employee_id,
          reason,
          confirm: input.confirm,
          event_id: input.event_id,
          source: input.source,
          event_type: input.event_type,
          expires_at: input.expires_at,
        },
      }) as AdminSupportActionResult;
      setStatus(result.user_facing_summary_hint);
      if (selectedEmployee) await openEmployee(selectedEmployee);
      await openAccount(selectedAccount);
      await loadDashboard();
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("amtech_admin_token") ?? "";
    setAdminToken(stored);
    void loadDashboard(stored);
  }, []);

  function updateAdminToken(value: string) {
    setAdminToken(value);
    window.localStorage.setItem("amtech_admin_token", value);
  }

  const accounts = dashboard?.accounts ?? [];
  const selectedAccountSummary = useMemo(
    () => accounts.find((a) => a.id === selectedAccount) ?? null,
    [accounts, selectedAccount],
  );

  return (
    <main className="admin-root">
      <style>{CSS}</style>
      <aside className="admin-rail">
        <div className="admin-brand">
          <strong>AMTECH<span aria-hidden className="admin-dot">.</span> ADMIN</strong>
          <span>Internal operations</span>
        </div>
        <nav>
          {NAV.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <label className="admin-reason">
          <span>Support reason</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <label className="admin-reason">
          <span>Admin token</span>
          <input type="password" value={adminToken} onChange={(e) => updateAdminToken(e.target.value)} />
        </label>
      </aside>

      <section className="admin-main">
        <header className="admin-top">
          <div>
            <p>Operator Console</p>
            <h1>{title(view, selectedAccountSummary)}</h1>
          </div>
          <button onClick={() => void loadDashboard()}>Refresh</button>
        </header>
        {status ? <div className="admin-banner">{status}</div> : null}

        {view === "dashboard" ? <Dashboard dashboard={dashboard} onOpenAccount={openAccount} /> : null}
        {view === "environment" ? <Environment readiness={environment} onRefresh={loadEnvironment} /> : null}
        {view === "accounts" ? (
          <Accounts
            accounts={accounts}
            selectedAccount={selectedAccount}
            accountDetail={accountDetail}
            employeeDetail={employeeDetail}
            readiness={readiness}
            onOpenAccount={openAccount}
            onOpenEmployee={openEmployee}
            onAction={runAction}
          />
        ) : null}
        {view === "provisioning" ? <Queue title="Provisioning" rows={accountDetail?.provisioning ?? []} /> : null}
        {view === "repairs" ? <Queue title="Repairs" rows={accountDetail?.repairs ?? []} /> : null}
        {view === "providers" ? <Providers detail={accountDetail} /> : null}
        {view === "billing" ? <Billing detail={accountDetail} /> : null}
      </section>
    </main>
  );
}

function Environment({ readiness, onRefresh }: { readiness: AdminEnvironmentReadiness | null; onRefresh: () => Promise<void> }) {
  if (!readiness) {
    return <Panel title="Production environment"><button onClick={() => void onRefresh()}>Load environment readiness</button></Panel>;
  }
  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Status" value={readiness.status === "pass" ? 1 : 0} tone={readiness.status === "pass" ? "good" : "warn"} />
        <Metric label="Checks" value={readiness.checks.length} />
        <Metric label="Failures" value={readiness.checks.filter((c) => c.status === "fail").length} tone={readiness.checks.some((c) => c.status === "fail") ? "warn" : "good"} />
        <Metric label="Missing" value={readiness.checks.filter((c) => c.status === "skipped").length} tone={readiness.checks.some((c) => c.status === "skipped") ? "warn" : "good"} />
      </div>
      <Panel title="Environment">
        <Key label="Proof tier" value={readiness.proof_tier} />
        <Key label="Environment" value={readiness.environment_name} />
        <Key label="Domain" value={readiness.public_domain ?? "unknown"} />
        <Key label="Network" value={readiness.network_name ?? "unknown"} />
        <button onClick={() => void onRefresh()}>Refresh environment</button>
      </Panel>
      <Panel title="Production checks">
        {readiness.checks.map((c) => (
          <div key={c.key} className="check">
            <strong>{c.label}</strong>
            <span className={`pill ${c.status === "skipped" ? "unknown" : c.status}`}>{c.status}</span>
            <p>{c.detail}</p>
            {c.proof_path ? <p className="muted">{c.proof_path} · {c.checked_at ?? "unknown time"}</p> : null}
          </div>
        ))}
      </Panel>
      <Queue title="Latest proof summaries" rows={Object.entries(readiness.latest_proofs).map(([kind, proof]) => ({ kind, ...proof }))} />
    </div>
  );
}

function Dashboard({ dashboard, onOpenAccount }: { dashboard: AdminDashboard | null; onOpenAccount: (id: string) => void }) {
  if (!dashboard) return <Empty title="Loading dashboard" />;
  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Accounts" value={dashboard.totals.accounts} />
        <Metric label="Employees" value={dashboard.totals.employees} />
        <Metric label="Degraded" value={dashboard.totals.unhealthy_employees} tone={dashboard.totals.unhealthy_employees ? "warn" : "good"} />
        <Metric label="Repairs" value={dashboard.totals.repair_items} tone={dashboard.totals.repair_items ? "warn" : "good"} />
      </div>
      <Panel title="Readiness warnings">
        {dashboard.readiness_warnings.map((w) => <p key={w} className="muted">{w}</p>)}
      </Panel>
      <Panel title="Accounts needing attention">
        {dashboard.accounts.map((a) => (
          <button key={a.id} className="row" onClick={() => onOpenAccount(a.id)}>
            <strong>{a.display_name || a.id}</strong>
            <span>{a.health} · {a.employee_count} employee(s) · {a.pending_approvals} approvals · {a.repair_items} repairs</span>
          </button>
        ))}
      </Panel>
    </div>
  );
}

function Accounts(props: {
  accounts: AdminAccountSummary[];
  selectedAccount: string | null;
  accountDetail: any | null;
  employeeDetail: any | null;
  readiness: AdminReadinessReport | null;
  onOpenAccount: (id: string) => void;
  onOpenEmployee: (id: string) => void;
  onAction: (action: AdminSupportAction, input?: Record<string, unknown>) => void;
}) {
  return (
    <div className="admin-split">
      <Panel title="Accounts">
        {props.accounts.map((a) => (
          <button key={a.id} className={`row ${props.selectedAccount === a.id ? "active" : ""}`} onClick={() => props.onOpenAccount(a.id)}>
            <strong>{a.display_name || a.id}</strong>
            <span>{a.account_state} · {a.billing_state} · {a.health}</span>
          </button>
        ))}
      </Panel>
      <div className="stack">
        {!props.accountDetail ? <Empty title="Select an account" /> : (
          <>
            <Panel title="Account overview">
              <Key label="Account" value={props.accountDetail.account?.display_name ?? props.accountDetail.account?.id} />
              <Key label="State" value={props.accountDetail.account?.account_state ?? props.accountDetail.account?.status} />
              <Key label="Billing" value={props.accountDetail.account?.billing_status ?? "free_mvp"} />
              <Key label="Estimated cost" value={String(props.accountDetail.metering?.estimated_cost_cents ?? 0)} />
            </Panel>
            <Panel title="Employees">
              {(props.accountDetail.employees ?? []).map((e: any) => (
                <button key={e.id} className="row" onClick={() => props.onOpenEmployee(e.id)}>
                  <strong>{e.name || e.id}</strong>
                  <span>{e.status} · runtime {e.runtime_health} · {e.pending_approvals} approvals · {e.repair_items} repairs</span>
                </button>
              ))}
            </Panel>
            {props.employeeDetail ? <EmployeePanel detail={props.employeeDetail} readiness={props.readiness} onAction={props.onAction} /> : null}
            <Queue title="Recent events" rows={props.accountDetail.events ?? []} />
            <Queue title="Audit" rows={props.accountDetail.audit ?? []} />
          </>
        )}
      </div>
    </div>
  );
}

function EmployeePanel({ detail, readiness, onAction }: { detail: any; readiness: AdminReadinessReport | null; onAction: (action: AdminSupportAction, input?: Record<string, unknown>) => void }) {
  const employeeId = detail.employee?.id;
  return (
    <div className="stack">
      <Panel title="Employee operations">
        <Key label="Employee" value={detail.employee?.name ?? employeeId} />
        <Key label="Status" value={detail.employee?.status} />
        <Key label="Needs reprovision" value={String(Boolean(detail.employee?.needs_reprovision))} />
        <div className="button-row">
          <button onClick={() => onAction("suspend_employee")}>Suspend</button>
          <button onClick={() => onAction("resume_employee")}>Resume</button>
          <button onClick={() => onAction("mark_needs_reprovision")}>Needs reprovision</button>
          <button onClick={() => onAction("rotate_mcp_credential")}>Rotate MCP credential</button>
          <button onClick={() => onAction("disable_employee", { confirm: true })}>Disable</button>
        </div>
      </Panel>
      <Panel title="Trial readiness">
        {!readiness ? <p className="muted">Loading readiness report.</p> : readiness.checks.map((c) => (
          <div key={c.key} className="check">
            <strong>{c.label}</strong>
            <span className={`pill ${c.status}`}>{c.status}</span>
            <p>{c.detail}</p>
          </div>
        ))}
      </Panel>
      <Panel title="Materialization inspector">
        {(detail.materialization?.latest_envelopes ?? []).slice(0, 10).map((e: any) => (
          <div key={e.id} className="check">
            <strong>{e.title}</strong>
            <span>{e.kind} · {e.status ?? "open"}</span>
            <p>{e.owner_summary}</p>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Providers({ detail }: { detail: any | null }) {
  return <Queue title="Provider and connector status" rows={detail?.connectors ?? []} />;
}

function Billing({ detail }: { detail: any | null }) {
  return (
    <Panel title="Billing scaffold">
      <Key label="Account billing state" value={detail?.account?.billing_status ?? "Select an account"} />
      <Key label="Plan" value={detail?.account?.plan_key ?? "free_mvp"} />
      <Key label="Estimated cost cents" value={String(detail?.metering?.estimated_cost_cents ?? 0)} />
      <p className="muted">AMTECH billing is visible here only. It does not enforce paywalls in MVP.</p>
    </Panel>
  );
}

function Queue({ title, rows }: { title: string; rows: any[] }) {
  return (
    <Panel title={title}>
      {!rows.length ? <p className="muted">No rows loaded for this view.</p> : rows.slice(0, 40).map((row, idx) => (
        <pre key={row.id ?? idx}>{JSON.stringify(row, null, 2)}</pre>
      ))}
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function Empty({ title }: { title: string }) {
  return <div className="panel muted">{title}</div>;
}

function Metric({ label, value, tone = "quiet" }: { label: string; value: number; tone?: "good" | "warn" | "quiet" }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Key({ label, value }: { label: string; value?: string | null }) {
  return <div className="key"><span>{label}</span><strong>{value ?? "unknown"}</strong></div>;
}

function title(view: View, account: AdminAccountSummary | null): string {
  if (view === "accounts" && account) return account.display_name || account.id;
  return NAV.find((n) => n.id === view)?.label ?? "Admin";
}

function ownerSafeError(err: unknown): string {
  const msg = String((err as Error).message ?? err);
  if (msg === "admin_browser_token_required") return "Enter the configured admin token before loading operations data.";
  if (msg === "platform_user_required" || msg === "platform_user_denied") return "Admin access is not configured for this operator.";
  if (msg === "support_reason_required") return "Enter a support reason before opening customer data.";
  return msg.replace(/[_-]+/g, " ");
}

const CSS = `
  .admin-root { min-height: 100vh; display: grid; grid-template-columns: 240px minmax(0,1fr); background: #ffffff; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; --a-hair: rgba(10,10,10,0.10); --a-hair-strong: rgba(10,10,10,0.15); --a-muted: rgba(10,10,10,0.62); --a-red: #e11d2a; --a-wash: #f4f4f4; --a-mono: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; }
  .admin-rail { border-right: 1px solid var(--a-hair); padding: 18px; display: grid; align-content: start; gap: 18px; background: #ffffff; }
  .admin-brand strong, .admin-brand span { display: block; }
  .admin-brand strong { font-family: var(--a-mono); font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .admin-brand strong .admin-dot { display: inline; color: var(--a-red); }
  .admin-brand span, .muted { color: var(--a-muted); font-size: 12px; }
  .admin-brand span { font-family: var(--a-mono); font-size: 9px; letter-spacing: 0.09em; text-transform: uppercase; margin-top: 3px; }
  nav { display: grid; gap: 0; border: 1px solid var(--a-hair); }
  nav button { border: 0; border-bottom: 1px solid var(--a-hair); border-left: 3px solid transparent; background: #fff; padding: 6px 12px; text-align: left; cursor: pointer; font-size: 15px; font-weight: 500; color: var(--a-muted); line-height: 24px; }
  nav button:last-child { border-bottom: 0; }
  nav button:hover { background: var(--a-wash); color: #0a0a0a; }
  nav button.active { border-left-color: var(--a-red); background: var(--a-wash); color: #0a0a0a; font-weight: 600; }
  .button-row button, .admin-top button { border: 1px solid var(--a-hair-strong); background: #fff; padding: 0 12px; height: 30px; text-align: center; cursor: pointer; font-family: var(--a-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #0a0a0a; }
  .button-row button:hover, .admin-top button:hover { border-color: #0a0a0a; }
  .row.active { border-left: 3px solid var(--a-red); background: var(--a-wash); }
  .admin-reason { display: grid; gap: 6px; font-family: var(--a-mono); font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: var(--a-muted); }
  .admin-reason textarea, .admin-reason input { border: 1px solid var(--a-hair-strong); padding: 6px 9px; font-family: var(--a-mono); font-size: 12px; letter-spacing: 0; text-transform: none; outline: none; }
  .admin-reason textarea:focus, .admin-reason input:focus { border-color: #0a0a0a; }
  .admin-reason textarea { min-height: 78px; resize: vertical; }
  .admin-main { padding: 24px; display: grid; gap: 18px; align-content: start; }
  .admin-top { display: flex; justify-content: space-between; gap: 18px; align-items: end; border-bottom: 1px solid var(--a-hair); padding-bottom: 15px; }
  .admin-top p { margin: 0; font-family: var(--a-mono); color: var(--a-red); font-size: 9px; letter-spacing: 0.09em; text-transform: uppercase; font-weight: 500; }
  .admin-top h1 { margin: 3px 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
  .admin-banner { border: 1px solid var(--a-hair); border-left: 3px solid var(--a-red); background: #fff; padding: 9px 12px; font-size: 12px; }
  .stack { display: grid; gap: 15px; }
  .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--a-hair); border: 1px solid var(--a-hair); }
  .metric { background: #fff; padding: 15px; }
  .panel { border: 1px solid var(--a-hair); background: #fff; padding: 15px; }
  .metric span { font-family: var(--a-mono); color: var(--a-muted); font-size: 9px; letter-spacing: 0.09em; text-transform: uppercase; font-weight: 500; display: block; }
  .metric strong { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
  .metric.good strong { color: #0a0a0a; }
  .metric.warn strong { color: var(--a-red); }
  .panel h2 { margin: -15px -15px 12px; padding: 9px 12px; font-family: var(--a-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; border-bottom: 1px solid var(--a-hair); }
  .admin-split { display: grid; grid-template-columns: 330px minmax(0,1fr); gap: 15px; align-items: start; }
  .row { width: 100%; border: 1px solid var(--a-hair); border-left: 3px solid transparent; background: #fff; padding: 9px 12px; margin-bottom: -1px; text-align: left; display: grid; gap: 3px; cursor: pointer; font-family: inherit; color: #0a0a0a; }
  .row:hover { background: var(--a-wash); }
  .row strong { font-size: 15px; font-weight: 600; letter-spacing: -0.015em; }
  .row span, .check span { color: var(--a-muted); font-size: 12px; }
  .key { display: flex; justify-content: space-between; gap: 15px; border-bottom: 1px solid rgba(10,10,10,0.05); padding: 6px 0; font-size: 12px; }
  .key span { font-family: var(--a-mono); color: var(--a-muted); font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; line-height: 18px; }
  .key strong { font-weight: 600; }
  .button-row { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 12px; }
  .check { border-top: 1px solid rgba(10,10,10,0.05); padding: 9px 0; display: grid; gap: 3px; }
  .check strong { font-size: 12px; font-weight: 600; }
  .check p { margin: 0; color: var(--a-muted); font-size: 12px; }
  .pill { width: max-content; border: 1px solid var(--a-hair-strong); background: #fff; color: #0a0a0a; padding: 0 6px; font-family: var(--a-mono); font-size: 9px; line-height: 16px; height: 18px; display: inline-flex; align-items: center; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  .pill.pass { color: #0a0a0a; border-color: var(--a-hair-strong); }
  .pill.warn, .pill.unknown { color: var(--a-red); border-color: var(--a-red); background: #fff; }
  .pill.fail { color: #ffffff; border-color: var(--a-red); background: var(--a-red); }
  pre { overflow: auto; max-height: 220px; background: var(--a-wash); border: 1px solid var(--a-hair); padding: 9px; font-family: var(--a-mono); font-size: 12px; margin: 0 0 9px; }
  @media (max-width: 900px) {
    .admin-root, .admin-split { display: block; }
    .admin-rail { border-right: 0; border-bottom: 1px solid var(--a-hair); }
    nav { display: flex; overflow-x: auto; border: 1px solid var(--a-hair); }
    nav button { border-bottom: 0; border-left: 0; border-right: 1px solid var(--a-hair); white-space: nowrap; }
    .admin-main { padding: 15px; }
  }
`;
