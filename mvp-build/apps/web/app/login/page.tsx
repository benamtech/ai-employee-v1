/** Owner login (Supabase Auth). Phase 1 wires email/password sign-in; the session
 *  authorizes the owner web employee surface at /agent/[employeeId]. */
export default function Login() {
  return (
    <main style={{ maxWidth: 420, margin: "10vh auto", padding: 24 }}>
      <h1>Sign in</h1>
      <p style={{ color: "#888" }}>[ Phase 1: Supabase Auth email/password sign-in. ]</p>
    </main>
  );
}
