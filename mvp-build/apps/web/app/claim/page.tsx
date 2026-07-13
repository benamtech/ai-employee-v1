import { ClaimClient } from "./ClaimClient";

export const metadata = { title: "Claim your AI employee — AMTECH" };

export default async function Claim({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <ClaimClient tokenParam={t} />;
}
