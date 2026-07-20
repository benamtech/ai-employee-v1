export const productionAdminBlock = `  function adminAuthHeaders(c: Context) {
    return {
      authorization: c.req.header("X-AMTECH-Admin-Authorization"),
      support_lease_id: c.req.header("X-AMTECH-Support-Lease-Id"),
      legacy_identity_header_present: Boolean(c.req.header("X-AMTECH-Platform-User-Id")),
      legacy_reason_header_present: Boolean(c.req.header("X-AMTECH-Support-Reason")),
    };
  }

  async function authorizeAdminRead(c: Context, input: {
    action: string;
    action_class: "read" | "support_read";
    allowed_roles: Array<"platform_owner" | "platform_operator" | "support_readonly" | "billing_operator" | "security_reviewer">;
    account_id?: string | null;
    employee_id?: string | null;
    assignment_id?: string | null;
    require_support_lease?: boolean;
  }) {
    const denied = denyInternal(c);
    if (denied) return { denied };
    const auth = await authorizePlatformAdminRequest(serviceClient(), {
      ...adminAuthHeaders(c),
      ...input,
    });
    if (!auth.ok) return { denied: c.json({ error: auth.error }, auth.status) };
    return { actor: auth.actor };
  }

  app.get(MANAGER_API.admin.dashboard, async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:dashboard:read",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json(await buildAdminDashboard(serviceClient()));
  });

  app.get(MANAGER_API.admin.accounts, async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:accounts:list",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json({ accounts: (await buildAdminDashboard(serviceClient())).accounts });
  });

  app.get("/manager/admin/accounts/:accountId", async (c) => {
    const accountId = c.req.param("accountId");
    const auth = await authorizeAdminRead(c, {
      action: "admin:account:inspect",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
      account_id: accountId,
      employee_id: null,
      assignment_id: null,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const detail = await buildAdminAccountDetail(serviceClient(), accountId);
    if (!detail) return c.json({ error: "account_not_found" }, 404);
    return c.json(detail);
  });

  async function employeeAdminScope(employeeId: string) {
    const db = serviceClient();
    const employee = await db.from("employees").select("id,account_id").eq("id", employeeId).maybeSingle();
    if (employee.error) throw employee.error;
    if (!employee.data?.account_id) return null;
    const assignmentId = await resolvePlatformAdminAssignment(db, {
      account_id: String(employee.data.account_id),
      employee_id: employeeId,
    });
    return { db, account_id: String(employee.data.account_id), assignment_id: assignmentId };
  }

  app.get("/manager/admin/employees/:employeeId", async (c) => {
    const employeeId = c.req.param("employeeId");
    const scope = await employeeAdminScope(employeeId);
    if (!scope) return c.json({ error: "employee_not_found" }, 404);
    const auth = await authorizeAdminRead(c, {
      action: "admin:employee:inspect",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "security_reviewer"],
      account_id: scope.account_id,
      employee_id: employeeId,
      assignment_id: scope.assignment_id,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const detail = await buildAdminEmployeeDetail(scope.db, employeeId);
    if (!detail) return c.json({ error: "employee_not_found" }, 404);
    return c.json(detail);
  });

  app.get("/manager/admin/employees/:employeeId/readiness", async (c) => {
    const employeeId = c.req.param("employeeId");
    const scope = await employeeAdminScope(employeeId);
    if (!scope) return c.json({ error: "employee_not_found" }, 404);
    const auth = await authorizeAdminRead(c, {
      action: "admin:employee:readiness",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "security_reviewer"],
      account_id: scope.account_id,
      employee_id: employeeId,
      assignment_id: scope.assignment_id,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const report = await buildReadinessReport(scope.db, employeeId);
    if (!report) return c.json({ error: "employee_not_found" }, 404);
    return c.json(report);
  });

  app.get("/manager/admin/environment/readiness", async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:environment:readiness",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json(buildEnvironmentReadiness());
  });

  app.post(MANAGER_API.admin.supportAction, async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const action = await c.req.json().catch(() => ({}));
    const result = await executePlatformAdminSupportAction(serviceClient(), {
      ...adminAuthHeaders(c),
      action,
    });
    return c.json(result.body, result.status as 200 | 400 | 401 | 403 | 409 | 410 | 503);
  });

`;
