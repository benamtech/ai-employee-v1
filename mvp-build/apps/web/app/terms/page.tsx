import { PublicFooter, PublicHeader, PUBLIC_CSS } from "../public-chrome";

export const metadata = { title: "Terms — AMTECH" };

export default function Terms() {
  return (
    <main className="pub-root">
      <style>{PUBLIC_CSS}</style>
      <PublicHeader />
      <div className="pub-main">
        <article className="prose">
          <h1>Terms of use</h1>
          <div className="updated">Early access — last updated Jul 12, 2026</div>

          <p className="lede">
            AMTECH gives your business an AI employee: it prepares work, asks before anything
            leaves the business, and keeps a record of what it did. These terms cover how you
            and your employee use the service during early access.
          </p>

          <h2>The employee acts for you, with your approval</h2>
          <p>
            Your employee drafts estimates, messages, invoices, and other work. Anything that
            leaves your business or moves money is held until you approve it. You are responsible
            for what you approve, exactly as you would be for a member of your staff.
          </p>

          <h2>Connected accounts</h2>
          <p>
            When you connect email, payments, accounting, or other accounts, you authorize your
            employee to act within them on your behalf, behind the approval gate. You can
            disconnect any account at any time; doing so stops the employee from using it.
          </p>

          <h2>Early access</h2>
          <p>
            During early access the service is provided as-is while we build it with you.
            Features may change, and we onboard businesses by hand. We&rsquo;ll tell you before any
            of your work is charged for.
          </p>

          <h2>Your data</h2>
          <p>
            Your business information, customers, and work belong to you. See the{" "}
            <a href="/privacy" style={{ color: "#e11d2a", textDecoration: "underline", textUnderlineOffset: 3 }}>Privacy notice</a>{" "}
            for how it&rsquo;s handled and protected.
          </p>

          <h2>Contact</h2>
          <p>
            Early access is run by hand — reach us at hello@amtechai.com and a person will answer.
          </p>
        </article>
      </div>
      <PublicFooter />
    </main>
  );
}
