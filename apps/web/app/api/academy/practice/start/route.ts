import { academyAccess, notFound } from "@/lib/academy/access";
import { prospectFor } from "@/lib/academy/practice";
import { VOICE_SESSION_SECONDS, logVoiceSession, voiceSessionsLeft } from "@/lib/academy/store";
import { signedUrl, voiceEnabled } from "@/lib/academy/voice";

// Picks the prospect for a practice call and, for a voice call, opens an ElevenLabs session for it.
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { env, user } = access;
  const body = (await request.json().catch(() => ({}))) as { scenario?: unknown; leadId?: unknown; voice?: unknown };
  const found = await prospectFor(env, user.id, body);
  if (!found) return Response.json({ error: "Pick a trade, a mood and a difficulty." }, { status: 400 });
  const { seed, prospect } = found;
  const who = { name: prospect.name, business: prospect.business, trade: prospect.trade, city: prospect.city, firstMessage: prospect.firstMessage };

  if (body.voice !== true) return Response.json({ seed, prospect: who, voice: null });
  if (!voiceEnabled(env, "prospect")) return Response.json({ error: "Voice calls aren't set up yet. Practise by text for now." }, { status: 503 });
  if ((await voiceSessionsLeft(env.DB, user.id)) <= 0)
    return Response.json({ error: "You've used this month's voice sessions. Practise by text for now." }, { status: 429 });
  try {
    const url = await signedUrl(env, "prospect");
    await logVoiceSession(env.DB, user.id, "prospect");
    return Response.json({
      seed,
      prospect: who,
      voice: {
        signedUrl: url,
        overrides: { agent: { prompt: { prompt: prospect.prompt }, firstMessage: prospect.firstMessage } },
        maxSeconds: VOICE_SESSION_SECONDS,
      },
    });
  } catch (error) {
    console.error("Practice voice failed", error);
    return Response.json({ error: "Couldn't start the call. Try again, or practise by text." }, { status: 502 });
  }
}
