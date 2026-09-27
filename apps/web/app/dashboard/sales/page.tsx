import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SalesView } from "@/components/sales/sales-view";
import { getSession } from "@/lib/auth/server";
import { publicSale } from "@/lib/sales/invite";
import { listSales } from "@/lib/sales/store";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const session = (await getSession())!;
  const { env } = await getCloudflareContext({ async: true });
  const sales = await listSales(env.DB, session.user.id);
  return <SalesView sales={sales.filter((s) => s.status !== "canceled").map(publicSale)} />;
}
