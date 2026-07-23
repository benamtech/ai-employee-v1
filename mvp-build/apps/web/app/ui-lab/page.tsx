import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../api/_lib/manager";

export const metadata = { title: "UI Lab — AMTECH" };

export default async function UiLabIndexPage() {
  const token = (await cookies()).get("amtech_owner_session")?.value;
  if (!token) redirect(`/login?next=${encodeURIComponent("/ui-lab")}`);
  const response = await managerPost(MANAGER_API.ownerDashboard, { owner_session_token: token });
  if (response.status === 401) redirect(`/login?next=${encodeURIComponent("/ui-lab")}`);
  const dashboard = await response.json().catch(() => ({})) as {
    account?: { display_name?: string | null } | null;
    employees?: Array<{ id: string; name?: string | null; status?: string | null; profile_package_key?: string | null }>;
  };
  const employees = dashboard.employees ?? [];
  if (employees.length === 1) redirect(`/ui-lab/employee/${employees[0].id}`);
  const remembered = (await cookies()).get("amtech_ui_lab_employee")?.value ?? null;
  const rememberedAuthorized = employees.some((employee) => employee.id === remembered) ? remembered : null;

  return (
    <main className="ui-lab-live-index">
      <style>{CSS}</style>
      <section>
        <p>Live owner workbench</p>
        <h1>{dashboard.account?.display_name ?? "UI Lab"}</h1>
        <span>Choose an employee authorized by the current owner session. Remembered preference only highlights an authorized employee; it never grants access.</span>
        <div className="selector">
          {employees.map((employee) => (
            <Link className={employee.id === rememberedAuthorized ? "remembered" : ""} key={employee.id} href={`/ui-lab/employee/${employee.id}`}>
              <small>{readable(employee.status ?? "unknown")}</small>
              <strong>{employee.name ?? "AI employee"}</strong>
              <span>{readable(employee.profile_package_key ?? "General employee")}</span>
              <b>{employee.id === rememberedAuthorized ? "Remembered and authorized" : "Open live workbench"}</b>
            </Link>
          ))}
          {!employees.length ? <div className="empty"><strong>No authorized employees</strong><span>The current owner dashboard did not return an employee for UI Lab.</span></div> : null}
        </div>
        <Link className="fixtures" href="/ui-lab/fixtures">Open explicit fixture gallery</Link>
      </section>
    </main>
  );
}

const CSS = `
  .ui-lab-live-index{min-height:100dvh;padding:clamp(24px,6vw,72px);background:#f7f9fc;color:#111;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.ui-lab-live-index>section{width:min(1040px,100%);margin:0 auto}.ui-lab-live-index p{margin:0 0 10px;color:#e11d2a;font-size:11px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.ui-lab-live-index h1{margin:0;font-size:clamp(38px,7vw,72px);line-height:.96;letter-spacing:-.055em}.ui-lab-live-index>section>span{display:block;max-width:720px;margin-top:16px;color:#667085;font-size:16px;line-height:1.6}.selector{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px;margin-top:30px}.selector a,.empty{min-height:190px;padding:20px;display:grid;align-content:start;gap:8px;border:1px solid rgba(17,17,17,.1);border-radius:8px;background:#fff;text-decoration:none;color:#111}.selector a.remembered{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.selector small{color:#e11d2a;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.1em}.selector strong{font-size:22px}.selector span,.empty span{color:#667085}.selector b{margin-top:auto;color:#1d4ed8;font-size:13px}.fixtures{display:inline-flex;min-height:44px;align-items:center;margin-top:18px;color:#111;font-weight:800}
`;

function readable(value?: string | null): string {
  return String(value ?? "AI employee").replace(/[_:-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
