"use client";

import type { UiVariantRenderProps } from "@amtech/shared";

export default function RadicalCanvas({ model, dispatch }: UiVariantRenderProps) {
  const orbit = [...model.work.loops, ...model.attention].slice(0, 8);
  return (
    <main className="variant-canvas" data-variant-id="radical-canvas">
      <style>{CSS}</style>
      <div className="noise" aria-hidden="true" />
      <header><span>{model.identity.business_name ?? "AMTECH"}</span><b>{model.runtime.health}</b></header>
      <section className="core">
        <small>ACTIVE EMPLOYEE</small>
        <h1>{model.identity.employee_name}</h1>
        <p>{model.runtime.summary}</p>
        <button onClick={() => void dispatch({ type: "send_message", body: "Show me the highest-leverage next move." })}>Pulse</button>
      </section>
      <section className="orbit" aria-label="Employee operating field">
        {orbit.map((item, index) => {
          const title = "title" in item ? item.title : "Untitled";
          const detail = "why" in item ? item.why : item.summary ?? item.next_step ?? item.state;
          return <article key={item.id} style={{ "--i": index } as React.CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{detail}</p></article>;
        })}
      </section>
      <footer><span>{model.connections.length} systems</span><span>{model.outputs.length} outputs</span><span>{model.approvals.length} approvals</span></footer>
    </main>
  );
}

const CSS = `
.variant-canvas{container-type:inline-size;contain:layout paint style;position:relative;min-height:100dvh;overflow:hidden;padding:24px;background:#06070a;color:#f5f7ff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.variant-canvas *{box-sizing:border-box}.variant-canvas .noise{position:absolute;inset:0;opacity:.12;pointer-events:none;background-image:radial-gradient(#fff 0.7px,transparent .7px);background-size:9px 9px}.variant-canvas header,.variant-canvas footer{position:relative;z-index:2;display:flex;justify-content:space-between;gap:18px;text-transform:uppercase;letter-spacing:.16em;font-size:11px}.variant-canvas header b{color:#7ef0b1}.variant-canvas .core{position:relative;z-index:2;width:min(700px,84vw);margin:14vh auto 0;text-align:center;display:grid;justify-items:center;gap:15px}.variant-canvas .core small{color:#62d6ff;letter-spacing:.24em}.variant-canvas h1{margin:0;font:900 clamp(50px,11vw,150px)/.78 system-ui;letter-spacing:-.075em}.variant-canvas .core p{max-width:620px;margin:0;color:#adb5c8;line-height:1.6}.variant-canvas button{width:84px;height:84px;border:1px solid #62d6ff;border-radius:50%;background:rgba(98,214,255,.08);color:#fff;font-weight:900;text-transform:uppercase}.variant-canvas .orbit{position:relative;z-index:2;width:min(1400px,100%);margin:8vh auto;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.variant-canvas article{min-height:170px;padding:17px;border:1px solid rgba(255,255,255,.14);background:rgba(13,17,26,.78);backdrop-filter:blur(12px);transform:translateY(calc((var(--i) % 3) * 14px));display:grid;align-content:start;gap:8px}.variant-canvas article span{color:#62d6ff;font-size:11px}.variant-canvas article strong{font:800 18px/1.1 system-ui}.variant-canvas article p{margin:0;color:#9fa8ba;line-height:1.45}.variant-canvas footer{padding-top:18px;border-top:1px solid rgba(255,255,255,.14)}@container(max-width:850px){.variant-canvas .orbit{grid-template-columns:1fr 1fr}.variant-canvas article{transform:none}}@container(max-width:500px){.variant-canvas{padding:16px}.variant-canvas .orbit{grid-template-columns:1fr}.variant-canvas h1{font-size:60px}}@media(prefers-reduced-motion:reduce){.variant-canvas article{transform:none}}
`;
