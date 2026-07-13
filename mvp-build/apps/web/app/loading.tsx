/**
 * Route-level loading state. Minimum footprint — a mono status line, not a
 * dominant spinner — per the response-time discipline: the surface itself
 * arrives fast; this only covers slow route transitions.
 */
export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "rgba(10,10,10,0.62)",
          borderBottom: "3px solid #e11d2a",
          paddingBottom: 6,
        }}
      >
        AMTECH — Loading
      </span>
    </main>
  );
}
