export interface HermesSessionCreateRequest {
  id?: string;
  title?: string;
}

export interface HermesSessionCreateResponse {
  id?: string;
  session_id?: string;
  error?: string;
}

export interface HermesChatRequest {
  input: string;
  system_message?: string;
}

export interface HermesChatResponse {
  output?: string;
  text?: string;
  message?: string;
  response?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

export interface HermesRunCreateResponse {
  id?: string;
  run_id?: string;
  status?: string;
  state?: string;
  output?: string;
  text?: string;
  message?: string;
  response?: string;
  usage?: HermesChatResponse["usage"];
  error?: string;
}

export interface HermesRunStatusResponse extends HermesRunCreateResponse {
  result?: {
    output?: string;
    text?: string;
    message?: string;
    response?: string;
    usage?: HermesChatResponse["usage"];
  };
}

export interface HermesCapabilities {
  object?: string;
  platform?: string;
  model?: string;
  auth?: Record<string, unknown>;
  features?: Record<string, boolean>;
  endpoints?: Record<string, string>;
}

export interface HermesHealth {
  status?: string;
  [key: string]: unknown;
}

export interface HermesToolsetInfo {
  name?: string;
  enabled?: boolean;
  configured?: boolean;
  tools?: string[];
}

/** Shape of `GET /v1/toolsets` — the ground-truth "what can this employee do".
 *  Note: the api_server introspection route resolves base toolsets only
 *  (`include_default_mcp_servers=False`), so Manager MCP tools do NOT appear
 *  here even though the employee can call them. */
export interface HermesToolsets {
  object?: string;
  platform?: string;
  toolsets?: HermesToolsetInfo[] | Record<string, HermesToolsetInfo>;
  [key: string]: unknown;
}
