import { academyAccess, notFound } from "@/lib/academy/access";
import { coachGreeting, coachInstructions } from "@/lib/academy/coach";
import { VOICE_SESSION_SECONDS, logVoiceSession, voiceSessionsLeft } from "@/lib/academy/store";
import { signedUrl, voiceEnabled } from "@/lib/academy/voice";

// Starts a voice session with Coach: a signed URL plus the prompt for the lesson on screen.
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { env, user } = access;
  if (!voiceEnabled(env, "coach")) return Response.json({ error: "Voice isn't set up yet.", voice: false }, { status: 503 });
  if ((await voiceSessionsLeft(env.DB, user.id)) <= 0)
    return Response.json({ error: "You've used this month's voice sessions. Coach still answers by text." }, { status: 429 });
  const { lessonId } = (await request.json().catch(() => ({}))) as { lessonId?: unknown };
  const lesson = typeof lessonId === "string" ? lessonId : null;
  try {
    const [url, prompt] = await Promise.all([signedUrl(env, "coach"), coachInstructions(env, user, lesson, "voice")]);
    await logVoiceSession(env.DB, user.id, "coach");
    return Response.json({
      signedUrl: url,
      overrides: { agent: { prompt: { prompt }, firstMessage: coachGreeting(user.name, lesson) } },
      maxSeconds: VOICE_SESSION_SECONDS,
    });
  } catch (error) {
    console.error("Coach voice failed", error);
    return Response.json({ error: "Couldn't start voice. Try again, or type instead." }, { status: 502 });
  }
}
