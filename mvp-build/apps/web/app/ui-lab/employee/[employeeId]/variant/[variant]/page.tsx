import { UiLabVariantPanel } from "../../../../../_components/live-employee/UiLabShell";

export default async function UiLabVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  return <UiLabVariantPanel variantId={variant} />;
}
