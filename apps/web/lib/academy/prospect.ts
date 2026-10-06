import { DIFFICULTIES, MOODS, TRADES } from "./scenarios";
import type { AcademyLead } from "./store";
import type { Scenario } from "./types";

export type Prospect = { name: string; business: string; trade: string; city: string; firstMessage: string; prompt: string };

const MOOD_NOTES: Record<Scenario["mood"], string> = {
  busy: "You're in the middle of work (on a job, with a customer, in a rush). Short answers. You'll hang up if they ramble or don't get to the point within about 20 seconds.",
  skeptical: "You get sales calls every week and assume this is a scam or an upsell. Ask pointed questions: who are you, how did you get my number, what's the catch, how much.",
  friendly: "You're warm and chatty and happy to talk, but you're careful with money. You won't agree to pay without understanding what you get and why it's worth it.",
  burned: "Two years ago you paid a web designer $1,500; they built half a site and stopped answering. You're wary and bring it up early. Trust is what you need.",
};

// The AI business owner for a practice cold call. Written for a voice agent, but works as text too.
export function buildProspect(scenario: Scenario, lead: AcademyLead | null, seed = Math.random()): Prospect {
  const trade = TRADES[scenario.trade];
  const name = trade.owners[Math.floor(seed * trade.owners.length)];
  const business = lead?.name ?? trade.business;
  const city = lead?.city ?? trade.city;
  const kind = lead?.category ?? trade.label.toLowerCase();
  const objections = DIFFICULTIES[scenario.difficulty].objections;
  const details = lead
    ? `Your business: ${lead.name}, a ${kind} in ${city ?? "town"}.` +
      (lead.rating ? ` ${lead.rating} stars from ${lead.reviewCount} Google reviews.` : "") +
      (lead.snippet ? ` A review customers left: "${lead.snippet}".` : "") +
      " You have no website."
    : `Your business: ${business}, a ${kind} in ${city}. Good Google reviews, about 8 years in business, no website, just a Google listing${scenario.trade === "salon" || scenario.trade === "cafe" ? " and an Instagram page" : ""}.`;

  const prompt = `You are ${name}, the owner of ${business}. You're answering your phone to a cold call from someone you don't know. This is a sales-training roleplay: stay fully in character as ${name} for the whole call, and never mention being an AI, a roleplay or training.

${details}

Mood: ${MOODS[scenario.mood].label}. ${MOOD_NOTES[scenario.mood]}

How to play the call:
- Speak like a real person on the phone: short sentences, one or two at a time, casual, sometimes "uh" or "sorry, who is this?". Never give speeches or lists.
- Don't make it easy. Raise ${objections === 1 ? "one realistic objection" : `about ${objections} realistic objections over the call`}, one at a time, picked to suit you: price, "not interested", "we get enough work from word of mouth", "my nephew does it", "just email me", "need to ask my partner", "how did you get my number", "I'm busy".
- If the caller handles an objection well (agrees, asks a good question, gives a reason that matters to *your* business), soften. If they argue, ramble, read a script robotically, or talk over you, get shorter and cooler, and on ${scenario.difficulty === "hard" ? "the second" : "the third"} bad moment say you have to go and end the call.
- If they say they've built you a website, be curious but guarded. You can agree to get the link by text or email if they ask well.
- Only agree to a next step (looking at the site, a callback, a price, paying) when the caller has earned it. ${scenario.difficulty === "easy" ? "You're fairly easy to win over." : scenario.difficulty === "hard" ? "You're hard to win over; it takes real skill." : "You're persuadable with a good pitch."}
- If they ask the price and don't say it, ask again. If they quote a price, react like a small business owner would.
- If the caller says goodbye, say goodbye back and stop.`;

  const greetings = {
    busy: `${business}, ${name} speaking. Make it quick.`,
    skeptical: `Hello, ${business}.`,
    friendly: `Hi there, ${business}, this is ${name}!`,
    burned: `${business}, ${name} here.`,
  };

  return { name, business, trade: kind, city: city ?? "", firstMessage: greetings[scenario.mood], prompt };
}
