import { serve } from "@hono/node-server";
import { buildModelGatewayApp } from "./lib/model-gateway-http.js";

export { buildModelGatewayApp } from "./lib/model-gateway-http.js";

export function startModelGateway(): void {
  const app = buildModelGatewayApp();
  const port = Number(process.env.MODEL_GATEWAY_PORT ?? 8092);
  const hostname = process.env.MODEL_GATEWAY_HOST ?? "0.0.0.0";
  serve({ fetch: app.fetch, port, hostname });
  // eslint-disable-next-line no-console
  console.log(`[model-gateway] listening on ${hostname}:${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) startModelGateway();
