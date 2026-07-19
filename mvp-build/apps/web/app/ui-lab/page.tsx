import Link from "next/link";
import { notFound } from "next/navigation";
import { uiFixtureMode } from "../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS } from "../agent/[employeeId]/fixture-runtime";

export const metadata = { title: "Fixture Operating Lab — AMTECH" };

export default function FixtureLabIndexPage() {
  if (!uiFixtureMode()) notFound();

  return (
    <main className="lab-index">
      <style>{INDEX_CSS}</style>
      <section>
        <p>Fixture demonstration only</p>
        <h1>AI Employee Operating Lab</h1>
        <span>
          Run optimistic employee shapes through typed work loops, decisions, saves, delegation,
          connected-system state, evidence, and owner-safe heartbeat projections before provider wiring.
        </span>
        <div>
          {FIXTURE_SCENARIOS.map((scenario) => (
            <Link key={scenario.id} href={`/ui-lab/${scenario.id}`}>
              <small>{scenario.shortLabel}</small>
              <strong>{scenario.label}</strong>
              <span>{scenario.summary}</span>
              <b>Open scenario</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const INDEX_CSS = `
  .lab-index{min-height:100dvh;padding:clamp(24px,6vw,72px);background:radial-gradient(circle at 8% 0%,rgba(223,246,255,.95),transparent 32rem),radial-gradient(circle at 92% 8%,rgba(225,29,42,.06),transparent 28rem),var(--amtech-canvas);color:var(--amtech-ink)}
  .lab-index>section{width:min(1180px,100%);margin:0 auto}.lab-index>section>p{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--amtech-red)}.lab-index h1{max-width:840px;margin:10px 0 16px;font-size:clamp(40px,8vw,82px);line-height:.95;letter-spacing:-.055em}.lab-index>section>span{display:block;max-width:760px;color:var(--amtech-muted);font-size:17px;line-height:1.65}
  .lab-index>section>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;margin-top:36px}.lab-index a{min-height:240px;padding:24px;display:grid;align-content:start;gap:10px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.88);box-shadow:var(--amtech-shadow-card);text-decoration:none;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}.lab-index a:hover{transform:translateY(-2px);border-color:rgba(225,29,42,.28);box-shadow:var(--amtech-shadow-float)}.lab-index a small{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-red)}.lab-index a strong{font-size:24px;line-height:1.08}.lab-index a span{color:var(--amtech-muted);line-height:1.55}.lab-index a b{align-self:end;margin-top:auto;color:var(--amtech-red);font-size:13px}
  @media(max-width:640px){.lab-index{padding:28px 16px}.lab-index a{min-height:210px}}
  @media(prefers-reduced-motion:reduce){.lab-index a{transition:none}.lab-index a:hover{transform:none}}
`;
