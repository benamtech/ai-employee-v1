#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../.."

set -a
# shellcheck disable=SC1091
source .env
set +a

export NODE_OPTIONS="${NODE_OPTIONS:-} --dns-result-order=ipv4first"
node -e '
const dns = require("dns");
const u = new URL(process.env.DATABASE_URL);
console.log(`DATABASE_URL ${u.protocol}//${u.username}:***@${u.hostname}:${u.port}${u.pathname}`);
dns.lookup(u.hostname, { all: true }, (err, addrs) => {
  if (err) {
    console.error(`DATABASE_URL host lookup failed: ${err.code || err.message}`);
    process.exit(1);
  }
  const families = new Set(addrs.map((a) => a.family));
  if (u.hostname.startsWith("db.") && !families.has(4)) {
    console.error("DATABASE_URL direct Supabase host is IPv6-only from this machine. Use the Supabase shared pooler URI instead of db.<ref>.supabase.co.");
    process.exit(1);
  }
});
'
npm run db:status
npm run db:migrate
