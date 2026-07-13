/**
 * Quiet provider-proof receipt (build-plan 15 §7 "quiet provider proof"). Shows the
 * ids that prove the work really happened (Gmail message id, Stripe invoice id,
 * Twilio SID, reminder id) — small and calm, never raw bodies, never tool names.
 */
import { tokens } from "../surface.tokens";

export function Receipt({ proof }: { proof?: Record<string, string> }) {
  if (!proof) return null;
  const ids = Object.entries(proof).filter(([, v]) => v && String(v).trim().length > 0);
  if (!ids.length) return null;
  return (
    <p style={{ margin: `${tokens.space.sm}px 0 0`, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, letterSpacing: "0.03em", color: tokens.color.textMuted }}>
      <span aria-hidden style={{ textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 500 }}>Proof </span>
      {ids.map(([k, v], i) => (
        <span key={k}>
          {i > 0 ? " · " : ""}
          <span style={{ textTransform: "uppercase" }}>{k.replace(/_/g, " ")}</span> {String(v)}
        </span>
      ))}
    </p>
  );
}
