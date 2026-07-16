import Link from "next/link";
import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../api/_lib/manager";

export const metadata = {
  title: "Dashboard - AMTECH",
  description: "Open and manage your AMTECH AI employees.",
};

type DashboardEmployee = {
  id: string;
  name?: string | null;
  status?: string | null;
  profile_package_key?: string | null;
  open_route?: string | null;
  runtime_endpoint?: {
    sms_number_e164?: string | null;
    public_web_route?: string | null;
    backend_type?: string | null;
    gateway_port?: number | null;
  } | null;
};

async function loadDashboard() {
  const token = (await cookies()).get("amtech_owner_session")?.value;
  if (!token) return { status: 401, data: null as any };
  const res = await managerPost(MANAGER_API.ownerDashboard, { owner_session_token: token });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export default async function DashboardPage() {
  const { status, data } = await loadDashboard();
  const employees = (data?.employees ?? []) as DashboardEmployee[];
  const accountName = data?.account?.display_name ?? "Your account";

  return (
    <main className="dash-root">
      <style>{DASHBOARD_CSS}</style>
      <header className="dash-bar">
        <Link className="dash-logo" href="/">AMTECH<span>.</span></Link>
        <nav className="dash-nav" aria-label="Owner navigation">
          <Link href="/create-ai-employee">New employee</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="dash-head">
        <p className="dash-kicker">Owner dashboard</p>
        <h1>{accountName}</h1>
        <p>Open an employee, start another one, and confirm each runtime is tied to the right account.</p>
      </section>

      {status === 401 ? (
        <section className="dash-empty">
          <h2>Sign in from onboarding or a secure employee link.</h2>
          <p>The owner dashboard uses the production owner session cookie. Dev-login and fixture paths do not count for launch proof.</p>
          <Link className="dash-btn" href="/create-ai-employee">Create an employee</Link>
        </section>
      ) : null}

      {status !== 401 ? (
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Employees</h2>
            <Link className="dash-btn" href="/create-ai-employee">Create another</Link>
          </div>
          {employees.length ? (
            <div className="dash-list">
              {employees.map((employee) => {
                const href = employee.open_route ?? `/agent/${employee.id}`;
                return (
                  <article className="dash-employee" key={employee.id}>
                    <div>
                      <h3>{employee.name ?? "AI employee"}</h3>
                      <p>{employee.profile_package_key ?? "general employee"} / {employee.id}</p>
                    </div>
                    <dl>
                      <div><dt>Status</dt><dd>{employee.status ?? "unknown"}</dd></div>
                      <div><dt>SMS</dt><dd>{employee.runtime_endpoint?.sms_number_e164 ?? "not assigned"}</dd></div>
                      <div><dt>Runtime</dt><dd>{employee.runtime_endpoint?.backend_type ?? "pending"}</dd></div>
                    </dl>
                    <Link className="dash-open" href={href}>Open</Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty compact">
              <h2>No employees yet.</h2>
              <p>Create the first employee from a real onboarding session.</p>
              <Link className="dash-btn" href="/create-ai-employee">Create employee</Link>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

const DASHBOARD_CSS = `
  .dash-root { min-height: 100vh; background: #fff; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
  .dash-bar { height: 60px; padding: 0 24px; border-bottom: 1px solid rgba(10,10,10,.1); display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .dash-logo { font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 15px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #0a0a0a; text-decoration: none; }
  .dash-logo span { color: #e11d2a; }
  .dash-nav { display: flex; align-items: center; gap: 16px; font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .dash-nav a { color: rgba(10,10,10,.68); text-decoration: none; }
  .dash-nav a:hover { color: #e11d2a; }
  .dash-head { max-width: 980px; margin: 0 auto; padding: 48px 24px 28px; }
  .dash-kicker { margin: 0 0 10px; font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 11px; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; color: #e11d2a; }
  .dash-head h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1; font-weight: 900; }
  .dash-head p { max-width: 620px; margin: 16px 0 0; font-size: 17px; line-height: 1.55; color: rgba(10,10,10,.64); }
  .dash-panel, .dash-empty { max-width: 980px; margin: 0 auto 48px; padding: 0 24px; }
  .dash-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .dash-panel-head h2, .dash-empty h2 { margin: 0; font-size: 20px; font-weight: 850; }
  .dash-btn, .dash-open { height: 42px; padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; background: #0a0a0a; color: #fff; text-decoration: none; font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .dash-btn:hover, .dash-open:hover { background: #e11d2a; }
  .dash-list { border-top: 1px solid rgba(10,10,10,.12); }
  .dash-employee { min-height: 104px; border-bottom: 1px solid rgba(10,10,10,.12); display: grid; grid-template-columns: minmax(180px, 1.4fr) minmax(260px, 2fr) auto; gap: 18px; align-items: center; padding: 18px 0; }
  .dash-employee h3 { margin: 0; font-size: 18px; font-weight: 850; }
  .dash-employee p { margin: 6px 0 0; font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 11px; color: rgba(10,10,10,.56); }
  .dash-employee dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .dash-employee dt { font-family: var(--font-plex-mono), "IBM Plex Mono", ui-monospace, monospace; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(10,10,10,.5); }
  .dash-employee dd { margin: 4px 0 0; font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
  .dash-empty { border: 1px solid rgba(10,10,10,.12); padding: 28px 24px; }
  .dash-empty.compact { margin: 0; }
  .dash-empty p { max-width: 620px; margin: 10px 0 18px; color: rgba(10,10,10,.62); line-height: 1.55; }
  @media (max-width: 760px) {
    .dash-bar { align-items: flex-start; height: auto; padding: 16px 20px; flex-direction: column; }
    .dash-head { padding: 36px 20px 24px; }
    .dash-panel, .dash-empty { padding-left: 20px; padding-right: 20px; }
    .dash-panel-head { align-items: flex-start; flex-direction: column; }
    .dash-employee { grid-template-columns: 1fr; }
    .dash-employee dl { grid-template-columns: 1fr; }
    .dash-open { width: 100%; }
  }
`;
