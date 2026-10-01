import { redirect } from "next/navigation";
import { SignupFlow } from "@/components/onboarding/signup-flow";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { googleEnabled } from "@/lib/auth/auth";

export const metadata = { title: "Get started" };

export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { prompt, template, error } = await searchParams;
  if (await getSession()) redirect(typeof prompt === "string" ? `/dashboard/sites?prompt=${encodeURIComponent(prompt)}` : "/dashboard");
  const { env } = await getCloudflareContext({ async: true });
  return (
    <SignupFlow
      google={googleEnabled(env)}
      googleFailed={!!error}
      prompt={typeof prompt === "string" ? prompt : undefined}
      templateSlug={typeof template === "string" ? template : undefined}
    />
  );
}
