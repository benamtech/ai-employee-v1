/**
 * Row shapes the Work Surface consumes from POST /api/employee/[id]/resources, plus
 * the derived JobFolder grouping. These mirror the Manager `/resources` payload
 * (apps/manager/src/server.ts). Rendering is descriptor-driven — never raw provider
 * payloads (wiki/MVP/phase-3-generative-ui-reframe.md).
 */
// The read-model row shapes now live in @amtech/shared (resource-payload.ts) so the
// Manager snapshot builder and the browser share one contract. Re-exported here so
// existing local imports keep working.
export type {
  ArtifactRow,
  ApprovalRow,
  MessageRow,
  ConnectorRow,
  StripeInvoiceRow,
  ReminderRow,
  JobCommitmentRow,
  WorkEventRow,
  EmployeeSummary,
  RuntimeHealthSummary,
  AbilitySummary,
  WorkOutput,
  WorkTask,
  ResourcePayload,
} from "@amtech/shared";
import type { ArtifactRow, StripeInvoiceRow, ReminderRow, JobCommitmentRow, WorkEventRow } from "@amtech/shared";

/** One job's worth of work, joined across surfaces by the estimate artifact id. */
export interface JobFolder {
  key: string; // estimate artifact id, or a synthetic key for loose items
  title: string;
  customer?: string;
  estimate?: ArtifactRow;
  invoices: StripeInvoiceRow[];
  reminders: ReminderRow[];
  commitments: JobCommitmentRow[];
  workEvents: WorkEventRow[];
  lastActivity: string; // ISO, for ordering
}
