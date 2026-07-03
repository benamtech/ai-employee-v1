/**
 * Database clients.
 *  - serviceClient(): Supabase service-role client for the Manager (bypasses RLS;
 *    backend control-plane authority).
 *  - anonClient(accessToken): Supabase client acting AS an authenticated owner
 *    (RLS enforced) — the web/owner path.
 *
 * The Manager is the only holder of the service role key. RLS (migration 0002)
 * protects the owner/anon path so an owner cannot read another account's rows.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function serviceClient(): SupabaseClient {
  return createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(accessToken?: string): SupabaseClient {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

export type { SupabaseClient };
