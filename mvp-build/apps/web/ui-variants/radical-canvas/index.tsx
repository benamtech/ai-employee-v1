"use client";

import { useMemo, useState } from "react";
import { defineUiVariant } from "../contract";
import styles from "./styles.module.css";

export default defineUiVariant(function RadicalCanvasVariant({ model, dispatchIntent }) {
  const [command, setCommand] = useState("");
  const [notice, setNotice] = useState("");
  const active = useMemo(() => model.work.loops.filter((loop) => !["done", "failed"].includes(loop.state)), [model.work.loops]);
  const send = async () => {
    if (!command.trim()) return;
    const result = await dispatchIntent({ intent_id: "send-message", value: command.trim() });
    setNotice(result.message);
    if (result.accepted) setCommand("");
  };

  return (
    <main className={styles.root}>
      <header className={styles.mast}>
        <div><small>AMTECH EMPLOYEE / {model.runtime.status}</small><h1>{model.identity.employee_name}</h1></div>
        <p>{model.runtime.summary}</p>
      </header>
      <section className={styles.field}>
        <aside className={styles.signalRail}>
          <b>{active.length}</b><span>active loops</span>
          <b>{model.attention.decisions.length + model.attention.approvals.length}</b><span>decisions</span>
          <b>{model.waiting.length}</b><span>waiting</span>
          <b>{model.outputs.length}</b><span>outputs</span>
        </aside>
        <div className={styles.workMap}>
          {active.slice(0, 8).map((loop, index) => (
            <article key={loop.id} style={{ "--i": index } as React.CSSProperties}>
              <small>{loop.domain} / {loop.horizon}</small>
              <h2>{loop.title}</h2>
              <p>{loop.summary ?? loop.next_step ?? "Work remains active."}</p>
              <span>{loop.state}</span>
            </article>
          ))}
          {!active.length ? <div className={styles.empty}>No active work loops. The employee is available for a new direction.</div> : null}
        </div>
      </section>
      <footer className={styles.command}>
        <label><span>Direct the employee</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} /></label>
        <button type="button" onClick={() => void send()}>Transmit</button>
        {notice ? <output>{notice}</output> : null}
      </footer>
    </main>
  );
});
