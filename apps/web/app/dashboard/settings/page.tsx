import { SettingsView } from "@/components/settings/settings-view";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = (await getSession())!;
  return (
    <SettingsView
      user={{ name: session.user.name, email: session.user.email, createdAt: new Date(session.user.createdAt).getTime() }}
      currentSessionId={session.session.id}
    />
  );
}
