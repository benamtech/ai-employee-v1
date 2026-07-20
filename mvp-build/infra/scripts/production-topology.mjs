export const PRODUCTION_COMPOSE_FILE = "infra/deploy/docker-compose.production.yml";
export const PRODUCTION_ENV_FILE = "infra/deploy/.env.production";
export const PRODUCTION_TUNNEL_OVERLAY_FILE = "infra/deploy/docker-compose.tunnel.yml";
export const PRODUCTION_CONTROL_NETWORK = "amtech_control";

export const PRODUCTION_CONTROL_SERVICES = Object.freeze([
  "manager",
  "model-gateway",
  "host-provisioner",
  "web",
  "caddy",
]);

export const PRODUCTION_CONTAINER_NAMES = Object.freeze({
  manager: "amtech-manager",
  modelGateway: "amtech-model-gateway",
  hostProvisioner: "amtech-host-provisioner",
  web: "amtech-web",
  caddy: "amtech-caddy",
});

export function productionComposeArgs(args = [], overlays = []) {
  return [
    "compose",
    "-f",
    PRODUCTION_COMPOSE_FILE,
    ...overlays.flatMap((file) => ["-f", file]),
    "--env-file",
    PRODUCTION_ENV_FILE,
    ...args,
  ];
}
