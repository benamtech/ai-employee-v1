import { FreeEstimatorClient } from "./FreeEstimatorClient";

export const metadata = {
  title: "Free estimate draft — AMTECH",
  description: "Non-canonical acquisition preview for drafting one contractor estimate.",
};

export default function FreeEstimatorPage() {
  return (
    <>
      <div className="estimator-status" role="note">
        <style>{`.estimator-status{position:relative;z-index:50;padding:10px 16px;border-bottom:1px solid rgba(37,99,235,.16);background:#dff6ff;color:#111;font:700 12px/1.4 Inter,system-ui,sans-serif;text-align:center}.estimator-status strong{color:#2563eb}`}</style>
        <strong>Non-canonical preview.</strong> This estimator is an acquisition and regression aid, not the production AI Employee operating surface or launch proof.
      </div>
      <FreeEstimatorClient />
    </>
  );
}
