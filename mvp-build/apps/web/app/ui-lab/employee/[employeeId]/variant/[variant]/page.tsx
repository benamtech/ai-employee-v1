import { UiLabVariantPanel } from "../../../../../_components/live-employee/UiLabShell";

export default async function UiLabVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string }>;
  searchParams: Promise<{ admission?: string | string[] }>;
}) {
  const { variant } = await params;
  const { admission } = await searchParams;
  // Operator acknowledgement is an explicit, per-open action. It never upgrades a manifest and
  // never admits a variant that is not eligible for live review in the first place.
  const requested = Array.isArray(admission) ? admission[0] : admission;
  return <UiLabVariantPanel variantId={variant} operatorAcknowledged={requested === "lab_review"} />;
}
