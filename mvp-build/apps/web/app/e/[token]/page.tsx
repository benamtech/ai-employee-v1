import { EstimatePortalClient } from "./EstimatePortalClient";

export const metadata = { title: "Your estimate", robots: { index: false, follow: false } };

/**
 * Customer-facing estimate portal — the OTHER side of the marketplace. This is
 * what a homeowner opens from the link the employee emailed them: view the
 * estimate, accept it, put down a deposit. Token-only, no AMTECH account.
 * Static/fixture surface — the real estimate + Stripe deposit come from Manager.
 */
export default async function EstimatePortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <EstimatePortalClient token={token} />;
}
