"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  EmployeeExperienceModelV1,
  UiVariantIntentRequest,
  UiVariantIntentResult,
} from "@amtech/shared";
import type { ResourcePayload } from "../../agent/[employeeId]/surface-types";
import {
  applyOwnerWorkEvent,
  protocolAuthority,
  type OwnerStreamScope,
} from "../../agent/[employeeId]/owner-stream-state";
import {
  openOwnerProjectionController,
  type OwnerProjectionState,
} from "../../agent/[employeeId]/owner-projection-controller";

export type EvidenceSource = "live" | "fixture";

export interface LiveEmployeeProjectionState {
  employeeId: string;
  resources: ResourcePayload;
  scope: OwnerStreamScope | null;
  streamState: OwnerProjectionState;
  evidenceSource: EvidenceSource;
  progress: string;
  notice: string;
  loading: boolean;
  refresh: () => Promise<void>;
  sendMessage: (message: string, intentId?: string) => Promise<{ ok: boolean; message: string }>;
  resolveApproval: (approvalId: string, response: "approved" | "rejected") => Promise<{ ok: boolean; message: string }>;
  dispatchVariantIntent: (
    request: UiVariantIntentRequest,
    model: EmployeeExperienceModelV1,
  ) => Promise<UiVariantIntentResult>;
}

const EMPTY: ResourcePayload = {
  account_id: "",
  assignment_id: "",
  employee_id: "",
  artifacts: [],
  approvals: [],
  messages: [],
  connectors: [],
  stripe_invoices: [],
  reminders: [],
  job_commitments: [],
  work_events: [],
  abilities: [],
  capabilities: [],
  surface_envelopes: [],
  connection_surfaces: [],
  resurface_items: [],
  outputs: [],
  tasks: [],
};

const LiveEmployeeContext = createContext<LiveEmployeeProjectionState | null>(null);

