import { NextResponse } from "next/server";

export function managerOrigin(): string {
  return (process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");
}

export function managerHeaders(): HeadersInit {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function managerPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${managerOrigin()}${path}`, {
    method: "POST",
    headers: managerHeaders(),
    body: JSON.stringify(body),
  });
}

export async function proxyJson(path: string, body: unknown): Promise<NextResponse> {
  const res = await managerPost(path, body);
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
