"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type {
  AdminAccountSummary,
  AdminDashboard,
  AdminReadinessReport,
  AdminSupportAction,
  AdminSupportActionResult,
} from "@amtech/shared";

type View = "dashboard" | "accounts" | "provisioning" | "repairs" | "providers" | "billing";

const NAV: Array<{ id: View; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "accounts", label: "Accounts" },
  { id: "provisioning", label: "Provisioning" },
  { id: "repairs", label: "Repairs" },
  { id: "providers", label: "Providers" },
  { id: "billing", label: "Billing" },
];

const DEFAULT_REASON = "Operator review for pilot readiness";

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
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<AdminReadinessReport | null>(null);
  const [status, setStatus] = useState("");

  async function loadDashboard(tokenOverride?: string) {
    try {
      setStatus("");
      setDashboard(await adminFetch("dashboard", { reason, adminToken: tokenOverride ?? adminToken }));
    } catch (err) {
      setStatus(ownerSafeError(err));
    }
  }

  async function openAccount(accountId: string) {
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

  async function openEmployee(employeeId: string) {
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
          <strong>AMTECH Admin</strong>
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
  .admin-root { min-height: 100vh; display: grid; grid-template-columns: 240px minmax(0,1fr); background: #f5f6f3; color: #20231f; font-family: ui-sans-serif, system-ui, sans-serif; }
  .admin-rail { border-right: 1px solid #d9ddd2; padding: 18px; display: grid; align-content: start; gap: 18px; background: #ffffff; }
  .admin-brand strong, .admin-brand span { display: block; }
  .admin-brand span, .muted { color: #6d746a; font-size: 13px; }
  nav { display: grid; gap: 5px; }
  nav button, .button-row button, .admin-top button { border: 1px solid #d9ddd2; background: #fff; border-radius: 7px; padding: 9px 10px; text-align: left; cursor: pointer; }
  nav button.active, .row.active { border-color: #2f6f64; background: #e8f3ef; }
  .admin-reason { display: grid; gap: 6px; font-size: 12px; color: #6d746a; }
  .admin-reason textarea, .admin-reason input { border: 1px solid #d9ddd2; border-radius: 7px; padding: 8px; }
  .admin-reason textarea { min-height: 80px; resize: vertical; }
  .admin-main { padding: 22px; display: grid; gap: 16px; align-content: start; }
  .admin-top { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
  .admin-top p { margin: 0; color: #6d746a; font-size: 12px; text-transform: uppercase; font-weight: 700; }
  .admin-top h1 { margin: 3px 0 0; font-size: 28px; }
  .admin-banner { border: 1px solid #b88a2a; background: #fff3d7; border-radius: 7px; padding: 10px 12px; }
  .stack { display: grid; gap: 14px; }
  .metric-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
  .metric, .panel { border: 1px solid #d9ddd2; background: #fff; border-radius: 8px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .metric span { color: #6d746a; font-size: 12px; display: block; }
  .metric strong { font-size: 26px; }
  .metric.good strong { color: #24734f; }
  .metric.warn strong { color: #9a6a0a; }
  .panel h2 { margin: 0 0 12px; font-size: 16px; }
  .admin-split { display: grid; grid-template-columns: 330px minmax(0,1fr); gap: 14px; align-items: start; }
  .row { width: 100%; border: 1px solid #d9ddd2; border-radius: 7px; background: #fff; padding: 10px; margin-bottom: 8px; text-align: left; display: grid; gap: 4px; cursor: pointer; }
  .row span, .check span { color: #6d746a; font-size: 12px; }
  .key { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid #edf0ea; padding: 7px 0; font-size: 13px; }
  .key span { color: #6d746a; }
  .button-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .check { border-top: 1px solid #edf0ea; padding: 9px 0; display: grid; gap: 4px; }
  .check p { margin: 0; color: #444b42; font-size: 13px; }
  .pill { width: max-content; border-radius: 999px; padding: 2px 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; background: #eef0eb; }
  .pill.pass { color: #24734f; background: #e5f3eb; }
  .pill.warn, .pill.unknown { color: #80610c; background: #fff3d7; }
  .pill.fail { color: #a83226; background: #fde9e5; }
  pre { overflow: auto; max-height: 220px; background: #f5f6f3; border: 1px solid #e4e7df; border-radius: 7px; padding: 10px; font-size: 12px; }
  @media (max-width: 900px) {
    .admin-root, .admin-split { display: block; }
    .admin-rail { border-right: 0; border-bottom: 1px solid #d9ddd2; }
    nav { display: flex; overflow-x: auto; }
    .metric-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .admin-main { padding: 14px; }
  }
`;
