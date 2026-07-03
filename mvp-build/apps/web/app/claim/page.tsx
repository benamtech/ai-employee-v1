import { ClaimClient } from "./ClaimClient";

export default async function Claim({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <ClaimClient tokenParam={t} />;
}
