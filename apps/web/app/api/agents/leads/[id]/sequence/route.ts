import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { getLead, updateLead } from "@/lib/agents/store";
import { createSequence, endSequence, getMailbox, getSequenceForLead, getSettings, isSuppressed } from "@/lib/outreach/store";

export async function GET(_request: Request, { params }: RouteContext<"/api/agents/leads/[id]/sequence">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  return Response.json({ sequence: await getSequenceForLead(env.DB, session.user.id, id) });
}

// Starts emailing a business: the emails as the user approved them, sent by the outreach cron.
export async function POST(request: Request, { params }: RouteContext<"/api/agents/leads/[id]/sequence">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { emails?: unknown };
  const emails = Array.isArray(body.emails)
    ? body.emails
        .filter((e): e is { subject: string; body: string } => typeof e?.subject === "string" && typeof e?.body === "string")
        .map((e) => ({ subject: e.subject.trim().slice(0, 150), body: e.body.trim().slice(0, 4000) }))
        .filter((e) => e.subject && e.body)
        .slice(0, 3)
    : [];
  if (!emails.length) return Response.json({ error: "Write the first email." }, { status: 400 });

  const { env } = await getCloudflareContext({ async: true });
  const [lead, mailbox, settings, existing] = await Promise.all([
    getLead(env.DB, id, session.user.id),
    getMailbox(env.DB, session.user.id),
    getSettings(env.DB, session.user.id),
    getSequenceForLead(env.DB, session.user.id, id),
  ]);
  if (!lead) return Response.json({ error: "Business not found." }, { status: 404 });
  if (!lead.email) return Response.json({ error: "Add their email first." }, { status: 400 });
  if (!mailbox || mailbox.status !== "connected") return Response.json({ error: "Connect Outlook first." }, { status: 409 });
  if (!settings) return Response.json({ error: "Set up outreach first." }, { status: 409 });
  if (existing?.status === "active") return Response.json({ error: "Octa is already emailing them." }, { status: 409 });
  if (await isSuppressed(env.DB, lead.email)) {
    return Response.json({ error: "This address asked not to be emailed." }, { status: 409 });
  }
  await createSequence(env.DB, session.user.id, id, lead.email, emails);
  return Response.json({ sequence: await getSequenceForLead(env.DB, session.user.id, id) });
}

// "They replied" (stops the follow-ups and marks the business) or "Stop".
export async function PATCH(request: Request, { params }: RouteContext<"/api/agents/leads/[id]/sequence">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const { action } = (await request.json().catch(() => ({}))) as { action?: unknown };
  if (action !== "replied" && action !== "stop") return Response.json({ error: "Unknown action." }, { status: 400 });
  const { env } = await getCloudflareContext({ async: true });
  const sequence = await getSequenceForLead(env.DB, session.user.id, id);
  if (!sequence) return Response.json({ error: "No emails to stop." }, { status: 404 });
  if (action === "replied") {
    await env.DB.prepare(`update sequence set status = 'active' where id = ? and status = 'finished'`).bind(sequence.id).run();
    await endSequence(env.DB, sequence.id, "replied");
    await updateLead(env.DB, id, session.user.id, { stage: "replied" });
  } else {
    await endSequence(env.DB, sequence.id, "stopped");
  }
  return Response.json({ sequence: await getSequenceForLead(env.DB, session.user.id, id) });
}
