import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MANAGER_API } from "@amtech/shared";
import { EmployeeUiPortHost } from "../../../_components/employee-ui/EmployeeUiPort";
import { LiveEmployeeProvider } from "../../../_components/live-employee/LiveEmployeeProvider";
import { UiLabShell } from "../../../_components/live-employee/UiLabShell";
import { managerPost } from "../../../api/_lib/manager";

export default async function UiLabEmployeeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const nextPath = `/ui-lab/employee/${employeeId}`;
  const ownerSession = (await cookies()).get("amtech_owner_session")?.value;
  if (!ownerSession) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const response = await managerPost(MANAGER_API.ownerDashboard, { owner_session_token: ownerSession });
  if (response.status === 401) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const dashboard = await response.json().catch(() => ({})) as {
    employees?: Array<{ id: string; name?: string | null }>;
  };
  const employee = (dashboard.employees ?? []).find((item) => item.id === employeeId);
  if (!employee) redirect("/ui-lab");
  return (
    <EmployeeUiPortHost adapterKey="owner_web" employeeId={employeeId}>
      <LiveEmployeeProvider employeeId={employeeId}>
        <UiLabShell employeeId={employeeId} employeeName={employee.name ?? "AI employee"}>
          {children}
        </UiLabShell>
      </LiveEmployeeProvider>
    </EmployeeUiPortHost>
  );
}
