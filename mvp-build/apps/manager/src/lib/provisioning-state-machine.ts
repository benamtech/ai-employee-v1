import { newId, ID_PREFIX } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";

export const PROVISIONING_STATES = [
  "requested",
  "resources_reserved",
  "profile_rendered",
  "credentials_minted",
  "runtime_started",
  "runtime_healthy",
  "routing_activated",
  "channel_configured",
  "welcome_sent",
  "ready",
  "failed",
  "compensating