import { completeText } from "@/lib/ai/openai";
import type { TranscriptLine } from "./store";
import type { Scenario } from "./types";

export const RUBRIC = [
  { id: "opener", label: "Opener", hint: "Said who they are and why they're calling this business, briefly, and asked for something small." },
  { id: "discovery", label: "Questions", hint: "Asked open questions about the business and listened, rather than pitching non-stop." },
  { id: "value", label: "Value", hint: "Tied the website to more calls, customers or bookings for this business (not features)." },
  { id: "objections", label: "Objections", hint: "Agreed, asked, then answered each objection calmly; never argued." },
  { id: "close", label: "Next step", hint: "Asked clearly for a next step: send the link, book a callback, or send a checkout link." },
] as const;

export type Scorecard = {
  score: number;
  summary: string;
  categories: { id: (typeof RUBRIC)[number]["id"]; label: string; score: number; note: string }[];
  wins: string[];
  fixes: string[];
  betterLine: { they: string; you: string; instead: string } | null;
  // Share of words spoken by the caller, 0–1.
  talkRatio: number;
  outcome: string;
};

const INSTRUCTIONS = `You are a cold-calling coach who has trained hundreds of people to sell websites to local businesses by phone. Grade the caller ("user") in this practice call with an AI business owner ("prospect"). Be honest and specific, quote what they actually said, and be encouraging without inflating the score: a call that never got past the opener scores under 40; a solid call that got a clear next step scores 75+; 90+ is rare.

Rubric, each scored 0–10:
${RUBRIC.map((r) => `- ${r.id} (${r.label}): ${r.hint}`).join("\n")}

Reply with JSON only, no Markdown, in exactly this shape:
{"score": 0-100, "summary": "one sentence verdict", "outcome": "what the call ended with, e.g. 'Agreed to get the link by text'", "categories": [{"id": "opener", "score": 0-10, "note": "one short sentence"}, ...all five], "wins": ["up to 3 things done well"], "fixes": ["up to 3 most important things to change, as instructions"], "betterLine": {"they": "what the prospect said at the caller's weakest moment", "you": "what the caller said", "instead": "a better line to say, word for word"} or null}`;

export async function gradeCall(env: CloudflareEnv, scenario: Scenario, prospectName: string, transcript: TranscriptLine[]): Promise<Scorecard> {
  const words = (role: TranscriptLine["role"]) =>
    transcript.filter((l) => l.role === role).reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
  const mine = words("user");
  const talkRatio = mine + words("prospect") ? mine / (mine + words("prospect")) : 0;

  const text = await completeText(env, {
    model: env.OPENAI_CHAT_MODEL,
    instructions: INSTRUCTIONS,
    input: `Scenario: a ${scenario.mood} ${scenario.trade} owner called ${prospectName}, difficulty ${scenario.difficulty}. The caller talked ${Math.round(talkRatio * 100)}% of the time.\n\nTranscript:\n${transcript
      .map((l) => `${l.role === "user" ? "Caller" : "Prospect"}: ${l.text}`)
      .join("\n")}`,
  });
  const raw = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Partial<Scorecard> & {
    categories?: { id: string; score: number; note: string }[];
  };
  const clamp = (n: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
  return {
    score: clamp(raw.score, 100),
    summary: String(raw.summary ?? ""),
    outcome: String(raw.outcome ?? ""),
    categories: RUBRIC.map((r) => {
      const c = raw.categories?.find((x) => x.id === r.id);
      return { id: r.id, label: r.label, score: clamp(c?.score, 10), note: String(c?.note ?? "") };
    }),
    wins: (raw.wins ?? []).slice(0, 3).map(String),
    fixes: (raw.fixes ?? []).slice(0, 3).map(String),
    betterLine: raw.betterLine && raw.betterLine.instead ? raw.betterLine : null,
    talkRatio,
  };
}
