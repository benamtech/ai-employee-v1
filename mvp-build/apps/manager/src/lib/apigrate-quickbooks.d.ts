/**
 * Narrow ambient types for @apigrate/quickbooks, which ships NO TypeScript
 * declarations of its own (plain index.js — verified directly, no .d.ts files
 * in the package). Covers exactly the surface qbo-client.ts calls; the
 * untyped/loosely-typed surface never leaks past this file + qbo-client.ts.
 * See quickbooks-connector-implementation-plan.md's Client Library Decision.
 */
declare module "@apigrate/quickbooks" {
  export interface QboConnectorConfig {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;
    access_token?: string | null;
    refresh_token?: string | null;
    realm_id?: string | null;
    minor_version?: string | number | null;
    throttle_backoff?: number;
    is_sandbox?: boolean;
    base_url?: string;
  }

  export interface QboOperationOpts {
    reqid?: string;
    minor_version?: string | number;
  }

  export interface QboEntityApi {
    create?(payload: Record<string, unknown>, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    update?(payload: Record<string, unknown>, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    get?(id: string, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    delete?(payload: Record<string, unknown>, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    query?(queryStatementOrParams?: string | Record<string, unknown>, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    voidTransaction?(payload: Record<string, unknown>, opts?: QboOperationOpts): Promise<Record<string, unknown>>;
    sendEmail?(id: string, opts?: { sendTo?: string; minor_version?: string | number }): Promise<Record<string, unknown>>;
  }

  export interface QboAccountingApi {
    [entityHandle: string]: QboEntityApi;
  }

  export class QboConnector {
    constructor(config: QboConnectorConfig);
    realm_id: string | null;
    access_token: string | null;
    refresh_token: string | null;
    accounting: QboAccountingApi & { intuit_tid: string | null; batch(payload: unknown): Promise<unknown> };
    accountingApi(): QboAccountingApi & { intuit_tid: string | null; batch(payload: unknown): Promise<unknown> };
    doFetch(
      method: "GET" | "POST" | "PUT" | "DELETE",
      url: string,
      query?: Record<string, unknown> | null,
      payload?: unknown,
      options?: { headers?: Record<string, string>; entityName?: string },
    ): Promise<unknown>;
  }

  export class ApiError extends Error {
    payload: unknown;
    intuit_tid: string | null;
    constructor(msg: string, payload?: unknown, intuit_tid?: string | null);
  }
  export class ApiThrottlingError extends ApiError {}
  export class ApiAuthError extends Error {}
  export class CredentialsError extends Error {}
  export class TokenRefreshError extends Error {}
}
