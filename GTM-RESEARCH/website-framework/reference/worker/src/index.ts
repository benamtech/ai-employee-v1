interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESOLVER_MANIFEST?: string;
}
interface ResolverCandidate {
  id: string;
  routeId: string;
  vector: number[];
  eligibilityMask: number;
  minimumScore: number;
}
interface ResolverManifest {
  version: string;
  dimensions: number;
  candidates: ResolverCandidate[];
  baselineByRoute: Record<string, string>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__resolve/")) return resolveRequest(request, env);
    if (url.pathname.startsWith("/__experiment/")) return experimentEvent(request);
    return env.ASSETS.fetch(request);
  },
};

async function resolveRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
  const manifest = parseManifest(env.RESOLVER_MANIFEST);
  if (!manifest) return json({ fallback: true, reason: "manifest-unavailable" }, 503);
  let body: { routeId?: string; vector?: number[]; eligibilityMask?: number };
  try { body = await request.json(); } catch { return json({ fallback: true, reason: "invalid-json" }, 400); }
  const routeId = body.routeId ?? "";
  const baseline = manifest.baselineByRoute[routeId];
  if (!baseline) return json({ fallback: true, reason: "unknown-route" }, 404);
  if (!Array.isArray(body.vector) || body.vector.length !== manifest.dimensions || body.vector.some((value) => !Number.isFinite(value))) {
    return json({ variantId: baseline, fallback: true, reason: "invalid-vector", manifestVersion: manifest.version });
  }
  const eligibilityMask = Number.isInteger(body.eligibilityMask) ? body.eligibilityMask! : 0;
  let best: ResolverCandidate | null = null; let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of manifest.candidates) {
    if (candidate.routeId !== routeId || candidate.vector.length !== body.vector.length) continue;
    if ((candidate.eligibilityMask & eligibilityMask) !== candidate.eligibilityMask) continue;
    const score = cosine(body.vector, candidate.vector);
    if (score > bestScore || (score === bestScore && candidate.id < (best?.id ?? "\uffff"))) { best = candidate; bestScore = score; }
  }
  if (!best || bestScore < best.minimumScore) return json({ variantId: baseline, score: Number.isFinite(bestScore) ? bestScore : 0, fallback: true, reason: "low-confidence", manifestVersion: manifest.version });
  return json({ variantId: best.id, score: bestScore, fallback: false, reason: "selected", manifestVersion: manifest.version });
}

async function experimentEvent(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 16_384) return json({ error: "payload-too-large" }, 413);
  return json({ accepted: true, persisted: false }, 202);
}
function parseManifest(raw?: string): ResolverManifest | null {
  if (!raw) return null;
  try { const value = JSON.parse(raw) as ResolverManifest; return Number.isInteger(value.dimensions) && value.dimensions > 0 ? value : null; }
  catch { return null; }
}
function cosine(left: number[], right: number[]): number {
  let dot = 0; let a = 0; let b = 0;
  for (let i = 0; i < left.length; i += 1) { dot += left[i] * right[i]; a += left[i] * left[i]; b += right[i] * right[i]; }
  return a > 0 && b > 0 ? dot / Math.sqrt(a * b) : Number.NEGATIVE_INFINITY;
}
function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff" } });
}
