#!/usr/bin/env node
/**
 * 10DLC number pool — claim/reserve/top-up (infra/scripts/README.md, Phase 1).
 * Source of truth is the `number_pool` table (0001_init.sql); Twilio is the provider.
 * Invariants enforced: the front-door number (TWILIO_FRONTDOOR_NUMBER) is reserved
 * and never recycled, and >= MIN_FREE numbers stay free for new provisioning.
 *
 *   node infra/scripts/number-pool.mjs              # audit + invariant check
 *   node infra/scripts/number-pool.mjs --sync       # add Twilio-owned numbers missing from the pool
 *   node infra/scripts/number-pool.mjs --top-up=2 --confirm-purchase   # buy until >= MIN_FREE free
 *
 * Money action: --top-up purchases numbers and requires --confirm-purchase.
 */
import { createClient } from "@supabase/supabase-js";

const MIN_FREE = Number(process.env.NUMBER_POOL_MIN_FREE ?? 2);
const argv = process.argv.slice(2);
const wantSync = argv.includes("--sync");
const topUpArg = argv.find((a) => a.startsWith("--top-up"));
const topUpTarget = topUpArg ? Number(topUpArg.split("=")[1] ?? MIN_FREE) : 0;
const confirmPurchase = argv.includes("--confirm-purchase");

function need(name) {
  const v = process.env[name];
  if (!v || /XXXX|change-me/.test(v)) {
    console.error(`number-pool: ${name} is not set. Fill .env (see .env.example) and retry.`);
    process.exit(2);
  }
  return v;
}

const SID = need("TWILIO_ACCOUNT_SID");
const TOKEN = need("TWILIO_AUTH_TOKEN");
const frontDoor = process.env.TWILIO_FRONTDOOR_NUMBER ?? "";
const twilioAuth = "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");
const twBase = `https://api.twilio.com/2010-04-01/Accounts/${SID}`;

async function twilio(path, init) {
  const res = await fetch(`${twBase}${path}`, { ...init, headers: { Authorization: twilioAuth, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`Twilio ${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("number-pool: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required to reconcile the pool table.");
    process.exit(2);
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supa = db();

// 1. Owned numbers from Twilio (provider truth).
const owned = (await twilio(`/IncomingPhoneNumbers.json?PageSize=1000`)).incoming_phone_numbers ?? [];
const ownedSet = new Set(owned.map((n) => n.phone_number));
console.log(`Twilio owns ${owned.length} number(s).`);

// 2. Pool rows (AMTECH inventory truth).
const { data: pool, error } = await supa.from("number_pool").select("*");
if (error) { console.error(`number-pool: pool read failed — ${error.message}`); process.exit(1); }

// 3. Optional sync: insert owned numbers missing from the pool as free.
if (wantSync) {
  const known = new Set((pool ?? []).map((r) => r.phone_e164));
  const toAdd = owned.filter((n) => !known.has(n.phone_number));
  for (const n of toAdd) {
    const reserved = n.phone_number === frontDoor;
    await supa.from("number_pool").insert({
      id: `num_${n.sid}`,
      phone_e164: n.phone_number,
      status: reserved ? "reserved" : "free",
      reserved,
    });
  }
  console.log(`Synced ${toAdd.length} new number(s) into the pool.`);
}

const { data: pool2 } = await supa.from("number_pool").select("*");
const rows = pool2 ?? [];
const free = rows.filter((r) => r.status === "free");
const claimed = rows.filter((r) => r.status === "claimed");
const reserved = rows.filter((r) => r.reserved || r.status === "reserved");

console.log(`Pool: ${rows.length} total · ${free.length} free · ${claimed.length} claimed · ${reserved.length} reserved`);

// 4. Invariants.
const problems = [];
if (frontDoor && !reserved.some((r) => r.phone_e164 === frontDoor)) {
  problems.push(`front-door number ${frontDoor} is not reserved in the pool (run --sync, or reserve it)`);
}
const orphans = rows.filter((r) => !ownedSet.has(r.phone_e164));
if (orphans.length) problems.push(`${orphans.length} pool number(s) no longer owned in Twilio: ${orphans.map((o) => o.phone_e164).join(", ")}`);
if (free.length < MIN_FREE) problems.push(`only ${free.length} free number(s); want >= ${MIN_FREE}`);

// 5. Optional top-up (money action).
if (topUpTarget > 0 && free.length < topUpTarget) {
  const buy = topUpTarget - free.length;
  if (!confirmPurchase) {
    console.error(`number-pool: would purchase ${buy} number(s) to reach ${topUpTarget} free. Re-run with --confirm-purchase to spend money.`);
    process.exit(1);
  }
  const avail = (await twilio(`/AvailablePhoneNumbers/US/Local.json?SmsEnabled=true&PageSize=${buy}`)).available_phone_numbers ?? [];
  let bought = 0;
  for (const a of avail.slice(0, buy)) {
    const purchased = await twilio(`/IncomingPhoneNumbers.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ PhoneNumber: a.phone_number }).toString(),
    });
    await supa.from("number_pool").insert({ id: `num_${purchased.sid}`, phone_e164: purchased.phone_number, status: "free", reserved: false });
    bought += 1;
    console.log(`Purchased ${purchased.phone_number} (${purchased.sid}).`);
  }
  console.log(`Top-up bought ${bought} number(s).`);
}

if (problems.length) {
  console.error("\nPool issues:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nPool healthy: front-door reserved, free buffer satisfied, no orphans.");
