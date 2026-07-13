import { AdminClient } from "./AdminClient";

export const metadata = { title: "AMTECH Admin — internal operations", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminClient />;
}
