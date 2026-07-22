import { EmployeeUiPortHost } from "../_components/employee-ui/EmployeeUiPort";
import { FreeEstimatorClient } from "./FreeEstimatorClient";

export const metadata = {
  title: "Free estimate draft — AMTECH",
  description: "Non-canonical acquisition preview for drafting one contractor estimate.",
};

export default function FreeEstimatorPage() {
  return (
    <EmployeeUiPortHost
      adapterKey="public_form"
      presentationOverride={{ source: "explicit_override", theme_key: "field_notebook" }}
    >
      <div className="estimator-status" role="note">
        <style>{`.estimator-status{position:relative;z-index:50;padding:10px 16px;border-bottom:1px solid var(--employee-line);background:var(--employee-accent);color:var(--employee-ink);font:700 12px/1.4 var(--employee-font);text-align:center}.estimator-status strong{color:var(--employee-primary)}`}</style>
        <strong>Non-canonical preview.</strong> This estimator is an acquisition and regression aid, not the production AI Employee operating surface or launch proof.
      </div>
      <FreeEstimatorClient />
    </EmployeeUiPortHost>
  );
}
