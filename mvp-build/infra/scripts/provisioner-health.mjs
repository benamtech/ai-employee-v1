#!/usr/bin/env node
const origin = (process.env.PROVISIONER_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");
const res = await fetch(`${origin}/provision/health`);
if (!res.ok) {
  console.error(`provisioner health failed: ${res.status}`);
  process.exit(1);
}
console.log(await res.text());
