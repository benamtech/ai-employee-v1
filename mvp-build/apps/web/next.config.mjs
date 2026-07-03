/** @type {import('next').NextConfig} */
// Runs on the VPS via `next start` behind Caddy. No serverless-only primitives.
const nextConfig = {
  reactStrictMode: true,
  // Manager API base (VPS backend) for client → orchestrator/tool calls.
  env: {
    MANAGER_API_ORIGIN: process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080",
  },
};

export default nextConfig;
