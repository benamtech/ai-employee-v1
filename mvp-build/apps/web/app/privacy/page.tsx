import { PublicFooter, PublicHeader, PUBLIC_CSS } from "../public-chrome";

export const metadata = { title: "Privacy — AMTECH" };

export default function Privacy() {
  return (
    <main className="pub-root">
      <style>{PUBLIC_CSS}</style>
      <PublicHeader />
      <div className="pub-main">
        <article className="prose">
          <h1>Privacy notice</h1>
          <div className="updated">Early access — last updated Jul 12, 2026</div>

          <p className="lede">
            Your business runs on trust, so your employee is built to earn it. Here&rsquo;s what we
            collect, why, and the protections around it — in plain language.
          </p>

          <h2>What your employee holds</h2>
          <p>
            To do the work, your employee keeps your business details, your customers&rsquo; contact
            information, the estimates and messages it prepares, and the record of what it did.
            It uses this only to do your work and show you proof of it.
          </p>

          <h2>Connected accounts stay scoped</h2>
          <p>
            When you connect email, payments, or accounting, your employee is given a scoped,
            revocable credential — not your password. Access is limited to what the connection
            needs, and you can revoke it at any time.
          </p>

          <h2>What we never do</h2>
          <p>
            We don&rsquo;t sell your data. We don&rsquo;t show your customers&rsquo; private information to other
            businesses. Secrets and credentials are never shown back to you in plain text, logged,
            or sent to a model.
          </p>

          <h2>Proof, not surveillance</h2>
          <p>
            The record your employee keeps exists so you can verify work really happened —
            a sent email, a paid invoice, an approval you gave. It&rsquo;s a receipt drawer, not a
            monitoring tool.
          </p>

          <h2>Your control</h2>
          <p>
            You can disconnect an account, pause your employee, or ask us to remove your data.
            Reach a person at hello@amtechai.com.
          </p>
        </article>
      </div>
      <PublicFooter />
    </main>
  );
}
