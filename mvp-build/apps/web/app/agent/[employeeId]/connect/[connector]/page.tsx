import Link from "next/link";
import { cookies } from "next/headers";
import {
  genericConnectorRuntimeManifest,
  resolveConnectorRuntimeManifest,
  resolveOwnerManagedConnectorSetup,
} from "@amtech/shared";
import { managerPost } from "../../../../api/_lib/manager";

export const metadata = { title: "Connect a business system — AMTECH" };

function safeReturnPath(value: string | undefined, employeeId: string): string {
  const fallback = `/agent/${encodeURIComponent(employeeId)}`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 500) return fallback;
  return value;
}

function setupKind(protocol: string | null, guided: string): string {
  if (protocol === "oauth2_authorization_code") return "Secure provider authorization";
  if (protocol === "provider_managed_onboarding") return "Secure provider onboarding";
  if (guided === "guided_webhook_subscription") return "Guided event connection";
  if (guided === "guided_remote_mcp") return "Guided custom-system connection";
  return "Guided business-system setup";
}

interface LifecycleSnapshot {
  bindings?: Array<{
    id: string;
    connector_key: string;
    lifecycle_state: string;
    provider: string;
    external_subject?: string | null;
    capabilities?: Array<{ capability_key: string; label: string; effect_class: string; event_driven: boolean; status: string }>;
  }>;
  setup_intents?: Array<{ connector_key: string; status: string; setup_experience: string }>;
}

async function lifecycle(employeeId: string): Promise<LifecycleSnapshot | null> {
  const token = (await cookies()).get("amtech_owner_session")?.value;
  if (!token) return null;
  const response = await managerPost(`/manager/employee/${encodeURIComponent(employeeId)}/workbench/connectors`, {
    owner_session_token: token,
    refresh: true,
  });
  if (!response.ok) return null;
  return response.json().catch(() => null) as Promise<LifecycleSnapshot | null>;
}

