import { notFound } from "next/navigation";
import { CallSimulator } from "@/components/academy/call-simulator";
import { academyAccess } from "@/lib/academy/access";
import { DIFFICULTIES, MOODS, TRADES } from "@/lib/academy/scenarios";
import { listAcademyLeads, listCalls } from "@/lib/academy/store";
import type { Difficulty, Mood, Trade } from "@/lib/academy/types";
import { voiceEnabled } from "@/lib/academy/voice";

export const metadata = { title: "Practice calls" };
export const dynamic = "force-dynamic";

type Search = { searchParams: Promise<Record<string, string | undefined>> };

export default async function PracticePage({ searchParams }: Search) {
  const access = await academyAccess();
  if (!access) notFound();
  const { env, user } = access;
  const q = await searchParams;
  const [leads, calls] = await Promise.all([listAcademyLeads(env.DB, user.id, env.SITES_DOMAIN), listCalls(env.DB, user.id)]);
  const preset = {
    trade: q.trade && q.trade in TRADES ? (q.trade as Trade) : undefined,
    mood: q.mood && q.mood in MOODS ? (q.mood as Mood) : undefined,
    difficulty: q.difficulty && q.difficulty in DIFFICULTIES ? (q.difficulty as Difficulty) : undefined,
    lead: q.lead,
  };
  return <CallSimulator leads={leads} calls={calls} voice={voiceEnabled(env, "prospect")} preset={preset} />;
}
