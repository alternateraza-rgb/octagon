import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { sendEmail } from "@/lib/email/send";
import { changeRequestEmail } from "@/lib/email/templates";

// An owner asking the person who built their site for a change: emailed to the seller.
export async function POST(request: Request, { params }: RouteContext<"/api/owner/sites/[id]/request">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const { message } = (await request.json().catch(() => ({}))) as { message?: unknown };
  const text = typeof message === "string" ? message.trim().slice(0, 2000) : "";
  if (text.length < 5) return Response.json({ error: "Describe the change you'd like." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const site = await env.DB.prepare(
    `select s.id, s.title, u.name as sellerName, u.email as sellerEmail from site s join user u on u.id = s.userId where s.id = ? and s.ownerId = ?`,
  )
    .bind(id, session.user.id)
    .first<{ id: string; title: string | null; sellerName: string; sellerEmail: string }>();
  if (!site) return Response.json({ error: "Site not found." }, { status: 404 });

  // A light brake on accidental repeats.
  const key = `owner-request:${session.user.id}:${id}`;
  const recent = Number((await env.SITES.get(key)) ?? 0);
  if (recent >= 5) return Response.json({ error: "You've sent a few requests already today. Your builder will be in touch." }, { status: 429 });
  await env.SITES.put(key, String(recent + 1), { expirationTtl: 24 * 60 * 60 });

  const sent = await sendEmail(
    env,
    changeRequestEmail({
      to: site.sellerEmail,
      name: site.sellerName,
      buyerName: session.user.name || session.user.email,
      buyerEmail: session.user.email,
      siteTitle: site.title ?? "your site",
      request: text,
      siteId: site.id,
    }),
  );
  if (!sent) return Response.json({ error: "Couldn't send your request. Try again." }, { status: 502 });
  return Response.json({ ok: true });
}
