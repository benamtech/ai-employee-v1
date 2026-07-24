import { verifyEnvelope } from '../lib/core.mjs';

const ACCEPTED_ATTESTORS = new Set(['human', 'provider', 'managed-platform', 'production']);

export function verifyExternalAcceptanceRecord(record, { exactCandidate = null } = {}) {
  const errors = [];
  if (record?.schema !== 'external.acceptance.v1') errors.push(`schema:${record?.schema ?? 'missing'}`);
  if (record?.schema === 'external.acceptance.v1' && record.content_digest) {
    errors.push(...verifyEnvelope(record, 'external.acceptance.v1').map((error) => `envelope:${error}`));
  }
  const payload = record?.payload ?? record;
  if (payload?.accepted !== true) errors.push('not_accepted');
  if (!ACCEPTED_ATTESTORS.has(payload?.attestor_type)) errors.push(`invalid_attestor_type:${payload?.attestor_type ?? 'missing'}`);
  if (!payload?.attestor) errors.push('attestor_missing');
  if (!payload?.boundary) errors.push('boundary_missing');
  if (!payload?.evidence_uri && !payload?.evidence_digest) errors.push('evidence_reference_missing');
  if (exactCandidate && payload?.exact_candidate && payload.exact_candidate !== exactCandidate) errors.push('exact_candidate_mismatch');
  if (payload?.evidence_class && payload.evidence_class !== 'P4') errors.push(`invalid_evidence_class:${payload.evidence_class}`);
  return { ok: errors.length === 0, errors };
}

export function verifyExternalAcceptanceRecords(records = [], options = {}) {
  const results = records.map((record, index) => ({ index, ...verifyExternalAcceptanceRecord(record, options) }));
  return {
    ok: records.length > 0 && results.every((result) => result.ok),
    results,
    accepted_count: results.filter((result) => result.ok).length,
    errors: results.flatMap((result) => result.errors.map((error) => `record:${result.index}:${error}`))
  };
}
