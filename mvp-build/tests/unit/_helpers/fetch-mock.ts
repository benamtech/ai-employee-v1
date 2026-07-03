import { vi } from "vitest";

/** Route a stubbed global fetch by URL substring (unit tests only). */
export function routerFetch(routes: Array<{ match: string; status?: number; body: unknown }>) {
  return vi.fn(async (url: unknown) => {
    const u = String(url);
    const r = routes.find((x) => u.includes(x.match));
    if (!r) throw new Error(`no mock route for ${u}`);
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200, headers: { "Content-Type": "application/json" } });
  });
}
