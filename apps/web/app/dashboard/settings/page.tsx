import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SettingsView } from "@/components/settings/settings-view";
import { getSession } from "@/lib/auth/server";
import { getAccess, getUsage } from "@/lib/billing/entitlements";
import { sellerStatus } from "@/lib/sales/seller";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const access = await getAccess(env, session.user);
  const [usage, seller] = await Promise.all([getUsage(env.DB, session.user.id, access.periodStart), sellerStatus(env, session.user.id)]);
  return (
    <SettingsView
      user={{ name: session.user.name, email: session.user.email, createdAt: new Date(session.user.createdAt).getTime() }}
      currentSessionId={session.session.id}
      billing={{ access, usage }}
      seller={seller && { verification: seller.verification, canSell: seller.canSell }}
    />
  );
}
