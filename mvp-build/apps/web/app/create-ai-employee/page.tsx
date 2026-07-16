import { CreateAiEmployeeClient } from "./CreateClient";

export const metadata = {
  title: "Create your AI employee — AMTECH",
  description: "Four short steps: tell it about the business, prove your phone, claim the account, and it goes to work.",
};

export default async function CreateAiEmployee({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <CreateAiEmployeeClient useCurrentAccount={params?.account === "current"} />;
}
