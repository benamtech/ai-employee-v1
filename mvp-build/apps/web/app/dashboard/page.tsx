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

function readable(value?: string | null): string {
  return String(value ?? "AI employee")
    .replace(/[_:-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function DashboardPage() {
  const { status, data } = await loadDashboard();
  const employees = (data?.employees ?? []) as DashboardEmployee[];
  const accountName = data?.account?.display_name ?? "Your account";

  return (
    <main className="dash-root">
      <style>{DASHBOARD_CSS}</style>
      <header className="dash-bar">
        <Link className="dash-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
        <nav className="dash-nav" aria-label="Owner navigation">
          <Link href="/dashboard" aria-current="page">Dashboard</Link>
          <Link className="dash-nav-primary" href="/create-ai-employee?account=current">Create employee</Link>
        </nav>
      </header>

      <section className="dash-head">
        <p className="dash-kicker">Owner workspace</p>
        <h1>{accountName}</h1>
        <p>Open the exact employee carrying the work. Each employee keeps a separate runtime, assignment, context, approvals, and evidence trail.</p>
      </section>

      {status === 401 ? (
        <section className="dash-empty" aria-labelledby="dashboard-sign-in">
          <h2 id="dashboard-sign-in">Sign in to open your employees.</h2>
          <p>The dashboard uses the production owner session. Development login and fixture routes do not count as production evidence.</p>
          <Link className="dash-btn" href="/login?next=/dashboard">Sign in</Link>
        </section>
      ) : null}

      {status !== 401 ? (
        <section className="dash-panel" aria-labelledby="dashboard-employees">
          <div className="dash-panel-head">
            <div>
              <p>Workforce</p>
              <h2 id="dashboard-employees">Authorized employees</h2>
            </div>
            <Link className="dash-btn" href="/create-ai-employee?account=current">Create another</Link>
          </div>
          {employees.length ? (
            <div className="dash-list">
              {employees.map((employee) => {
                const href = employee.open_route ?? `/agent/${employee.id}`;
                const employeeStatus = readable(employee.status ?? "unknown");
                return (
                  <article className="dash-employee" key={employee.id}>
                    <div className="dash-employee-identity">
                      <span className={`dash-status ${String(employee.status ?? "unknown").toLowerCase()}`}>{employeeStatus}</span>
                      <h3>{employee.name ?? "AI employee"}</h3>
                      <p>{readable(employee.profile_package_key ?? "General employee")}</p>
                    </div>
                    <dl>
                      <div><dt>Phone</dt><dd>{employee.runtime_endpoint?.sms_number_e164 ?? "Not assigned"}</dd></div>
                      <div><dt>Runtime</dt><dd>{readable(employee.runtime_endpoint?.backend_type ?? "Pending")}</dd></div>
                      <div><dt>Surface</dt><dd>{employee.runtime_endpoint?.public_web_route ? "Available" : "Owner only"}</dd></div>
                    </dl>
                    <Link className="dash-open" href={href} aria-label={`Open ${employee.name ?? "AI employee"}`}>Open employee</Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty compact">
              <h2>No employee is assigned yet.</h2>
              <p>Create the first employee through verified onboarding. AMTECH will form the account, employee, assignment, runtime, and owner authority together.</p>
              <Link className="dash-btn" href="/create-ai-employee">Create employee</Link>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

const DASHBOARD_CSS = `
  .dash-root {
    min-height: 100vh;
    color: #111111;
    background:
      radial-gradient(circle at 8% 0%, rgba(37, 99, 235, 0.08), transparent 32rem),
      radial-gradient(circle at 96% 18%, rgba(225, 29, 42, 0.05), transparent 28rem),
      #f7f9fc;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .dash-bar {
    min-height: 72px;
    padding: 12px 24px;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(20px);
  }
  .dash-logo {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    color: #111111;
    font-size: 14px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-decoration: none;
  }
  .dash-logo span { color: #e11d2a; }
  .dash-nav { display: flex; align-items: center; gap: 8px; }
  .dash-nav a {
    min-height: 48px;
    padding: 0 16px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(17, 17, 17, 0.68);
    font-size: 13px;
    font-weight: 750;
    text-decoration: none;
  }
  .dash-nav a:hover { color: #111111; background: rgba(37, 99, 235, 0.07); }
  .dash-nav .dash-nav-primary { color: #ffffff; background: #111111; }
  .dash-nav .dash-nav-primary:hover { color: #ffffff; background: #e11d2a; }
  .dash-head { max-width: 1080px; margin: 0 auto; padding: 64px 24px 32px; }
  .dash-kicker,
  .dash-panel-head p {
    margin: 0 0 10px;
    color: #e11d2a;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }
  .dash-head h1 { margin: 0; font-size: clamp(2.4rem, 6vw, 4.4rem); line-height: 0.98; letter-spacing: -0.055em; font-weight: 900; }
  .dash-head > p:last-child { max-width: 720px; margin: 20px 0 0; color: rgba(17, 17, 17, 0.66); font-size: 17px; line-height: 1.6; }
  .dash-panel,
  .dash-empty { max-width: 1080px; margin: 0 auto 56px; }
  .dash-panel { padding: 0 24px; }
  .dash-panel-head {
    margin-bottom: 16px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }
  .dash-panel-head h2,
  .dash-empty h2 { margin: 0; font-size: 24px; line-height: 1.15; font-weight: 850; letter-spacing: -0.025em; }
  .dash-btn,
  .dash-open {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    background: #111111;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }
  .dash-btn:hover,
  .dash-open:hover { background: #e11d2a; }
  .dash-list { display: grid; gap: 12px; }
  .dash-employee {
    min-height: 132px;
    border: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 20px;
    display: grid;
    grid-template-columns: minmax(220px, 1.2fr) minmax(330px, 1.8fr) auto;
    gap: 24px;
    align-items: center;
    padding: 22px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 34px rgba(17, 17, 17, 0.06);
  }
  .dash-employee-identity { min-width: 0; }
  .dash-status {
    min-height: 28px;
    width: fit-content;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    color: #14532d;
    background: rgba(22, 138, 87, 0.12);
    font-size: 11px;
    font-weight: 800;
  }
  .dash-status.pending,
  .dash-status.provisioning,
  .dash-status.unknown { color: #1d4ed8; background: rgba(37, 99, 235, 0.10); }
  .dash-status.failed,
  .dash-status.unhealthy { color: #991b1b; background: rgba(225, 29, 42, 0.10); }
  .dash-employee h3 { margin: 12px 0 0; font-size: 20px; font-weight: 850; letter-spacing: -0.02em; }
  .dash-employee p { margin: 5px 0 0; color: rgba(17, 17, 17, 0.58); font-size: 13px; }
  .dash-employee dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .dash-employee dt { color: rgba(17, 17, 17, 0.48); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .dash-employee dd { margin: 6px 0 0; font-size: 13px; font-weight: 750; overflow-wrap: anywhere; }
  .dash-empty {
    border: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 20px;
    padding: 30px 28px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 34px rgba(17, 17, 17, 0.06);
  }
  .dash-empty.compact { margin: 0; }
  .dash-empty p { max-width: 680px; margin: 12px 0 20px; color: rgba(17, 17, 17, 0.64); line-height: 1.6; }
  .dash-root a:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.42); outline-offset: 3px; }
  @media (max-width: 820px) {
    .dash-bar { align-items: flex-start; flex-direction: column; padding: 12px 20px; }
    .dash-nav { width: 100%; }
    .dash-nav a { flex: 1; }
    .dash-head { padding: 48px 20px 28px; }
    .dash-panel,
    .dash-empty { margin-left: 20px; margin-right: 20px; }
    .dash-panel { padding: 0; }
    .dash-panel-head { align-items: flex-start; flex-direction: column; }
    .dash-employee { grid-template-columns: 1fr; }
    .dash-employee dl { grid-template-columns: 1fr; }
    .dash-open { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .dash-root *, .dash-root *::before, .dash-root *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }
`;
