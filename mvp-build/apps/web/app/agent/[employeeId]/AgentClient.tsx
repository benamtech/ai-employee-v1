"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkAction, WorkResource } from "@amtech/shared";
import type { ResourcePayload, WorkEventRow } from "./surface-types";
import { fixtureResourcePayload } from "./fixtures";
import {
  attentionItems,
  defaultSelection,
  labelConnector,
  labelStatus,
  ownerize,
  previewItem,
  selectionForResurface,
  statusTone,
  type PreviewSelection,
} from "./lib/surface-model";
import { McpUiResource, type McpUiIntent } from "./components/McpUiResource";
import { WorkObjectRenderer } from "./components/WorkObjectRenderer";

const EMPTY: ResourcePayload = {
  account_id: "",
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
  outputs: [],
  tasks: [],
  connection_surfaces: [],
  resurface_items: [],
};

type PrimaryView = "home" | "talk" | "proof" | "connected";
type PendingMessage = { id: string; role: "owner" | "employee"; body: string; status: "sending" | "failed" };

const VIEWS: Array<{ id: PrimaryView; label: string }> = [
  { id: "home", label: "Home" },
  { id: "talk", label: "Talk" },
  { id: "proof", label: "Proof" },
  { id: "connected", label: "Connected" },
];

export function AgentClient({ employeeId, fixtureMode }: { employeeId: string; fixtureMode: boolean }) {
  const [res, setRes] = useState<ResourcePayload>(() => (fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY));
  const [view, setView] = useState<PrimaryView>("home");
  const [selected, setSelected] = useState<PreviewSelection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(!fixtureMode);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "reconnecting" | "offline">(fixtureMode ? "live" : "connecting");
  const [pending, setPending] = useState<PendingMessage[]>([]);

  const refresh = useCallback(async () => {
    if (fixtureMode) {
      setRes((current) => {
        const next = current.account_id ? current : fixtureResourcePayload(employeeId);
        setSelected((selection) => selection ?? defaultSelection(next));
        return next;
      });
      setStreamState("live");
      setLoading(false);
      return;
    }

    const r = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(ownerError(json.error ?? "Could not load Avery's work."));
      setStreamState("offline");
      setLoading(false);
      return;
    }
    const next = { ...EMPTY, ...json };
    setRes(next);
    setSelected((current) => current ?? defaultSelection(next));
    setLoading(false);
  }, [employeeId, fixtureMode]);

  const mergeWorkEvent = useCallback((ev: WorkEventRow) => {
    setRes((prev) => {
      const others = prev.work_events.filter((w) => w.id !== ev.id);
      return { ...prev, work_events: [ev, ...others] };
    });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (fixtureMode) return;
    let cancelled = false;
    async function beat() {
      if (cancelled) return;
      await fetch(`/api/employee/${employeeId}/heartbeat`, { method: "POST" }).catch(() => {});
    }
    void beat();
    const timer = window.setInterval(() => { void beat(); }, 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [employeeId, fixtureMode]);

  useEffect(() => {
    if (fixtureMode) return;
    let es: EventSource | null = null;
    let closed = false;
    let backoff = 1000;

    function connect() {
      if (closed) return;
      setStreamState((s) => (s === "offline" ? "reconnecting" : "connecting"));
      es = new EventSource(`/api/employee/${employeeId}/events`);
      es.addEventListener("open", () => {
        setStreamState("live");
        backoff = 1000;
      });
      es.addEventListener("snapshot", (event) => {
        try {
          const json = JSON.parse((event as MessageEvent).data);
          const snap = json?.snapshot ?? json;
          if (snap?.account_id) {
            const next = { ...EMPTY, ...snap };
            setRes(next);
            setSelected((current) => current ?? defaultSelection(next));
            setStreamState("live");
          }
        } catch { /* polling remains fallback */ }
      });
      es.addEventListener("work_event", (event) => {
        try {
          const json = JSON.parse((event as MessageEvent).data);
          if (json?.event?.id) mergeWorkEvent(json.event);
        } catch { /* ignore malformed stream chunks */ }
      });
      es.addEventListener("approval_update", () => { void refresh(); });
      es.onerror = () => {
        es?.close();
        if (closed) return;
        setStreamState("reconnecting");
        window.setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15000);
      };
    }

    connect();
    const pollTimer = window.setInterval(() => { void refresh(); }, 20000);
    return () => { closed = true; es?.close(); window.clearInterval(pollTimer); };
  }, [employeeId, fixtureMode, refresh, mergeWorkEvent]);

  const sendToEmployee = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (fixtureMode) {
      const created = new Date().toISOString();
      setRes((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: `fixture_owner_${Date.now()}`, direction: "from_owner", source: "web", channel: "web", body: trimmed, status: "delivered", created_at: created },
          {
            id: `fixture_avery_${Date.now()}`,
            direction: "to_owner",
            source: "employee",
            channel: "web",
            body: "I picked that up. I will prepare the work, ask before anything leaves the business, and save the receipt when it is done.",
            status: "delivered",
            provider_id: "fixture",
            created_at: created,
          },
        ],
      }));
      setStatus("Avery picked that up.");
      setView("talk");
      return;
    }

    const pendingId = `pending:${Date.now()}`;
    setPending((p) => [...p, { id: pendingId, role: "owner", body: trimmed, status: "sending" }]);
    const r = await fetch(`/api/employee/${employeeId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setPending((p) => p.map((m) => (m.id === pendingId ? { ...m, status: "failed" } : m)));
      setStatus(ownerError(json.error ?? "Message failed."));
      return;
    }
    setPending((p) => p.filter((m) => m.id !== pendingId));
    await refresh();
  }, [employeeId, fixtureMode, refresh]);

  const resolveApproval = useCallback(async (approvalId: string, response: "approved" | "rejected") => {
    if (!approvalId) return;
    if (fixtureMode) {
      setRes((prev) => ({
        ...prev,
        approvals: prev.approvals.filter((approval) => approval.id !== approvalId),
        tasks: (prev.tasks ?? []).map((task) => task.target_id === approvalId ? {
          ...task,
          status: response === "approved" ? "done" : "blocked",
          summary: response === "approved" ? "Approved. Avery is carrying it forward." : "Declined. Avery will not proceed.",
        } : task),
        resurface_items: (prev.resurface_items ?? []).filter((item) => item.proof.approval_id !== approvalId),
        work_events: [
          {
            id: `fixture_${response}_${Date.now()}`,
            event_type: "approval_result",
            status: response === "approved" ? "done" : "rejected",
            created_at: new Date().toISOString(),
            work_event_descriptor: {
              account_id: prev.account_id,
              employee_id: prev.employee_id ?? employeeId,
              move: "notify",
              title: response === "approved" ? "Approved. Avery can continue." : "Declined. Avery is holding.",
              summary: response === "approved" ? "Avery is completing the approved work and saving proof." : "Avery will not send, spend, publish, or write for that item.",
              deliverable: { type: "recommendation", title: "Approval result", refs: { approval_id: approvalId }, acceptance: ["acknowledge"] },
              proof: { fixture: "avery_home", approval_id: approvalId },
            },
          },
          ...prev.work_events,
        ],
      }));
      setStatus(response === "approved" ? "Approved. Avery can continue." : "Declined. Avery is holding.");
      setView("proof");
      setSheetOpen(false);
      return;
    }

    if (!res.account_id) { setStatus("Account context is missing."); return; }
    const r = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: res.account_id, approval_id: approvalId, owner_response: response }),
    });
    const json = await r.json().catch(() => ({}));
    setStatus(json.user_facing_summary_hint ?? ownerError(json.error ?? "Updated."));
    await refresh();
  }, [employeeId, fixtureMode, res.account_id, refresh]);

  function select(selection: PreviewSelection) {
    setSelected(selection);
    setSheetOpen(true);
  }

  async function handleObjectAction(resource: WorkResource, action: WorkAction["action"], note?: string) {
    if ((action === "approve" || action === "reject") && resource.resource_type === "approval") {
      await resolveApproval(resource.resource_id, action === "approve" ? "approved" : "rejected");
      return;
    }
    if (action === "respond" || action === "edit" || action === "approve" || action === "reject") {
      await sendToEmployee(`${resource.title}: ${note ?? actionPrompt(action)}`);
      return;
    }
    setStatus("Saved.");
  }

  function sendComposer() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendToEmployee(text);
  }

  const preview = useMemo(() => previewItem(res, selected), [res, selected]);
  const needs = useMemo(() => attentionItems(res), [res]);
  const featuredNeed = needs[0] ? previewItem(res, selectionForResurface(needs[0])) : null;
  const messages = useMemo(() => [
    ...res.messages.map((m) => ({ id: m.id, role: m.direction === "to_owner" ? "employee" as const : "owner" as const, body: m.body, status: m.status, created_at: m.created_at })),
    ...pending.map((p) => ({ ...p, created_at: new Date().toISOString() })),
  ], [res.messages, pending]);
  const watching = useMemo(() => watchingItems(res), [res]);
  const proof = useMemo(() => proofItems(res), [res]);
  const hasAnyWork = Boolean(res.work_events.length || (res.tasks?.length ?? 0) || (res.outputs?.length ?? 0) || res.approvals.length || (res.surface_envelopes?.length ?? 0));

  return (
    <main className="avery-root">
      <style>{AVERY_UI_CSS}</style>
      <header className="avery-top">
        <button className="avery-mark" type="button" onClick={() => setView("home")} aria-label="Go to Home">
          <span>AMTECH</span>
          <strong>{res.employee?.name ?? "Avery"}</strong>
        </button>
        <nav className="avery-nav" aria-label="Owner navigation">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <span className={`avery-reach ${streamState === "live" ? "ok" : "warn"}`}>
          {streamState === "live" ? "Avery is here" : "Reconnecting"}
        </span>
      </header>

      {status ? <div className="avery-banner">{status}</div> : null}

      <section className={sheetOpen && preview ? "avery-layout with-sheet" : "avery-layout"} aria-busy={loading}>
        <section className="avery-main">
          {loading ? <QuietState title="Avery is getting the business picture" body="The first screen will show what needs you, what Avery is watching, and recent proof." /> : null}
          {!loading && view === "home" ? (
            <HomeView
              employeeName={res.employee?.name ?? "Avery"}
              businessName={businessName(res)}
              hasAnyWork={hasAnyWork}
              needs={needs}
              featuredResource={featuredNeed?.resource}
              watching={watching}
              proof={proof}
              input={input}
              setInput={setInput}
              onSend={sendComposer}
              onSelect={select}
              onAction={handleObjectAction}
              onView={setView}
            />
          ) : null}
          {!loading && view === "talk" ? (
            <TalkView messages={messages} input={input} setInput={setInput} onSend={sendComposer} onSelect={select} />
          ) : null}
          {!loading && view === "proof" ? (
            <ProofView proof={proof} events={res.work_events} onSelect={select} />
          ) : null}
          {!loading && view === "connected" ? (
            <ConnectedView res={res} onSelect={select} />
          ) : null}
        </section>

        <WorkSheet
          res={res}
          preview={preview}
          selection={selected}
          open={sheetOpen && Boolean(preview)}
          onClose={() => setSheetOpen(false)}
          onAction={handleObjectAction}
          onGeneratedIntent={(intent, approvalId) => {
            if (intent === "accept" || intent === "accept_all") {
              void resolveApproval(approvalId ?? "", "approved");
            } else if (intent === "reject") {
              void resolveApproval(approvalId ?? "", "rejected");
            } else {
              void sendToEmployee("Avery, use my response from this work surface.");
            }
          }}
        />
      </section>
    </main>
  );
}

function HomeView({
  employeeName,
  businessName,
  hasAnyWork,
  needs,
  featuredResource,
  watching,
  proof,
  input,
  setInput,
  onSend,
  onSelect,
  onAction,
  onView,
}: {
  employeeName: string;
  businessName: string;
  hasAnyWork: boolean;
  needs: ReturnType<typeof attentionItems>;
  featuredResource?: WorkResource;
  watching: ReturnType<typeof watchingItems>;
  proof: ReturnType<typeof proofItems>;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onSelect: (selection: PreviewSelection) => void;
  onAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void;
  onView: (view: PrimaryView) => void;
}) {
  return (
    <div className="home-stack">
      <section className="avery-presence">
        <div>
          <p>{businessName}</p>
          <h1>{employeeName} is here.</h1>
          <span>Talk naturally. Avery prepares the work, stops for your say, and saves proof when it is done.</span>
        </div>
      </section>

      <AveryComposer value={input} setValue={setInput} onSend={onSend} />

      {!hasAnyWork ? (
        <section className="first-task">
          <p>Start with real work</p>
          <div className="prompt-grid">
            {[
              "Avery, make an estimate from today's walkthrough.",
              "Watch customer replies and bring back anything urgent.",
              "Prepare a deposit request and show me before sending.",
            ].map((prompt) => (
              <button key={prompt} type="button" onClick={() => setInput(prompt)}>{prompt}</button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="needs-panel" aria-label="Needs your say">
        <PanelTitle title="Needs your say" detail={needs.length ? "Avery stopped before judgment, customer, money, or blocked work." : "Nothing is waiting on you right now."} />
        {needs.length ? (
          <div className="need-list">
            {featuredResource ? (
              <div className="featured-review">
                <WorkObjectRenderer resource={featuredResource} compact onAction={(action, note) => onAction(featuredResource, action, note)} />
              </div>
            ) : null}
            {needs.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                className="need-card"
                onPointerUp={() => onSelect(selectionForResurface(item))}
                onClick={() => onSelect(selectionForResurface(item))}
              >
                <span>{needKind(item.kind)}</span>
                <strong>{item.title}</strong>
                <p>{item.why}</p>
              </button>
            ))}
          </div>
        ) : <QuietState title="Avery is not waiting on you" body="When permission, a missing detail, or a blocked connection matters, it appears here." />}
      </section>

      <section className="watch-proof-grid">
        <div className="quiet-panel">
          <PanelTitle title="Avery is watching" detail="Quiet awareness, not a control room." />
          {watching.slice(0, 4).map((item) => (
            <button key={item.id} type="button" className="quiet-row" onClick={() => onSelect(item.selection)}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </button>
          ))}
          {watching.length > 4 ? <button className="panel-link" type="button" onClick={() => onView("connected")}>See connected accounts</button> : null}
        </div>
        <div className="quiet-panel">
          <PanelTitle title="Recent proof" detail="Receipts settle here after work moves." />
          {proof.slice(0, 3).map((item) => (
            <button key={item.id} type="button" className="quiet-row proof" onClick={() => onSelect(item.selection)}>
              <span>{item.when}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </button>
          ))}
          <button className="panel-link" type="button" onClick={() => onView("proof")}>Open proof</button>
        </div>
      </section>
    </div>
  );
}

function TalkView({
  messages,
  input,
  setInput,
  onSend,
  onSelect,
}: {
  messages: Array<{ id: string; role: "owner" | "employee"; body: string; status: string; created_at: string }>;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onSelect: (selection: PreviewSelection) => void;
}) {
  return (
    <section className="talk-view">
      <PanelTitle title="Talk to Avery" detail="Conversation is the command layer. Durable work becomes approvals, proof, and objects." />
      <div className="message-list">
        {messages.length ? messages.map((message) => (
          <button key={message.id} className={`message ${message.role}`} type="button" onClick={() => onSelect({ kind: "message", id: message.id })}>
            <span>{message.role === "owner" ? "You" : "Avery"}</span>
            <p>{message.body}</p>
            {message.status !== "delivered" ? <small>{labelStatus(message.status)}</small> : null}
          </button>
        )) : <QuietState title="Start with normal words" body="Ask Avery to estimate a job, follow up with a customer, prepare a deposit, or explain what is blocked." />}
      </div>
      <AveryComposer value={input} setValue={setInput} onSend={onSend} compact />
    </section>
  );
}

function ProofView({ proof, events, onSelect }: { proof: ReturnType<typeof proofItems>; events: ResourcePayload["work_events"]; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <section className="proof-view">
      <PanelTitle title="Proof" detail="What Avery did, what was held, and where the receipt lives." />
      <div className="proof-list">
        {proof.length ? proof.map((item) => (
          <button key={item.id} type="button" className="proof-row" onClick={() => onSelect(item.selection)}>
            <span>{item.when}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </button>
        )) : <QuietState title="No proof yet" body="Approvals, sends, receipts, payment events, and completed work will appear here." />}
        {events.filter((event) => !proof.some((item) => item.id === event.id)).slice(0, 8).map((event) => (
          <button key={event.id} type="button" className="proof-row muted" onClick={() => onSelect({ kind: "work_event", id: event.id })}>
            <span>{formatShortDate(event.created_at)}</span>
            <strong>{event.work_event_descriptor?.title ?? ownerize(event.event_type)}</strong>
            <p>{event.work_event_descriptor?.summary ?? "Avery recorded this work."}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ConnectedView({ res, onSelect }: { res: ResourcePayload; onSelect: (selection: PreviewSelection) => void }) {
  const connections = res.connection_surfaces ?? [];
  const capabilities = res.capabilities ?? [];
  return (
    <section className="connected-view">
      <PanelTitle title="Connected" detail="What Avery can do now, what needs setup, and what still asks first." />
      <div className="connected-grid">
        {connections.length ? connections.map((connection) => (
          <button key={connection.id} type="button" className="connection-card" onClick={() => onSelect({ kind: "connection", id: connection.id })}>
            <span>{ownerize(connection.category)}</span>
            <strong>{connection.label}</strong>
            <p>{connection.health ?? connection.what_employee_can_do}</p>
            <small>{labelStatus(connection.state)}</small>
          </button>
        )) : res.connectors.map((connector) => (
          <button key={connector.id} type="button" className="connection-card" onClick={() => onSelect({ kind: "connector", id: connector.id })}>
            <span>Connected account</span>
            <strong>{labelConnector(connector.provider)}</strong>
            <p>{connector.last_error ?? connector.external_email ?? connector.external_label ?? "Ready when Avery needs it."}</p>
            <small>{labelStatus(connector.status)}</small>
          </button>
        ))}
      </div>
      <div className="ability-panel">
        <PanelTitle title="What Avery can do" detail="Shown as readiness, not a feature catalog." />
        {capabilities.map((capability) => (
          <button key={capability.id} type="button" className="ability-row" onClick={() => onSelect({ kind: "capability", id: capability.id })}>
            <span>{ownerize(capability.category)}</span>
            <strong>{capability.label}</strong>
            <p>{capability.summary}</p>
            <small>{capability.can_run_now ? "Ready with safeguards" : capability.setup_requirement ?? labelStatus(capability.status)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function WorkSheet({
  res,
  preview,
  selection,
  open,
  onClose,
  onAction,
  onGeneratedIntent,
}: {
  res: ResourcePayload;
  preview: ReturnType<typeof previewItem>;
  selection: PreviewSelection | null;
  open: boolean;
  onClose: () => void;
  onAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void;
  onGeneratedIntent: (intent: McpUiIntent, approvalId: string | undefined, payload: Record<string, unknown>) => void;
}) {
  if (!open || !preview || !selection) return null;
  const event = selection.kind === "work_event" ? res.work_events.find((item) => item.id === selection.id) : null;
  const message = selection.kind === "message" ? res.messages.find((item) => item.id === selection.id) : null;
  return (
    <aside className="work-sheet" aria-label="Avery work review">
      <button type="button" className="sheet-close" onClick={onClose}>Close</button>
      <header className="sheet-head">
        <span>{preview.eyebrow}</span>
        <h2>{preview.title}</h2>
        {preview.summary ? <p>{preview.summary}</p> : null}
        {preview.status ? <small>{labelStatus(preview.status)}</small> : null}
      </header>
      {preview.resource ? <WorkObjectRenderer resource={preview.resource} onAction={(action, note) => onAction(preview.resource!, action, note)} /> : null}
      {event?.work_event_descriptor?.deliverable?.view ? <GeneratedView descriptor={event.work_event_descriptor} onIntent={onGeneratedIntent} /> : null}
      {message ? (
        <section className="message-card">
          <span>{message.direction === "to_owner" ? "Avery" : "You"}</span>
          <p>{message.body}</p>
        </section>
      ) : null}
    </aside>
  );
}

function GeneratedView({
  descriptor,
  onIntent,
}: {
  descriptor: NonNullable<WorkEventRow["work_event_descriptor"]>;
  onIntent: (intent: McpUiIntent, approvalId: string | undefined, payload: Record<string, unknown>) => void;
}) {
  const deliverable = descriptor.deliverable;
  const view = deliverable?.view;
  if (!view) return null;
  if (deliverable?.ui_resource) {
    return <McpUiResource resource={deliverable.ui_resource} onIntent={onIntent} />;
  }
  return (
    <section className="generated-view">
      <PanelTitle title={`Generated ${view.kind}`} detail="Avery made this to make the work easier to inspect." />
      {view.kind === "table" ? (
        <table>
          <thead><tr>{view.columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
          <tbody>{view.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}:${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
        </table>
      ) : null}
      {view.kind === "schedule" ? view.slots.map((slot) => (
        <button key={`${slot.when}:${slot.label}`} type="button" className="quiet-row" onClick={() => onIntent("respond", deliverable?.refs.approval_id, { slot })}>
          <span>{slot.when}</span>
          <strong>{slot.label}</strong>
          <p>Candidate time Avery prepared.</p>
        </button>
      )) : null}
      {view.kind === "diff" ? (
        <div className="diff-grid">
          <div><strong>Before</strong>{Object.entries(view.before).map(([key, value]) => <KeyValue key={key} label={key} value={value} />)}</div>
          <div><strong>After</strong>{Object.entries(view.after).map(([key, value]) => <KeyValue key={key} label={key} value={value} />)}</div>
        </div>
      ) : null}
      {view.kind === "form" ? view.fields.map((field) => <KeyValue key={field.name} label={field.label} value={field.value ?? (field.required ? "Needs answer" : "Optional")} />) : null}
    </section>
  );
}

function AveryComposer({ value, setValue, onSend, compact = false }: { value: string; setValue: (value: string) => void; onSend: () => void; compact?: boolean }) {
  return (
    <section className={compact ? "avery-composer compact" : "avery-composer"} aria-label="Tell Avery">
      <span>Tell Avery</span>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Tell Avery what happened or what you want done..."
        rows={compact ? 3 : 4}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) onSend();
        }}
      />
      <button type="button" onClick={onSend}>Send to Avery</button>
    </section>
  );
}

function PanelTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <header className="panel-title">
      <h2>{title}</h2>
      {detail ? <p>{detail}</p> : null}
    </header>
  );
}

function QuietState({ title, body }: { title: string; body: string }) {
  return (
    <div className="quiet-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value?: string | null | number | boolean }) {
  if (value == null) return null;
  return (
    <div className="key-value">
      <span>{ownerize(label)}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

function watchingItems(res: ResourcePayload) {
  return (res.connection_surfaces ?? []).map((connection) => ({
    id: connection.id,
    label: connection.label,
    title: connection.state === "needs_you" || connection.state === "not_connected" ? `${connection.label} needs setup` : readyTitle(connection.label),
    body: connection.health ?? connection.what_employee_can_do,
    selection: { kind: "connection" as const, id: connection.id },
  }));
}

function readyTitle(label: string): string {
  const plural = ["payments", "files", "photos"].some((word) => label.toLowerCase().includes(word));
  return `${label} ${plural ? "are" : "is"} ready`;
}

function proofItems(res: ResourcePayload) {
  return res.work_events
    .filter((event) => event.status === "done" || event.status === "completed" || event.status === "approved" || event.work_event_descriptor?.move === "notify")
    .slice(0, 10)
    .map((event) => ({
      id: event.id,
      title: event.work_event_descriptor?.title ?? ownerize(event.event_type),
      body: event.work_event_descriptor?.summary ?? "Avery saved a receipt.",
      when: formatShortDate(event.created_at),
      selection: { kind: "work_event" as const, id: event.id },
    }));
}

function businessName(res: ResourcePayload): string {
  const email = res.connection_surfaces?.find((connection) => connection.account_label)?.account_label;
  if (email) return email;
  return res.employee?.profile_id ? ownerize(res.employee.profile_id) : "Your business";
}

function needKind(kind: string): string {
  if (kind === "review" || kind === "approval") return "Permission";
  if (kind === "question") return "Question";
  if (kind === "connector") return "Connection";
  if (kind === "failure") return "Needs help";
  return ownerize(kind);
}

function actionPrompt(action: WorkAction["action"]): string {
  if (action === "approve") return "I approve this if it is safe to continue.";
  if (action === "reject") return "Do not proceed with this.";
  if (action === "edit") return "Please revise this with me.";
  return "Please review this with me.";
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function ownerError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("auth") || lower.includes("token")) return "Your session needs attention. Refresh and sign in again.";
  if (lower.includes("network") || lower.includes("fetch")) return "Avery could not reach the business. Try again.";
  return message;
}

const AVERY_UI_CSS = `
  .avery-root {
    --ink: #111717;
    --ink-soft: #344242;
    --muted: #687777;
    --paper: #fffdf8;
    --panel: rgba(255,255,255,.84);
    --panel-solid: #ffffff;
    --wash: #f3f0e8;
    --line: rgba(62,76,72,.18);
    --blue: #276b82;
    --blue-soft: #dceff4;
    --green: #23734d;
    --green-soft: #e4f3e9;
    --amber: #a86a12;
    --amber-soft: #fff2cf;
    --red: #b4323a;
    --red-soft: #ffe5e8;
    --shadow: 0 24px 70px rgba(43,52,48,.14);
    --font: var(--font-inter), Inter, -apple-system, "Helvetica Neue", Arial, sans-serif;
    min-height: 100dvh;
    background:
      radial-gradient(circle at 50% -20%, rgba(218,239,244,.9), transparent 36rem),
      linear-gradient(180deg, #fffaf0 0%, #f4f1e9 44%, #ebe9e1 100%);
    color: var(--ink);
    font-family: var(--font);
  }
  .avery-top {
    min-height: 68px;
    display: grid;
    grid-template-columns: minmax(150px, 220px) minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 12px clamp(14px, 3vw, 28px);
    position: sticky;
    top: 0;
    z-index: 30;
    backdrop-filter: blur(18px) saturate(1.1);
    background: rgba(255,253,248,.74);
    border-bottom: 1px solid rgba(255,255,255,.9);
    box-shadow: 0 1px 0 rgba(60,70,65,.08);
  }
  .avery-mark {
    border: 0;
    background: transparent;
    text-align: left;
    color: var(--ink);
    cursor: pointer;
    display: grid;
    gap: 2px;
    padding: 0;
  }
  .avery-mark span, .avery-reach, .panel-title p, .avery-composer span, .need-card span, .quiet-row span, .proof-row span, .connection-card span, .ability-row span, .sheet-head span, .sheet-head small, .message span, .message-card span, .first-task p, .key-value span {
    font-size: 11px;
    line-height: 1.2;
    font-weight: 760;
    color: var(--muted);
    text-transform: uppercase;
  }
  .avery-mark span { color: #9f1f2b; }
  .avery-mark strong { font-size: 24px; line-height: 1; font-weight: 850; letter-spacing: 0; }
  .avery-nav {
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  .avery-nav button {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid transparent;
    background: rgba(255,255,255,.44);
    color: var(--ink-soft);
    font: 720 14px/1 var(--font);
    cursor: pointer;
  }
  .avery-nav button.active {
    background: var(--ink);
    color: #fffdf8;
    box-shadow: 0 10px 24px rgba(17,23,23,.16);
  }
  .avery-reach {
    justify-self: end;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.72);
    border: 1px solid var(--line);
    white-space: nowrap;
  }
  .avery-reach.ok { color: var(--green); }
  .avery-reach.warn { color: var(--amber); }
  .avery-banner {
    margin: 12px auto 0;
    width: min(100% - 28px, 1060px);
    border: 1px solid rgba(39,107,130,.18);
    background: rgba(220,239,244,.8);
    color: var(--ink);
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 14px;
  }
  .avery-layout {
    width: min(100% - 28px, 1120px);
    margin: 18px auto 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    padding-bottom: 96px;
  }
  .avery-layout.with-sheet {
    width: min(100% - 28px, 1320px);
    grid-template-columns: minmax(0, 1fr) minmax(380px, 470px);
    align-items: start;
  }
  .avery-main { min-width: 0; }
  .home-stack, .talk-view, .proof-view, .connected-view {
    display: grid;
    gap: 16px;
  }
  .avery-presence {
    min-height: 238px;
    display: grid;
    align-items: end;
    padding: clamp(22px, 5vw, 46px);
    border-radius: 30px;
    background:
      linear-gradient(140deg, rgba(255,255,255,.92), rgba(233,248,248,.74)),
      radial-gradient(circle at 82% 18%, rgba(255,255,255,.96), transparent 12rem);
    border: 1px solid rgba(255,255,255,.94);
    box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,.92);
  }
  .avery-presence p {
    margin: 0 0 10px;
    color: var(--blue);
    font-size: 13px;
    font-weight: 760;
  }
  .avery-presence h1 {
    max-width: 11ch;
    margin: 0;
    font-size: clamp(44px, 8vw, 86px);
    line-height: .92;
    letter-spacing: 0;
  }
  .avery-presence span {
    display: block;
    max-width: 58ch;
    margin-top: 18px;
    color: var(--ink-soft);
    font-size: 18px;
    line-height: 1.45;
  }
  .avery-composer {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.92);
    background: var(--panel);
    box-shadow: 0 18px 46px rgba(43,52,48,.1), inset 0 1px 0 rgba(255,255,255,.9);
  }
  .avery-composer.compact { border-radius: 18px; box-shadow: none; }
  .avery-composer span { color: var(--blue); }
  .avery-composer textarea {
    width: 100%;
    border: 1px solid rgba(52,66,66,.16);
    border-radius: 16px;
    background: rgba(255,255,255,.88);
    color: var(--ink);
    padding: 15px;
    resize: vertical;
    outline: none;
    font: 520 17px/1.45 var(--font);
    box-shadow: inset 0 1px 8px rgba(43,52,48,.06);
  }
  .avery-composer textarea:focus {
    border-color: rgba(39,107,130,.45);
    box-shadow: 0 0 0 4px rgba(39,107,130,.12), inset 0 1px 8px rgba(43,52,48,.04);
  }
  .avery-composer button, .panel-link, .sheet-close {
    justify-self: end;
    min-height: 42px;
    border: 0;
    border-radius: 999px;
    padding: 0 18px;
    background: linear-gradient(180deg, #2d7991, #1f5f75);
    color: #ffffff;
    font: 760 14px/1 var(--font);
    cursor: pointer;
    box-shadow: 0 12px 24px rgba(31,95,117,.22), inset 0 1px 0 rgba(255,255,255,.32);
  }
  .panel-link, .sheet-close { background: #fff; color: var(--ink); border: 1px solid var(--line); box-shadow: none; }
  .first-task, .needs-panel, .quiet-panel, .talk-view, .proof-view, .connected-view, .work-sheet {
    border: 1px solid rgba(255,255,255,.9);
    background: rgba(255,255,255,.74);
    box-shadow: 0 18px 50px rgba(43,52,48,.09), inset 0 1px 0 rgba(255,255,255,.94);
    border-radius: 24px;
    padding: 16px;
  }
  .first-task p { margin: 0 0 10px; color: var(--blue); }
  .prompt-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .prompt-grid button, .need-card, .quiet-row, .proof-row, .connection-card, .ability-row, .message {
    width: 100%;
    text-align: left;
    border: 1px solid rgba(52,66,66,.14);
    background: rgba(255,255,255,.7);
    color: var(--ink);
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.85);
  }
  .prompt-grid button:hover, .need-card:hover, .quiet-row:hover, .proof-row:hover, .connection-card:hover, .ability-row:hover, .message:hover {
    border-color: rgba(39,107,130,.34);
    background: rgba(255,255,255,.94);
  }
  .panel-title { display: flex; justify-content: space-between; gap: 18px; align-items: end; margin-bottom: 12px; }
  .panel-title h2 { margin: 0; font-size: 24px; line-height: 1.05; letter-spacing: 0; }
  .panel-title p { margin: 0; max-width: 42ch; text-align: right; }
  .need-list { display: grid; gap: 10px; }
  .featured-review {
    border: 1px solid rgba(168,106,18,.2);
    border-radius: 20px;
    background: rgba(255,253,248,.78);
    padding: 14px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
  }
  .need-card { background: linear-gradient(180deg, rgba(255,248,231,.92), rgba(255,255,255,.74)); border-color: rgba(168,106,18,.2); }
  .need-card strong, .quiet-row strong, .proof-row strong, .connection-card strong, .ability-row strong {
    display: block;
    margin-top: 5px;
    font-size: 17px;
    line-height: 1.2;
  }
  .need-card p, .quiet-row p, .proof-row p, .connection-card p, .ability-row p, .quiet-state p, .message p, .sheet-head p, .message-card p {
    margin: 7px 0 0;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.48;
  }
  .watch-proof-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, .82fr);
    gap: 16px;
  }
  .quiet-panel { display: grid; align-content: start; gap: 10px; }
  .quiet-row.proof, .proof-row { background: linear-gradient(180deg, rgba(242,251,246,.94), rgba(255,255,255,.72)); border-color: rgba(35,115,77,.17); }
  .quiet-state {
    border: 1px dashed rgba(52,66,66,.2);
    background: rgba(255,255,255,.48);
    border-radius: 16px;
    padding: 16px;
  }
  .quiet-state strong { display: block; font-size: 16px; }
  .message-list, .proof-list, .connected-grid, .ability-panel { display: grid; gap: 10px; }
  .message-list { max-height: 58dvh; overflow: auto; padding-right: 4px; }
  .message { max-width: 78%; }
  .message.employee { border-color: rgba(39,107,130,.22); }
  .message.owner { justify-self: end; background: var(--ink); color: #fffdf8; }
  .message.owner p, .message.owner span { color: rgba(255,253,248,.82); }
  .message small, .connection-card small, .ability-row small, .sheet-head small {
    display: inline-block;
    margin-top: 8px;
    color: var(--amber);
  }
  .connected-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ability-panel { margin-top: 4px; }
  .work-sheet {
    position: sticky;
    top: 86px;
    max-height: calc(100dvh - 104px);
    overflow: auto;
    display: grid;
    gap: 14px;
  }
  .sheet-close { justify-self: end; min-height: 36px; }
  .sheet-head {
    display: grid;
    gap: 7px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }
  .sheet-head span { color: var(--blue); }
  .sheet-head h2 { margin: 0; font-size: 28px; line-height: 1.05; letter-spacing: 0; }
  .generated-view, .message-card {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255,255,255,.72);
    padding: 14px;
    display: grid;
    gap: 10px;
  }
  .generated-view table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .generated-view th, .generated-view td { padding: 10px; border-bottom: 1px solid var(--line); text-align: left; font-size: 13px; }
  .generated-view th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
  .diff-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .diff-grid > div { border: 1px solid var(--line); border-radius: 14px; padding: 12px; background: #fff; }
  .key-value { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line); }
  .key-value strong { overflow-wrap: anywhere; text-align: right; }
  @media (max-width: 980px) {
    .avery-top { grid-template-columns: 1fr auto; align-items: start; }
    .avery-nav { grid-column: 1 / -1; justify-content: stretch; }
    .avery-nav button { flex: 1; padding: 0 8px; }
    .avery-layout.with-sheet, .avery-layout { width: min(100% - 20px, 720px); grid-template-columns: 1fr; margin-top: 10px; }
    .work-sheet {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 50;
      width: 100%;
      max-height: 88dvh;
      border-radius: 26px 26px 0 0;
      padding: 16px;
      box-shadow: 0 -24px 70px rgba(17,23,23,.24);
    }
    .watch-proof-grid, .connected-grid, .prompt-grid { grid-template-columns: 1fr; }
    .avery-presence { min-height: 210px; border-radius: 24px; padding: 24px; }
    .avery-presence h1 { font-size: clamp(42px, 14vw, 64px); }
    .avery-presence span { font-size: 16px; }
    .panel-title { display: grid; }
    .panel-title p { text-align: left; }
    .message { max-width: 92%; }
  }
  @media (max-width: 520px) {
    .avery-top { padding: 10px; }
    .avery-mark strong { font-size: 21px; }
    .avery-reach { display: none; }
    .avery-nav button { min-height: 36px; font-size: 13px; }
    .first-task, .needs-panel, .quiet-panel, .talk-view, .proof-view, .connected-view { border-radius: 20px; padding: 13px; }
    .avery-composer textarea { font-size: 16px; }
  }
`;
