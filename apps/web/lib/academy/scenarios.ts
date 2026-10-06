import type { Difficulty, Mood, Scenario, Trade } from "./types";

// The practice simulator's choices. `owners` are the names the AI prospect can go by.
export const TRADES: Record<Trade, { label: string; business: string; city: string; owners: string[] }> = {
  plumber: { label: "Plumber", business: "Reliable Rooter Plumbing", city: "Mississauga", owners: ["Dave", "Marco", "Sandra"] },
  salon: { label: "Hair salon", business: "Bloom Hair Studio", city: "Austin", owners: ["Maria", "Jess", "Priya"] },
  dentist: { label: "Dentist", business: "Harbor Family Dental", city: "Halifax", owners: ["Dr. Chen", "Dr. Patel", "Dr. Okafor"] },
  gym: { label: "Gym", business: "Iron Works Fitness", city: "Denver", owners: ["Mike", "Tasha", "Leon"] },
  cafe: { label: "Café", business: "Corner Grind Café", city: "Portland", owners: ["Sam", "Elena", "Ahmed"] },
  landscaper: { label: "Landscaper", business: "Greenline Landscaping", city: "Calgary", owners: ["Rick", "Jo", "Tom"] },
};

export const MOODS: Record<Mood, { label: string; hint: string }> = {
  busy: { label: "Busy", hint: "On a job, distracted, wants you to get to the point." },
  skeptical: { label: "Skeptical", hint: "Gets sales calls every week. Doubts every claim." },
  friendly: { label: "Friendly", hint: "Chatty and open, but won't buy without a reason." },
  burned: { label: "Burned before", hint: "Paid a web guy who vanished. Trust is the issue." },
};

export const DIFFICULTIES: Record<Difficulty, { label: string; objections: number }> = {
  easy: { label: "Easy", objections: 1 },
  normal: { label: "Normal", objections: 2 },
  hard: { label: "Hard", objections: 4 },
};

export function parseScenario(value: unknown): Scenario | null {
  const v = (value ?? {}) as Partial<Scenario>;
  if (!v.trade || !(v.trade in TRADES)) return null;
  if (!v.mood || !(v.mood in MOODS)) return null;
  if (!v.difficulty || !(v.difficulty in DIFFICULTIES)) return null;
  return { trade: v.trade, mood: v.mood, difficulty: v.difficulty };
}
