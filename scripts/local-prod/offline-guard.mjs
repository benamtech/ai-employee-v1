import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";

const allowLoopback = process.env.LOCAL_PROD_ALLOW_LOOPBACK === "1";
const loopback = (host) => ["127.0.0.1", "::1", "localhost"].includes(String(host ?? ""));
const deny = (kind, target) => {
  if (allowLoopback && loopback(target)) return;
  throw new Error(`offline_test_network_denied:${kind}:${String(target ?? "unknown")}`);
};

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
  deny("fetch", url.hostname);
  return originalFetch(input, init);
};

for (const module of [http, https]) {
  const originalRequest = module.request.bind(module);
  const originalGet = module.get.bind(module);
  module.request = ((...args) => {
    const first = args[0];
    const host = typeof first === "string" || first instanceof URL ? new URL(String(first)).hostname : first?.hostname ?? first?.host;
    deny("http", host);
    return originalRequest(...args);
  });
  module.get = ((...args) => {
    const first = args[0];
    const host = typeof first === "string" || first instanceof URL ? new URL(String(first)).hostname : first?.hostname ?? first?.host;
    deny("http_get", host);
    return originalGet(...args);
  });
}

for (const module of [net, tls]) {
  const original = module.connect.bind(module);
  module.connect = ((...args) => {
    const first = args[0];
    const host = typeof first === "object" ? first?.host : typeof args[1] === "string" ? args[1] : undefined;
    deny("socket", host);
    return original(...args);
  });
}

const originalLookup = dns.lookup.bind(dns);
dns.lookup = ((hostname, ...args) => {
  deny("dns", hostname);
  return originalLookup(hostname, ...args);
});
