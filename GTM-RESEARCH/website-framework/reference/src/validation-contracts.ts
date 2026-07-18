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
  pending: readonly string[];
  passes: boolean;
  reportHash: string;
}

export function buildValidationReport(
  scope: string,
  attributes: readonly ValidationAttribute[],
  findings: readonly ValidationFinding[],
  generatedAt = "deterministic",
): ValidationReport {
  const byId = new Map(attributes.map((attribute) => [attribute.id, attribute]));
  const seen = new Set<string>();
  for (const finding of findings) {
    if (!byId.has(finding.attributeId)) throw new Error(`validation finding references unknown attribute ${finding.attributeId}`);
    if (seen.has(finding.attributeId)) throw new Error(`duplicate validation finding ${finding.attributeId}`);
    seen.add(finding.attributeId);
  }
  const completed = attributes.map((attribute) => findings.find((finding) => finding.attributeId === attribute.id) ?? {
    attributeId: attribute.id,
    state: "not-run" as const,
    detail: "validation not run",
  });
  const hardFailures = completed
    .filter((finding) => finding.state === "fail" && byId.get(finding.attributeId)?.severity === "hard")
    .map((finding) => finding.attributeId)
    .sort();
  const softFailures = completed
    .filter((finding) => finding.state === "fail" && byId.get(finding.attributeId)?.severity === "soft")
    .map((finding) => finding.attributeId)
    .sort();
  const pending = completed
    .filter((finding) => finding.state === "pending" || finding.state === "not-run")
    .map((finding) => finding.attributeId)
    .sort();
  const canonical = {
    scope,
    generatedAt,
    attributes: [...attributes].sort((left, right) => left.id.localeCompare(right.id)),
    findings: [...completed].sort((left, right) => left.attributeId.localeCompare(right.attributeId)),
    hardFailures,
    softFailures,
    pending,
  };
  return {
    ...canonical,
    passes: hardFailures.length === 0,
    reportHash: sha256(JSON.stringify(canonical)),
  };
}

export function finding(
  attributeId: string,
  state: ValidationState,
  detail: string,
  options: { measured?: number; threshold?: number; evidenceIds?: readonly string[] } = {},
): ValidationFinding {
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
  if (!report.passes) throw new Error(`validation failed for ${report.scope}: ${report.hardFailures.join(", ")}`);
}
