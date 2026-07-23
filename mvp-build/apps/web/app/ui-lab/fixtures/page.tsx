import Link from "next/link";
import { FIXTURE_SCENARIOS } from "../../agent/[employeeId]/fixture-runtime";
import { uiFixtureMode } from "../../_lib/ui-fixtures";

export const metadata = { title: "UI Lab fixtures — AMTECH" };

export default function UiLabFixturesPage() {
  const enabled = uiFixtureMode();
  return (
    <main className="lab-index">
      <style>{CSS}</style>
      <section>
        <p>Explicit fixture evidence</p>
        <h1>Fixture gallery</h1>
        <span>Fixtures are secondary deterministic evidence. Live UI Lab routes never fall back to these payloads when live projection fails.</span>
        {!enabled ? <div className="fixture-off">Fixture mode is disabled in this environment.</div> : null}
        <div>
          {FIXTURE_SCENARIOS.map((scenario) => (
            <Link key={scenario.id} href={enabled ? `/ui-lab/${scenario.id}` : "/ui-lab/fixtures"} aria-disabled={!enabled}>
              <small>{scenario.shortLabel}</small>
              <strong>{scenario.label}</strong>
              <span>{scenario.summary}</span>
              <b>{enabled ? "Open fixture scenario" : "Fixture mode disabled"}</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const CSS = `
  .lab-index{min-height:100dvh;padding:clamp(24px,6vw,72px);background:#f7f9fc;color:#111;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.lab-index>section{width:min(1180px,100%);margin:0 auto}.lab-index p{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#e11d2a}.lab-index h1{max-width:840px;margin:10px 0 16px;font-size:clamp(40px,8vw,82px);line-height:.95;letter-spacing:-.055em}.lab-index>section>span{display:block;max-width:760px;color:#667085;font-size:17px;line-height:1.65}.lab-index>section>div:last-child{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;margin-top:30px}.lab-index a{min-height:220px;padding:22px;display:grid;align-content:start;gap:10px;border:1px solid rgba(17,17,17,.1);border-radius:8px;background:#fff;text-decoration:none;color:#111}.lab-index a small{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#e11d2a}.lab-index a strong{font-size:24px;line-height:1.08}.lab-index a span{color:#667085;line-height:1.55}.lab-index a b{align-self:end;margin-top:auto;color:#e11d2a;font-size:13px}.fixture-off{margin-top:20px;padding:14px;border:1px solid rgba(225,29,42,.2);border-radius:8px;background:#fff1f2;color:#991b1b;font-weight:750}
`;
