import { CreateAiEmployeeClient } from "./CreateClient";
import { OnboardingIdentityGate } from "./OnboardingIdentityGate";

export const metadata = {
  title: "Create your AI employee — AMTECH",
  description: "Describe the work, verify the owner and business, then activate a governed AI employee.",
};

export default async function CreateAiEmployee({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <>
      <CreateAiEmployeeClient useCurrentAccount={params?.account === "current"} />
      <OnboardingIdentityGate />
    </>
  );
}
