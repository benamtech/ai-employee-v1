import { hash32 } from "./core.js";

export interface FiniteVariantCandidate {
  id: string;
  routeId: string;
  vector: readonly number[];
  eligibilityMask: number;
  minimumScore: number;
}
export interface ResolverManifest {
  version: string;
  dimensions: number;
  candidates: FiniteVariantCandidate[];
  baselineByRoute: Record<string, string>;
}
export interface ResolveInput { routeId: string; vector: readonly number[]; eligibilityMask: number; experimentScopeId?: string; }
export interface ResolveResult { variantId: string; score: number; fallback: boolean; reason: string; manifestVersion: string; }

export function resolveFiniteVariant(manifest: ResolverManifest, input: ResolveInput): ResolveResult {
  const baseline = manifest.baselineByRoute[input.routeId];
  if (!baseline) throw new Error(`unknown route: ${input.routeId}`);
  if (input.vector.length !== manifest.dimensions || input.vector.some((value) => !Number.isFinite(value))) {
    return { variantId: baseline, score: 0, fallback: true, reason: "invalid-vector", manifestVersion: manifest.version };
  }
  let best: FiniteVariantCandidate | null = null; let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of manifest.candidates) {
    if (candidate.routeId !== input.routeId) continue;
    if ((candidate.eligibilityMask & input.eligibilityMask) !== candidate.eligibilityMask) continue;
    if (candidate.vector.length !== input.vector.length) continue;
    const score = cosineFinite(input.vector, candidate.vector);
    if (score > bestScore || (score === bestScore && candidate.id < (best?.id ?? "\uffff"))) { best = candidate; bestScore = score; }
  }
  if (!best || bestScore < best.minimumScore) return { variantId: baseline, score: Number.isFinite(bestScore) ? bestScore : 0, fallback: true, reason: "low-confidence", manifestVersion: manifest.version };
  if (input.experimentScopeId && hash32(`${manifest.version}\0${input.experimentScopeId}`) % 100 >= 50) {
    return { variantId: baseline, score: bestScore, fallback: true, reason: "holdout", manifestVersion: manifest.version };
  }
  return { variantId: best.id, score: bestScore, fallback: false, reason: "selected", manifestVersion: manifest.version };
}
function cosineFinite(left: readonly number[], right: readonly number[]): number {
  let dot = 0; let leftSquared = 0; let rightSquared = 0;
  for (let i = 0; i < left.length; i += 1) { dot += left[i] * right[i]; leftSquared += left[i] * left[i]; rightSquared += right[i] * right[i]; }
  if (leftSquared <= 0 || rightSquared <= 0) return Number.NEGATIVE_INFINITY;
  return dot / Math.sqrt(leftSquared * rightSquared);
}
