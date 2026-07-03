/**
 * Canonical route map. The split between public owner surface and backend
 * webhook/tool surface MUST NOT change (02-system-architecture.md "Domain Scheme").
 * Hostnames can change via env; the structure is fixed.
 */

export const PUBLIC_WEB = {
  createAiEmployee: "/create-ai-employee",
  claim: "/claim",
  login: "/login",
} as const;

/** Owner web employee surface, served behind Caddy/account auth. */
export function employeeWebRoute(employeeId: string): string {
  return `/agent/${employeeId}`;
}

/** Signed artifact route (Phase 2 active; route reserved in Phase 0). */
export function artifactRoute(employeeId: string, artifactId: string): string {
  return `/agent/${employeeId}/output/${artifactId}`;
}

/** Backend Manager API + webhook surface (api.amtechai.com). */
export const MANAGER_API = {
  toolBase: "/manager",
  orchestratorWeb: "/manager/orchestrator/web",
  artifactResolve: (employeeId: string, artifactId: string) =>
    `/manager/artifacts/${employeeId}/${artifactId}/resolve`,
  employeeResources: (employeeId: string) => `/manager/employee/${employeeId}/resources`,
  webhooks: {
    twilioFrontDoor: "/webhooks/twilio/frontdoor",
    twilioEmployee: (employeeId: string) => `/webhooks/twilio/${employeeId}`,
    gmail: "/webhooks/gmail",
    gmailOauthCallback: "/webhooks/gmail/oauth/callback",
    stripe: "/webhooks/stripe",
  },
} as const;

/** Per-employee Hermes gateway port: 8100 + n. */
export function gatewayPort(base: number, n: number): number {
  return base + n;
}

/** Per-client subdomain Caddy maps to the gateway port. */
export function clientSubdomain(clientSlug: string, baseDomain: string): string {
  return `${clientSlug}.agents.${baseDomain}`;
}
