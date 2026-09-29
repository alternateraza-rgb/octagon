import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { isComped } from "@/lib/billing/entitlements";

// Octa Agents is still a prototype on sample data. Only comped accounts (the team) see it; everyone
// else keeps the "Coming soon" page.
export async function canPreviewAgents() {
  const session = await getSession();
  if (!session) return false;
  const { env } = await getCloudflareContext({ async: true });
  return isComped(env, session.user.email);
}

// For the prototype's inner pages: anyone outside the preview goes back to the "Coming soon" page.
export async function requireAgentsPreview() {
  if (!(await canPreviewAgents())) redirect("/dashboard/agents");
}
