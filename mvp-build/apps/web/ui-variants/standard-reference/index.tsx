"use client";

import type { UiVariantRenderProps } from "@amtech/shared";

export default function StandardReference({ model, dispatch }: UiVariantRenderProps) {
  const needsYou = model.attention.length + model.approvals.length + model.decisions.length;
  return (
    <main className="variant-standard" data-variant-id="standard-reference">
      <style>{CSS}</style>
      <header>
        <div><small>{model.identity.business_name ?? "AMTECH"}</small><h1>{model.identity.employee_name}</h1></div>
        <span data-health={model.runtime.health}>{model.runtime.health}</span>
      </header>
      <section className="hero">
        <p>Employee experience model v{model.version}</p>
        <h2>{needsYou ? `${needsYou} items need attention` : "Work is moving without interruption"}</h2>
        <p>{model.runtime.summary}</p>
      </section>
      <div className="grid">
        <section><h3>Attention</h3>{model.attention.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.why}</p></article>)}{!model.attention.length && <p>Nothing waiting.</p>}</section>
        <section><h3>Current work</h3>{model.work.loops.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.summary ?? item.next_step}</p><small>{item.state} · {item.horizon}</small></article>)}</section>
        <section><h3>Conversation</h3>{model.conversation.slice(-6).map((message) => <article key={message.id}><small>{message.direction}</small><p>{message.body}</p></article>)}<button onClick={() => void dispatch({ type: "send_message", body: "Give me the most useful update." })}>Ask for an update</button></section>
        <section><h3>Connections</h3>{model.connections.map((item) => <article key={item.id}><strong>{item.label}</strong><p>{item.what_employee_can_do}</p><small>{item.state}</small></article>)}</section>
        <section><h3>Evidence and outputs</h3>{model.outputs.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.summary ?? item.status}</p></article>)}{model.evidence.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.summary}</p></article>)}</section>
      </div>
    </main>
  );
}

const CSS = `
.variant-standard{container-type:inline-size;contain:layout paint style;min-height:100dvh;padding:clamp(18px,4vw,52px);background:var(--employee-canvas,#f7f9fc);color:var(--employee-ink,#111);font-family:var(--employee-font,system-ui)}
.variant-standard *{box-sizing:border-box}.variant-standard header{display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:1380px;margin:auto}.variant-standard h1,.variant-standard h2,.variant-standard h3,.variant-standard p{margin:0}.variant-standard h1{font-size:clamp(26px,4vw,54px)}.variant-standard header small,.variant-standard .hero>p:first-child{text-transform:uppercase;letter-spacing:.13em;font-weight:800;color:var(--employee-primary,#e11d2a)}.variant-standard header>span{padding:8px 12px;border:1px solid currentColor;border-radius:999px}.variant-standard .hero{max-width:1380px;margin:clamp(40px,8vw,110px) auto 30px;display:grid;gap:14px}.variant-standard .hero h2{max-width:900px;font-size:clamp(34px,7vw,92px);line-height:.94;letter-spacing:-.055em}.variant-standard .hero p:last-child{max-width:760px;color:var(--employee-muted,#667085);font-size:18px;line-height:1.6}.variant-standard .grid{max-width:1380px;margin:auto;display:grid;grid-template-columns:repeat(12,1fr);gap:16px}.variant-standard .grid>section{grid-column:span 4;display:grid;align-content:start;gap:12px;padding:22px;border:1px solid var(--employee-line,rgba(0,0,0,.1));border-radius:var(--employee-radius,20px);background:var(--employee-surface,#fff);box-shadow:var(--employee-shadow,none)}.variant-standard .grid>section:nth-child(2),.variant-standard .grid>section:nth-child(3){grid-column:span 6}.variant-standard article{display:grid;gap:5px;padding:14px;border-radius:12px;background:var(--employee-surface-raised,#f5f5f5)}.variant-standard article p,.variant-standard article small{color:var(--employee-muted,#667085);line-height:1.45}.variant-standard button{min-height:44px;border:0;border-radius:12px;background:var(--employee-primary,#e11d2a);color:#fff;font-weight:800}@container(max-width:850px){.variant-standard .grid>section{grid-column:1/-1!important}}@media(prefers-reduced-motion:reduce){.variant-standard *{scroll-behavior:auto!important}}
`;