export function LiveEmployeeProvider({
  employeeId,
  children,
}: {
  employeeId: string;
  children: ReactNode;
}) {
  const [resources, setResources] = useState<ResourcePayload>(EMPTY);
  const [scope, setScope] = useState<OwnerStreamScope | null>(null);
  const [streamState, setStreamState] = useState<OwnerProjectionState>("connecting");
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const resourcesRef = useRef<ResourcePayload>(EMPTY);
  const scopeRef = useRef<OwnerStreamScope | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const installResources = useCallback((next: ResourcePayload) => {
    const installed = { ...EMPTY, ...next };
    resourcesRef.current = installed;
    setResources(installed);
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = null;
  }, []);

  const refresh = useCallback(async () => {
    const currentScope = scopeRef.current;
    if (!currentScope) {
      setStreamState("offline");
      setNotice("Live state is unavailable until AMTECH installs the exact owner projection scope.");
      return;
    }
    try {
      const response = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST", cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice(readable(json.error ?? "live_resource_refresh_failed"));
        setStreamState("offline");
        return;
      }
      if (
        json.account_id !== currentScope.account_id
        || json.employee_id !== currentScope.employee_id
        || json.assignment_id !== currentScope.assignment_id
      ) {
        scopeRef.current = null;
        setScope(null);
        setStreamState("offline");
        setNotice("AMTECH denied a live resource refresh because its scope did not match the installed owner stream.");
        return;
      }
      installResources(json as ResourcePayload);
      setNotice("");
    } catch {
      setNotice("Live resource refresh failed. No fixture data was installed and no owner intent was replayed.");
      setStreamState("offline");
    } finally {
      setLoading(false);
    }
  }, [employeeId, installResources]);

  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer();
    refreshTimer.current = window.setTimeout(() => { void refresh(); }, 160);
  }, [clearRefreshTimer, refresh]);

  useEffect(() => {
    clearRefreshTimer();
    scopeRef.current = null;
    setScope(null);
    installResources({ ...EMPTY, employee_id: employeeId });
    setProgress("");
    setNotice("");
    setLoading(true);
    setStreamState("connecting");

    const close = openOwnerProjectionController({
      employeeId,
      eventKinds: ["assistant_delta", "work_event", "work_progress", "approval_update", "run_completed"],
      onState: setStreamState,
      onSnapshot(snapshot, nextScope) {
        scopeRef.current = nextScope;
        setScope(nextScope);
        installResources(snapshot);
        setProgress("");
        setNotice("");
        setLoading(false);
      },
      onEvent(kind, payload, nextScope) {
        scopeRef.current = nextScope;
        setScope(nextScope);
        if (kind === "work_event") {
          const applied = applyOwnerWorkEvent(resourcesRef.current, payload, nextScope);
          if (applied.accepted) {
            scopeRef.current = applied.scope;
            setScope(applied.scope);
            installResources(applied.resources);
          } else if (applied.reason === "scope_mismatch" || applied.reason === "invalid_event") {
            scopeRef.current = null;
            setScope(null);
            setStreamState("offline");
            setNotice(`AMTECH stopped an invalid live work projection (${applied.reason}).`);
          }
          return;
        }
        if (kind === "work_progress") {
          const verb = typeof payload.verb === "string" ? payload.verb : "Working";
          const state = typeof payload.state === "string" ? payload.state : "working";
          setProgress(state === "completed" ? "" : verb);
          if (state === "completed") scheduleRefresh();
          return;
        }
        if (kind === "approval_update" || kind === "run_completed") scheduleRefresh();
      },
      onDenied(reason) {
        scopeRef.current = null;
        setScope(null);
        setLoading(false);
        setProgress("");
        setNotice(`AMTECH denied an invalid live projection (${reason}). No owner action was replayed.`);
      },
    });

    return () => {
      close();
      clearRefreshTimer();
      scopeRef.current = null;
      setScope(null);
      installResources({ ...EMPTY, employee_id: employeeId });
      setProgress("");
      setNotice("");
      setLoading(true);
      setStreamState("connecting");
    };
  }, [clearRefreshTimer, employeeId, installResources, scheduleRefresh]);

  const sendMessage = useCallback(async (message: string, intentId?: string) => {
    const body = message.trim();
    const authority = protocolAuthority(scopeRef.current);
    if (!body) return { ok: false, message: "Message is empty." };
    if (!authority) return { ok: false, message: "Live assignment authority is not installed. No owner intent was sent." };
    try {
      const response = await fetch(`/api/employee/${employeeId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body,
          intent_id: intentId ?? createIntentId(employeeId),
          ...authority,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: readable(json.error ?? "live_message_not_accepted") };
      return { ok: true, message: response.status === 202 ? "Queued under live assignment authority." : "Accepted under live assignment authority." };
    } catch {
      return { ok: false, message: "The live message request ended before acceptance was proved. Reconnect did not replay it." };
    }
  }, [employeeId]);

  const resolveApproval = useCallback(async (approvalId: string, response: "approved" | "rejected") => {
    const authority = protocolAuthority(scopeRef.current);
    if (!authority) return { ok: false, message: "Live approval authority is not installed. No decision was sent." };
    try {
      const result = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: approvalId,
          owner_response: response,
          ...authority,
        }),
      });
      const json = await result.json().catch(() => ({}));
      if (result.ok) scheduleRefresh();
      return {
        ok: result.ok,
        message: result.ok
          ? String(json.user_facing_summary_hint ?? "Approval decision accepted under live assignment authority.")
          : readable(json.error ?? "live_approval_not_accepted"),
      };
    } catch {
      return { ok: false, message: "The live approval request ended before acceptance was proved. It was not replayed." };
    }
  }, [employeeId, scheduleRefresh]);

  const dispatchVariantIntent = useCallback(async (
    request: UiVariantIntentRequest,
    model: EmployeeExperienceModelV1,
  ) => {
    const intent = model.intents.find((candidate) => candidate.id === request.intent_id);
    if (!intent) return { accepted: false, code: "intent_unknown", message: "That live UI intent is not declared by the model." };
    if (intent.kind === "send_message" && typeof request.value === "string") {
      const result = await sendMessage(request.value, `ui-variant:${employeeId}:${crypto.randomUUID?.() ?? Date.now()}`);
      return { accepted: result.ok, code: result.ok ? "live_message_accepted" : "live_message_unavailable", message: result.message };
    }
    if (intent.kind === "approve" && intent.target?.kind === "approval") {
      const result = await resolveApproval(intent.target.id, "approved");
      return { accepted: result.ok, code: result.ok ? "live_approval_accepted" : "live_approval_unavailable", message: result.message };
    }
    if (intent.kind === "respond" && typeof request.value === "string") {
      const result = await sendMessage(request.value, `ui-variant:${employeeId}:${crypto.randomUUID?.() ?? Date.now()}`);
      return { accepted: result.ok, code: result.ok ? "live_response_accepted" : "live_response_unavailable", message: result.message };
    }
    if (intent.kind === "open_resource") {
      const href = safeModelHref(request.value ?? intent.target?.id, model, employeeId);
      if (!href) return { accepted: false, code: "open_resource_unavailable", message: "No owner-safe resource href is available for that live intent." };
      window.open(href, "_blank", "noopener,noreferrer");
      return { accepted: true, code: "open_resource_started", message: "Opened an owner-safe resource URL from the live model." };
    }
    return {
      accepted: false,
      code: "live_intent_unavailable",
      message: "This Phase 1 live UI intent is unavailable. Use the reference client for governed actions.",
    };
  }, [employeeId, resolveApproval, sendMessage]);

  const value = useMemo<LiveEmployeeProjectionState>(() => ({
    employeeId,
    resources,
    scope,
    streamState,
    evidenceSource: "live",
    progress,
    notice,
    loading,
    refresh,
    sendMessage,
    resolveApproval,
    dispatchVariantIntent,
  }), [dispatchVariantIntent, employeeId, loading, notice, progress, refresh, resources, resolveApproval, scope, sendMessage, streamState]);

  return <LiveEmployeeContext.Provider value={value}>{children}</LiveEmployeeContext.Provider>;
}

export function useLiveEmployee(): LiveEmployeeProjectionState {
  const value = useContext(LiveEmployeeContext);
  if (!value) throw new Error("live_employee_provider_required");
  return value;
}

function createIntentId(employeeId: string): string {
  const entropy = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `ui-lab:${employeeId}:${entropy}`.slice(0, 160);
}

function readable(value: unknown): string {
  return String(value ?? "unavailable").replace(/[_:-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeModelHref(value: unknown, model: EmployeeExperienceModelV1, employeeId: string): string | null {
  const requested = typeof value === "string"
    ? value
    : value && typeof value === "object" && "href" in value
      ? String((value as { href?: unknown }).href ?? "")
      : "";
  const outputHref = model.outputs.find((output) => output.href === requested || output.id === requested)?.href;
  const href = outputHref ?? requested;
  if (!href) return null;
  if (href.startsWith(`/agent/${employeeId}/`) || href.startsWith(`/ui-lab/employee/${employeeId}/`)) return href;
  return null;
}
