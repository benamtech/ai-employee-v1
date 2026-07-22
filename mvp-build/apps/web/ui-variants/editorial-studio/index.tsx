"use client";

import { defineUiVariant } from "../contract";
import styles from "./styles.module.css";

export default defineUiVariant(function EditorialStudioVariant({ model, slots }) {
  const lead = model.work.loops[0];
  return (
    <main className={styles.root}>
      <header>
        <p>{model.identity.business_name ?? "Independent studio"}</p>
        <h1>{model.identity.employee_name}</h1>
        <span>{model.runtime.summary}</span>
      </header>
      <div className={styles.columns}>
        <section className={styles.story}>
          <small>Current edition</small>
          <h2>{lead?.title ?? "The employee is ready for a new assignment"}</h2>
          <p>{lead?.summary ?? model.work.guidance?.summary ?? "Use the reference client or a bounded intent to begin new work."}</p>
          {lead?.next_step ? <blockquote>{lead.next_step}</blockquote> : null}
        </section>
        <aside>
          <section><small>Needs attention</small><b>{model.attention.approvals.length + model.attention.decisions.length}</b><p>decisions or approvals</p></section>
          <section><small>In the archive</small><b>{model.outputs.length}</b><p>materialized outputs</p></section>
          <section><small>Waiting room</small><b>{model.waiting.length}</b><p>return conditions</p></section>
        </aside>
      </div>
      <section className={styles.index}>
        <h3>Work index</h3>
        {model.work.loops.slice(0, 8).map((loop) => <article key={loop.id}><span>{loop.domain}</span><strong>{loop.title}</strong><small>{loop.state}</small></article>)}
      </section>
      <details className={styles.reference}><summary>Open the production reference client</summary><div>{slots.reference_client}</div></details>
    </main>
  );
});
