import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { publicSale, sendInvite } from "@/lib/sales/invite";
import { cancelSale, getSaleView, renewInvite } from "@/lib/sales/store";

// Cancels an invite that hasn't been paid.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/sales/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  if (!(await cancelSale(env.DB, id, session.user.id))) return Response.json({ error: "That invite can't be canceled." }, { status: 409 });
  return new Response(null, { status: 204 });
}

// Sends the invite email again (and gives it another 30 days).
export async function POST(_request: Request, { params }: RouteContext<"/api/sales/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const sale = await getSaleView(env.DB, id);
  if (!sale || sale.sellerId !== session.user.id) return Response.json({ error: "Invite not found." }, { status: 404 });
  if (sale.status === "paid" || sale.status === "canceled") return Response.json({ error: "That invite is closed." }, { status: 409 });
  await renewInvite(env.DB, id);
  if (!(await sendInvite(env, sale))) return Response.json({ error: "The email didn't send. Try again." }, { status: 502 });
  return Response.json({ sale: publicSale((await getSaleView(env.DB, id))!) });
}
