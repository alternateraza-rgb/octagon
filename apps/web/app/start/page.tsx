import { redirect } from "next/navigation";
import { SignupFlow } from "@/components/onboarding/signup-flow";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Get started" };

export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { prompt, template } = await searchParams;
  if (await getSession()) redirect(typeof prompt === "string" ? `/dashboard?prompt=${encodeURIComponent(prompt)}` : "/dashboard");
  return (
    <SignupFlow
      prompt={typeof prompt === "string" ? prompt : undefined}
      templateSlug={typeof template === "string" ? template : undefined}
    />
  );
}
