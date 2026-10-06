import { academyAccess, notFound } from "@/lib/academy/access";
import { parseMessages } from "@/lib/academy/messages";
import { prospectFor } from "@/lib/academy/practice";
import { eventStreamResponse, openaiStream } from "@/lib/ai/openai";
import { checkLimit, logUsage } from "@/lib/billing/entitlements";

// The prospect's next line in a practice call by text.
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { env, user } = access;
  const body = (await request.json().catch(() => ({}))) as { scenario?: unknown; leadId?: unknown; seed?: unknown; messages?: unknown };
  const found = await prospectFor(env, user.id, body);
  const messages = parseMessages(body.messages);
  if (!found || !messages) return Response.json({ error: "Say something first." }, { status: 400 });
  const refused = await checkLimit(env, user, "chat");
  if (refused) return refused;
  await logUsage(env.DB, user.id, "chat");
  const instructions = `${found.prospect.prompt}\n\nThis call is happening by text, but treat it exactly like a phone call. Reply with only what you say next, as plain text: no quotes, no stage directions, no names in front.`;
  try {
    return eventStreamResponse(await openaiStream(env, { model: env.OPENAI_CHAT_MODEL, instructions, input: messages }));
  } catch (error) {
    console.error("Practice reply failed", error);
    return Response.json({ error: "The prospect didn't answer. Try again." }, { status: 502 });
  }
}
