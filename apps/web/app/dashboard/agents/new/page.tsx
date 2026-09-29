import { HireView } from "@/components/agents/hq/hire-view";
import { getSession } from "@/lib/auth/server";
import { requireAgentsPreview } from "@/lib/agents/preview";

export const metadata = { title: "Hire an agent" };

export default async function HireAgentPage() {
  await requireAgentsPreview();
  const session = (await getSession())!;
  return <HireView me={{ name: session.user.name || session.user.email.split("@")[0], email: session.user.email }} />;
}