export default async function Connect({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string; connector: string }>;
  searchParams: Promise<{ state?: string; returnTo?: string }>;
}) {
  const { employeeId, connector } = await params;
  const { state, returnTo: rawReturnTo } = await searchParams;
  const managed = resolveOwnerManagedConnectorSetup(connector);
  const runtime = resolveConnectorRuntimeManifest(connector) ?? genericConnectorRuntimeManifest(connector);
  const returnTo = safeReturnPath(rawReturnTo, employeeId);
  const deskHref = returnTo;
  const retryHref = `/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(runtime.key)}?returnTo=${encodeURIComponent(returnTo)}`;
  const startHref = `/api/employee/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(runtime.key)}?returnTo=${encodeURIComponent(returnTo)}`;
  const snapshot = state === "connected" || state === "requested" || state === "revoked" ? await lifecycle(employeeId) : null;
  const binding = snapshot?.bindings?.find((row) => row.connector_key === runtime.key || row.provider === runtime.key);
  const intent = snapshot?.setup_intents?.find((row) => row.connector_key === runtime.key);

  if (state === "connected") {
    return (
      <Shell employeeId={employeeId} note="Connected and ready">
        <div className="cn-result">
          <p className="cn-kicker ok">✓ Connected</p>
          <h1>{runtime.label} is part of the employee<span className="p">.</span></h1>
          <p className="cn-sub">AMTECH discovered what this account can do, kept credentials outside the employee runtime, and projected only assignment-bound capabilities. Events can wake the employee when the provider supports them.</p>
          <div className="cn-proof-grid">
            <Proof label="Lifecycle" value={binding?.lifecycle_state ?? "connected"} />
            <Proof label="Event awareness" value={runtime.supports_webhooks ? "Available" : runtime.supports_polling ? "Scheduled checks" : "On demand"} />
            <Proof label="Credential custody" value="AMTECH Manager" />
          </div>
          {binding?.capabilities?.length ? (
            <div className="cn-capabilities"><strong>Available to this employee</strong><ul>{binding.capabilities.map((capability) => <li key={capability.capability_key}><span>{capability.label}</span><small>{capability.event_driven ? "event aware" : capability.effect_class.replace(/_/g, " ")}</small></li>)}</ul></div>
          ) : null}
          <div className="cn-insurance"><strong>How approvals work</strong><span>The owner can answer naturally on web, SMS, or voice. AMTECH binds the decision to the exact held work; it does not ask for a code on every interaction.</span></div>
          <div className="cn-cta-row">
            <Link className="cn-cta" href={deskHref}>Return to the work</Link>
            <form action={`/api/employee/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(runtime.key)}`} method="post">
              <input type="hidden" name="binding_id" value={binding?.id ?? ""} />
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="reason" value="owner_requested_disconnect" />
              <button className="cn-cta danger" type="submit">Disconnect</button>
            </form>
          </div>
        </div>
      </Shell>
    );
  }

  if (state === "requested") {
    return (
      <Shell employeeId={employeeId} note="Setup started">
        <div className="cn-result">
          <p className="cn-kicker ok">Setup started</p>
          <h1>Your employee knows {runtime.label.toLowerCase()} is next<span className="p">.</span></h1>
          <p className="cn-sub">The setup request is attached to this employee and assignment. The employee will guide the owner in business language and ask only for the information the provider actually requires.</p>
          <div className="cn-insurance"><strong>What happens next</strong><span>{intent?.status === "in_progress" ? "Setup is in progress." : "AMTECH will collect or coordinate the approved connection method, test a harmless read, discover available capabilities, and show evidence before automation is activated."}</span></div>
          <div className="cn-insurance"><strong>No power-user knowledge required</strong><span>You will not be asked to understand OAuth, MCP, webhook signatures, or credential storage. AMTECH translates those into a guided business-system connection.</span></div>
          <div className="cn-cta-row"><Link className="cn-cta" href={deskHref}>Continue with your employee</Link></div>
        </div>
      </Shell>
    );
  }

  if (state === "revoked") {
    return (
      <Shell employeeId={employeeId} note="Disconnected">
        <div className="cn-result">
          <p className="cn-kicker">Disconnected</p>
          <h1>{runtime.label} access is closed<span className="p">.</span></h1>
          <p className="cn-sub">AMTECH revoked the assignment binding and capability projection. Subsequent events and tool calls fail closed; stored credential references are removed where this connector uses AMTECH custody.</p>
          <div className="cn-cta-row"><Link className="cn-cta" href={retryHref}>Connect again</Link><Link className="cn-cta quiet" href={deskHref}>Return to the work</Link></div>
        </div>
      </Shell>
    );
  }

  if (state === "error" || state === "failed") {
    return (
      <Shell employeeId={employeeId} note="Couldn’t connect">
        <div className="cn-result">
          <p className="cn-kicker">Couldn&rsquo;t connect</p>
          <h1>{runtime.label} didn&rsquo;t connect<span className="p">.</span></h1>
          <p className="cn-sub">No employee capability was promoted. Provider cancellation, expired setup, missing business information, or a failed proof check leaves the connector unavailable.</p>
          <div className="cn-cta-row"><Link className="cn-cta" href={retryHref}>Try again</Link><Link className="cn-cta quiet" href={deskHref}>Return to the work</Link></div>
        </div>
      </Shell>
    );
  }

  const canDo = managed?.can_do ?? runtime.capabilities.slice(0, 5).map((capability) => capability.summary);
  const cannotDo = managed?.cannot_do ?? [
    "Act outside this employee’s current assignment",
    "Expose stored credentials to the employee or owner UI",
    "Perform customer-facing or money effects without the configured approval grammar",
  ];

  return (
    <Shell employeeId={employeeId} note={`Connect ${runtime.label.toLowerCase()}`}>
      <div className="cn-consent">
        <p className="cn-kicker">Connect a business system</p>
        <h1>Let your employee use {runtime.label.toLowerCase()}<span className="p">.</span></h1>
        <p className="cn-sub">Every connector uses the same AMTECH lifecycle: connect, discover, prove a harmless task, enable events when available, use it through normal work, show evidence, and disconnect cleanly.</p>

        <div className="cn-cols">
          <div className="cn-col"><span className="cn-col-tag ok">It can</span><ul>{(canDo.length ? canDo : ["Connect through a guided AMTECH setup", "Discover supported business capabilities", "Keep the owner informed with evidence"]).map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="cn-col"><span className="cn-col-tag no">It cannot</span><ul className="no">{cannotDo.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>

        <div className="cn-insurance"><strong>Setup experience</strong><span>{setupKind(managed?.authorization_protocol ?? null, runtime.setup_experience)}. AMTECH uses provider authorization where available and an equally guided in-product setup for systems that do not offer it.</span></div>
        <div className="cn-insurance"><strong>Event awareness</strong><span>{runtime.supports_webhooks ? "This system can wake the employee from verified business events after event setup is proved." : runtime.supports_polling ? "The employee can check this system on a controlled schedule." : "The employee uses this system on demand."}</span></div>
        <div className="cn-insurance"><strong>Credentials and authority</strong><span>Credentials stay in Manager custody. The employee is broadly capable by default, but each consequential effect re-enters current assignment and approval authority.</span></div>

        <div className="cn-cta-row"><Link className="cn-cta" href={startHref}>{managed ? `Continue with ${runtime.label.toLowerCase()}` : `Start ${runtime.label.toLowerCase()} setup`}</Link><Link className="cn-cta quiet" href={deskHref}>Not now</Link></div>
      </div>
    </Shell>
  );
}

function Proof({ label, value }: { label: string; value: string }) {
  return <div><strong>{label}</strong><span>{value}</span></div>;
}

function Shell({ employeeId, note, children }: { employeeId: string; note: string; children: React.ReactNode }) {
  return <main className="cn-root"><style>{CONNECT_CSS}</style><header className="cn-bar"><Link className="cn-logo" href={`/agent/${employeeId}`}>AMTECH<span aria-hidden>.</span></Link><span className="cn-note">{note}</span></header><div className="cn-body">{children}</div></main>;
}

const CONNECT_CSS = `
.cn-root{min-height:100vh;background:#f4f4f4;color:#0a0a0a;font-family:var(--font-inter),Inter,-apple-system,'Helvetica Neue',Arial,sans-serif}.cn-logo{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;color:#0a0a0a}.cn-logo span{color:#e11d2a}.cn-bar{display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 24px;background:#fff;border-bottom:1px solid rgba(10,10,10,.1)}.cn-note{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:9px;font-weight:500;letter-spacing:.09em;text-transform:uppercase;color:rgba(10,10,10,.62)}.cn-body{max-width:760px;margin:0 auto;padding:48px 24px}.cn-consent,.cn-result{background:#fff;border:1px solid rgba(10,10,10,.1);padding:30px 24px}.cn-kicker{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:9px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#e11d2a;margin:0 0 12px}.cn-kicker.ok{color:#0a0a0a}.cn-body h1{font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:0;text-wrap:balance}.cn-body h1 .p{color:#e11d2a}.cn-sub{font-size:15px;line-height:1.6;color:rgba(10,10,10,.62);max-width:66ch;margin:12px 0 0}.cn-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1px;background:rgba(10,10,10,.1);border:1px solid rgba(10,10,10,.1);margin:24px 0}.cn-col{background:#fff;padding:18px}.cn-col-tag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid;font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:9px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}.cn-col-tag.ok{border-color:#0a0a0a;color:#0a0a0a}.cn-col-tag.no{border-color:#e11d2a;color:#e11d2a}.cn-col ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}.cn-col li{font-size:12px;line-height:1.5;padding-left:18px;position:relative}.cn-col li::before{content:'✓';position:absolute;left:0;color:#0a0a0a;font-weight:700}.cn-col ul.no li::before{content:'✕';color:#e11d2a}.cn-insurance{display:grid;gap:5px;margin-top:12px;padding:13px 14px;border:1px solid rgba(10,10,10,.12);background:#f8f8f8}.cn-insurance strong,.cn-capabilities>strong,.cn-proof-grid strong{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase}.cn-insurance span{font-size:12px;line-height:1.55;color:rgba(10,10,10,.68)}.cn-proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(10,10,10,.1);margin:24px 0}.cn-proof-grid>div{display:grid;gap:7px;padding:14px;background:#f8f8f8}.cn-proof-grid span{font-size:12px}.cn-capabilities{display:grid;gap:10px;margin:18px 0;padding:16px;border:1px solid rgba(10,10,10,.12)}.cn-capabilities ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}.cn-capabilities li{display:flex;justify-content:space-between;gap:12px;font-size:12px}.cn-capabilities small{color:rgba(10,10,10,.55)}.cn-cta-row{display:flex;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap}.cn-cta{border:0;background:#0a0a0a;color:#fff;font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:0 24px;height:48px;display:inline-flex;align-items:center;cursor:pointer}.cn-cta:hover{background:#ff1a2b}.cn-cta.quiet{background:#fff;color:#0a0a0a;border:1px solid rgba(10,10,10,.15)}.cn-cta.danger{background:#fff;color:#e11d2a;border:1px solid rgba(225,29,42,.35)}.cn-cta-row form{margin:0}@media(max-width:640px){.cn-proof-grid{grid-template-columns:1fr}.cn-capabilities li{display:grid;gap:3px}}
`;
