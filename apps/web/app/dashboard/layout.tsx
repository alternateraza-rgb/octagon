import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppShell } from "@/components/app/shell";
import type { Theme } from "@/components/app/workspace";
import { getSession } from "@/lib/auth/server";
import { listConversations } from "@/lib/chat/store";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  const [{ env }, jar] = await Promise.all([getCloudflareContext({ async: true }), cookies()]);
  const conversations = await listConversations(env.DB, session.user.id);
  const theme = jar.get("theme")?.value;
  return (
    <AppShell
      me={{ name: session.user.name || session.user.email.split("@")[0], email: session.user.email }}
      conversations={conversations}
      theme={theme === "light" || theme === "dark" ? (theme as Theme) : "system"}
      collapsed={jar.get("sidebar")?.value === "collapsed"}
    >
      {children}
    </AppShell>
  );
}
