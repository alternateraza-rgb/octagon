import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppShell } from "@/components/app/shell";
import { getSession } from "@/lib/auth/server";
import { listConversations } from "@/lib/chat/store";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  const { env } = await getCloudflareContext({ async: true });
  const conversations = await listConversations(env.DB, session.user.id);
  return (
    <AppShell email={session.user.email} conversations={conversations}>
      {children}
    </AppShell>
  );
}
