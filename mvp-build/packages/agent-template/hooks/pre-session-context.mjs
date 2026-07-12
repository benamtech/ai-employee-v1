#!/usr/bin/env node

async function readStdin() {
  let body = "";
  for await (const chunk of process.stdin) body += chunk;
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function sessionIdFrom(input) {
  return (
    input?.session_id ||
    input?.sessionId ||
    input?.conversation_id ||
    input?.conversationId ||
    input?.run_id ||
    input?.runId ||
    process.env.HERMES_SESSION_ID ||
    process.env.HERMES_SESSION_KEY ||
    ""
  );
}

try {
  const input = await readStdin();
  const origin = String(process.env.MANAGER_API_ORIGIN || "").replace(/\/$/, "");
  const token = process.env.MANAGER_MCP_TOKEN || "";
  if (!origin || !token) {
    process.stdout.write("{}\n");
    process.exit(0);
  }

  const url = new URL(`${origin}/manager/agent-context`);
  const sessionId = sessionIdFrom(input);
  if (sessionId) url.searchParams.set("session_id", String(sessionId));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    process.stdout.write("{}\n");
    process.exit(0);
  }
  const json = await res.json();
  if (!json?.context) {
    process.stdout.write("{}\n");
    process.exit(0);
  }
  process.stdout.write(JSON.stringify({ context: json.context }) + "\n");
} catch {
  process.stdout.write("{}\n");
}
