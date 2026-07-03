import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "8vh auto", padding: 24 }}>
      <h1>AMTECH AI Employee</h1>
      <p>
        A textable AI employee for your business — its own number, knows your pricing and
        your way of working, prepares the work, and asks for approval before anything leaves
        the business.
      </p>
      <p>
        <Link href="/create-ai-employee">Create your AI employee →</Link>
      </p>
      <p style={{ color: "#888", fontSize: 13 }}>
        Phase 1 wiring is available. Real use requires configured Supabase, Twilio, Hermes, and provisioner environment.
      </p>
    </main>
  );
}
