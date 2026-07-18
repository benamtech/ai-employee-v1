import { sha256 } from "./core.js";

export type ValidationState = "pass" | "fail" | "pending" | "not-run";
export type ValidationSeverity = "hard" | "soft";

export interface ValidationAttribute {
  id: string;
  feature: string;
  workflowStep: string;
  algorithmChoice: string;
  userEffect: string;
  developerEffect: string;
  validationVector: readonly string[];
  passVector: readonly string[];
  failVector: readonly string[];
  simplerBaseline: string;
  severity: ValidationSeverity;
}

export interface ValidationFinding {
  attributeId: string;
  state: ValidationState;
  detail: string;
  measured?: number;
  threshold?: number;
  evidenceIds?: readonly string[];
}

export interface ValidationReport {
  scope: string;
  generatedAt: string;
  attributes: readonly ValidationAttribute[];
  findings: readonly ValidationFinding[];
  hardFailures: readonly string[];
  softFailures: readonly string[];
  hardPending: readonly string[];
  softPending: readonly string[];
  pending: readonly string[];
  complete: boolean;
  passes: boolean;
  reportHash: string;
}

export function buildValidationReport(
  scope: string,
  attributes: readonly ValidationAttribute[],
  findings: readonly ValidationFinding[],
  generatedAt = "deterministic",
): ValidationReport {
  if (!scope.trim()) throw new Error("validation scope is required");
  const byId = new Map<string, ValidationAttribute>();
  for (const attribute of attributes) {
    if (!attribute.id.trim() || byId.has(attribute.id)) throw new Error(`invalid or duplicate validation attribute ${attribute.id}`);
    byId.set(attribute.id, attribute);
  }
  const seen = new Set<string>();
  for (const item of findings) {
    if (!byId.has(item.attributeId)) throw new Error(`validation finding references unknown attribute ${item.attributeId}`);
    if (seen.has(item.attributeId)) throw new Error(`duplicate validation finding ${item.attributeId}`);
    seen.add(item.attributeId);
  }
  const completed = attributes.map((attribute) => findings.find((item) => item.attributeId === attribute.id) ?? {
    attributeId: attribute.id,
    state: "not-run" as const,
    detail: "validation not run",
  });
  const hardFailures = idsByState(completed, byId, "fail", "hard");
  const softFailures = idsByState(completed, byId, "fail", "soft");
  const hardPending = idsPending(completed, byId, "hard");
  const softPending = idsPending(completed, byId, "soft");
  const pending = [...hardPending, ...softPending].sort();
  const canonical = {
    scope,
    generatedAt,
    attributes: [...attributes].sort((left, right) => left.id.localeCompare(right.id)),
    findings: [...completed].sort((left, right) => left.attributeId.localeCompare(right.attributeId)),
    hardFailures,
    softFailures,
    hardPending,
    softPending,
    pending,
  };
  const complete = hardPending.length === 0;
  return {
    ...canonical,
    complete,
    passes: hardFailures.length === 0 && complete,
    reportHash: sha256(JSON.stringify({ ...canonical, complete })),
  };
}

export function finding(
  attributeId: string,
  state: ValidationState,
  detail: string,
  options: { measured?: number; threshold?: number; evidenceIds?: readonly string[] } = {},
): ValidationFinding {
  if (!attributeId.trim() || !detail.trim()) throw new Error("validation finding requires attributeId and detail");
  return {
    attributeId,
    state,
    detail,
    ...(options.measured === undefined ? {} : { measured: options.measured }),
    ...(options.threshold === undefined ? {} : { threshold: options.threshold }),
    ...(options.evidenceIds === undefined ? {} : { evidenceIds: [...options.evidenceIds].sort() }),
  };
}

export function assertValidationPass(report: ValidationReport): void {
  if (!report.passes) {
    const reasons = [
      ...report.hardFailures.map((id) => `failed:${id}`),
      ...report.hardPending.map((id) => `pending:${id}`),
    ];
    throw new Error(`validation failed for ${report.scope}: ${reasons.join(", ")}`);
  }
}

function idsByState(
  findings: readonly ValidationFinding[],
  attributes: ReadonlyMap<string, ValidationAttribute>,
  state: ValidationState,
  severity: ValidationSeverity,
): string[] {
  return findings.filter((item) => item.state === state && attributes.get(item.attributeId)?.severity === severity).map((item) => item.attributeId).sort();
}
function idsPending(
  findings: readonly ValidationFinding[],
  attributes: ReadonlyMap<string, ValidationAttribute>,
  severity: ValidationSeverity,
): string[] {
  return findings.filter((item) => (item.state === "pending" || item.state === "not-run") && attributes.get(item.attributeId)?.severity === severity).map((item) => item.attributeId).sort();
}
