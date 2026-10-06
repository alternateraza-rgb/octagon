import { academyAccess, notFound } from "@/lib/academy/access";
import { gradeCall } from "@/lib/academy/grade";
import { prospectFor } from "@/lib/academy/practice";
import { listCalls, saveCall, type TranscriptLine } from "@/lib/academy/store";

export async function GET() {
  const access = await academyAccess();
  if (!access) return notFound();
  return Response.json(await listCalls(access.env.DB, access.user.id));
}

// Grades a finished practice call and saves it with its scorecard.
export async function POST(request: Request) {
  const access = await academyAccess();
  if (!access) return notFound();
  const { env, user } = access;
  const body = (await request.json().catch(() => ({}))) as {
    scenario?: unknown;
    leadId?: unknown;
    seed?: unknown;
    conversationId?: unknown;
    transcript?: unknown;
    durationSec?: unknown;
  };
  const found = await prospectFor(env, user.id, body);
  if (!found) return Response.json({ error: "Unknown call." }, { status: 400 });
  const transcript: TranscriptLine[] = (Array.isArray(body.transcript) ? body.transcript : [])
    .filter(
      (l): l is TranscriptLine =>
        !!l && (l.role === "user" || l.role === "prospect") && typeof l.text === "string" && l.text.trim().length > 0,
    )
    .slice(0, 200)
    .map((l) => ({ role: l.role, text: l.text.slice(0, 2000) }));
  if (transcript.filter((l) => l.role === "user").length < 2)
    return Response.json({ error: "That call was too short to score. Say a few things first." }, { status: 400 });

  try {
    const feedback = await gradeCall(env, found.scenario, found.prospect.name, transcript);
    const call = {
      scenario: found.scenario,
      leadId: found.lead?.id ?? null,
      prospectName: `${found.prospect.name}, ${found.prospect.business}`,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
      transcript,
      durationSec: Math.max(0, Math.min(3600, Math.round(Number(body.durationSec) || 0))),
      score: feedback.score,
      feedback,
    };
    const { id, createdAt } = await saveCall(env.DB, user.id, call);
    return Response.json({ ...call, id, createdAt });
  } catch (error) {
    console.error("Grading failed", error);
    return Response.json({ error: "Couldn't score that call. Try again in a moment." }, { status: 502 });
  }
}
