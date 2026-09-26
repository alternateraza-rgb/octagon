import { SignupFlow } from "@/components/onboarding/signup-flow";

export const metadata = { title: "Get started" };

export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { prompt, template } = await searchParams;
  return (
    <SignupFlow
      prompt={typeof prompt === "string" ? prompt : undefined}
      templateSlug={typeof template === "string" ? template : undefined}
    />
  );
}
