import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/server";
import { completeText } from "@/lib/ai/openai";
import { getConversation, listMessages } from "@/lib/chat/store";

const INSTRUCTIONS = `Suggest three short follow-up messages the user is likely to send next, written in the user's voice (e.g. "Write that as an email", "What about for a salon?").
Each under 60 characters, specific to the conversation, no numbering. Reply with only a JSON array of three strings.`;

// Three follow-up ideas for the end of a conversation, from a small fast model. Never fails loudly.
export async function POST(_request: Request, { params }: RouteContext<"/api/chat/[id]/suggest">) {
  const session = await getSession();
  if (!session) return Response.json({ suggestions: [] }, { status: 401 });
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  if (!(await getConversation(env.DB, id, session.user.id))) return Response.json({ suggestions: [] }, { status: 404 });

  const recent = (await listMessages(env.DB, id)).slice(-2);
  if (recent.at(-1)?.role !== "assistant") return Response.json({ suggestions: [] });
  const transcript = recent.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 3000)}`).join("\n\n");

  try {
    const text = await completeText(env, { model: env.OPENAI_FAST_MODEL, instructions: INSTRUCTIONS, input: transcript });
    const parsed = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)) as unknown;
    const suggestions = Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 90)).slice(0, 3)
      : [];
    return Response.json({ suggestions });
  } catch (error) {
    console.error("Follow-up suggestions failed", error);
    return Response.json({ suggestions: [] });
  }
}
