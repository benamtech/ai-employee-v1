import { FreeEstimatorClient } from "../free-estimator/FreeEstimatorClient";

export const metadata = {
  title: "Estimator employee - AMTECH",
  description: "Run an AMTECH estimator employee on one real contractor job.",
};

export default function EstimatorPage() {
  return <FreeEstimatorClient />;
}
