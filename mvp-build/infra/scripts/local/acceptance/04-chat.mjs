#!/usr/bin/env node
import { fetchJson, internalHeaders, loadState, managerBase, printResult } from "./_lib.mjs";

const state = await loadState();
const message = process.env.LOCAL_ACCEPTANCE_MESSAGE ?? "Give me a short first estimate intake checklist for a 12x14 bedroom repaint.";
const { res, json } = await fetchJson(`${managerBase(state)}/manager/employee/${state.employee_id}/message`, {
  method: "POST",
  headers: internalHeaders(),
  body: JSON.stringify({ owner_session_token: state.owner_session_token, message }),
});

const reply = typeof json.reply === "string" ? json.reply.trim() : "";
printResult("manager webchat turn", res.ok && reply.length > 0, res.ok ? reply.slice(0, 180) : JSON.stringify(json));

