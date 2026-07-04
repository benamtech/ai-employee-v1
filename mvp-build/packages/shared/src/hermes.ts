export interface HermesSessionCreateRequest {
  id?: string;
  title?: string;
}

export interface HermesSessionCreateResponse {
  // Real Hermes nests the created id under `session`.
  session?: { id?: string };
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
  // Real Hermes session-chat returns message as an object { role, content }.
  message?: string | { role?: string; content?: string };
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
  // Real Hermes mixes boolean flags with string-valued *_header entries
  // (e.g. session_key_header: "X-Hermes-Session-Key").
  features?: Record<string, boolean | string>;
  endpoints?: Record<string, string>;
}

export interface HermesHealth {
  status?: string;
  [key: string]: unknown;
}
