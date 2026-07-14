import { AdminClient } from "./AdminClient";
import { uiFixtureMode } from "../_lib/ui-fixtures";

export const metadata = { title: "AMTECH Admin — internal operations", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminClient fixtureMode={uiFixtureMode()} />;
}
