export type PlatformRole =
  | "platform_owner"
  | "platform_operator"
  | "support_readonly"
  | "billing_operator"
  | "security_reviewer";

export type AccountState = "trial" | "active" | "needs_payment" | "suspended" | "cancelled";
export type BillingState = "free_mvp" | "trialing" | "active" | "past_due" | "cancelled" | "unknown";
export type HealthState = "green" | "yellow" | "red" | "gray";

export interface AdminActor {
  platform_user_id: string;
  role: PlatformRole;
  support_reason?: string;
}

export interface AdminAccountSummary {
  id: string;
  display_name?: string | null;
  owner_email?: string | null;
  created_at?: string | null;
  account_state: AccountState;
  billing_state: BillingState;
  health: HealthState;
  employee_count: number;
  pending_approvals: number;
  repair_items: number;
  degraded_employees: number;
}

export interface AdminEmployeeSummary {
  id: string;
  account_id: string;
  name?: string | null;
  status?: string | null;
  profile_id?: string | null;
  needs_reprovision?: boolean;
  runtime_health?: string | null;
  backend_type?: string | null;
  connector_health: HealthState;
  pending_approvals: number;
  repair_items: number;
}

export interface AdminDashboard {
  generated_at: string;
  accounts: AdminAccountSummary[];
  totals: {
    accounts: number;
    employees: number;
    unhealthy_employees: number;
    pending_approvals: number;
    repair_items: number;
    estimated_month_cost_cents?: number | null;
  };
  readiness_warnings: string[];
}

export interface AdminReadinessReport {
  account_id: string;
  employee_id: string;
  generated_at: string;
  status: "ready" | "blocked" | "needs_review";
  checks: Array<{
    key: string;
    label: string;
    status: "pass" | "fail" | "warn" | "unknown";
    detail: string;
    proof?: Record<string, unknown>;
  }>;
}

export type AdminSupportAction =
  | "suspend_employee"
  | "resume_employee"
  | "disable_employee"
  | "mark_needs_reprovision"
  | "revoke_mcp_credentials"
  | "rotate_mcp_credential"
  | "rerun_runtime_health"
  | "redeliver_event"
  | "suppress_event_source";

export interface AdminSupportActionInput {
  action: AdminSupportAction;
  account_id: string;
  employee_id?: string;
  reason: string;
  event_id?: string;
  source?: string;
  event_type?: string;
  expires_at?: string;
  confirm?: boolean;
}

export interface AdminSupportActionResult {
  status: "ok" | "failed" | "denied";
  action: AdminSupportAction;
  changed_resources: string[];
  proof: Record<string, unknown>;
  audit_id?: string;
  user_facing_summary_hint: string;
}
