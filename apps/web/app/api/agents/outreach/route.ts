import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { clean } from "@/lib/agents/http";
import { MAX_DAILY, outreachState } from "@/lib/outreach/state";
import { getSettings, saveSettings, type OutreachSettings } from "@/lib/outreach/store";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  return Response.json(await outreachState(env, session.user.id));
}

const validZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// Saves the outreach settings. Partial updates are merged with what's saved.
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Log in first." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { env } = await getCloudflareContext({ async: true });
  const current = await getSettings(env.DB, session.user.id);
  const next: OutreachSettings = {
    senderName: typeof body.senderName === "string" ? clean(body.senderName, 60) : (current?.senderName ?? session.user.name ?? ""),
    mailingAddress:
      typeof body.mailingAddress === "string" ? clean(body.mailingAddress, 200) : (current?.mailingAddress ?? ""),
    offer: typeof body.offer === "string" ? clean(body.offer, 160) : (current?.offer ?? "a free preview of a new website for their business"),
    dailyCap:
      typeof body.dailyCap === "number" ? Math.max(1, Math.min(MAX_DAILY, Math.round(body.dailyCap))) : (current?.dailyCap ?? 20),
    followUps: typeof body.followUps === "boolean" ? body.followUps : (current?.followUps ?? true),
    autopilot: typeof body.autopilot === "boolean" ? body.autopilot : (current?.autopilot ?? false),
    paused: typeof body.paused === "boolean" ? body.paused : (current?.paused ?? false),
    timezone:
      typeof body.timezone === "string" && validZone(body.timezone) ? body.timezone : (current?.timezone ?? "America/Toronto"),
  };
  if (next.senderName.length < 2) return Response.json({ error: "Add the name your emails are signed with." }, { status: 400 });
  if (next.mailingAddress.length < 8) {
    return Response.json({ error: "Add a mailing address. The law requires one in every sales email." }, { status: 400 });
  }
  if (next.offer.length < 4) return Response.json({ error: "Say what you're offering them." }, { status: 400 });
  await saveSettings(env.DB, session.user.id, next);
  return Response.json(await outreachState(env, session.user.id));
}
