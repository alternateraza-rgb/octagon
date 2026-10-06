import { academyAccess, notFound } from "@/lib/academy/access";
import { coachInstructions } from "@/lib/academy/coach";
import { parseMessages } from "@/lib/academy/messages";
import { eventStreamResponse, openaiStream } from "@/lib/ai/openai";
import { checkLimit, logUsage } from "@/lib/billing/entitlements";

// Coach by text: the history lives in the browser, and each reply counts as a chat message.
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { env, user } = access;
  const body = (await request.json().catch(() => ({}))) as { lessonId?: unknown; messages?: unknown };
  const messages = parseMessages(body.messages);
  if (!messages) return Response.json({ error: "Write a message first." }, { status: 400 });
  const refused = await checkLimit(env, user, "chat");
  if (refused) return refused;
  await logUsage(env.DB, user.id, "chat");
  const instructions = await coachInstructions(env, user, typeof body.lessonId === "string" ? body.lessonId : null, "text");
  try {
    return eventStreamResponse(await openaiStream(env, { model: env.OPENAI_CHAT_MODEL, instructions, input: messages }));
  } catch (error) {
    console.error("Coach failed", error);
    return Response.json({ error: "Coach didn't respond. Try again in a moment." }, { status: 502 });
  }
}
