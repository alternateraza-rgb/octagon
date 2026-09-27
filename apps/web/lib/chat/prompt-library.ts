// Curated prompts for the chat's empty state and as-you-type suggestions. No API calls involved.
export type PromptCategory = "Popular" | "Sales" | "Pricing" | "Design" | "SEO" | "Copy" | "Clients";

export const CATEGORIES: PromptCategory[] = ["Popular", "Sales", "Pricing", "Design", "SEO", "Copy", "Clients"];

export const PROMPTS: { text: string; category: PromptCategory; popular?: boolean }[] = [
  { text: "Write a cold email to a dentist whose website looks dated", category: "Sales", popular: true },
  { text: "How should I price a five-page website for a restaurant?", category: "Pricing", popular: true },
  { text: "Give me ten local niches that still need better websites", category: "Sales", popular: true },
  { text: "Explain local SEO to a bakery owner in plain words", category: "SEO", popular: true },
  { text: "Write a follow-up email for a prospect who went quiet", category: "Sales" },
  { text: "Draft a short DM to pitch a website to a barbershop on Instagram", category: "Sales" },
  { text: "Write a phone script for calling local businesses about their website", category: "Sales" },
  { text: "How do I find businesses that don't have a website yet?", category: "Sales" },
  { text: "Turn this objection into a yes: “We already get customers from Facebook”", category: "Sales" },
  { text: "Write a proposal for a website redesign for a law firm", category: "Sales" },
  { text: "What should a monthly website care plan include and cost?", category: "Pricing" },
  { text: "How do I price a website with online booking?", category: "Pricing" },
  { text: "Should I charge a setup fee plus monthly, or one-off?", category: "Pricing" },
  { text: "Create three pricing tiers for small business websites", category: "Pricing" },
  { text: "How do I raise prices for existing clients without losing them?", category: "Pricing" },
  { text: "What should go on the homepage of a plumber's website?", category: "Design" },
  { text: "Suggest a colour palette for a luxury salon", category: "Design" },
  { text: "What makes a restaurant website convert visitors into bookings?", category: "Design" },
  { text: "Give me hero headline ideas for a boutique gym", category: "Design" },
  { text: "Which fonts feel premium but friendly for a café?", category: "Design" },
  { text: "Review the structure of a one-page website for a dentist", category: "Design" },
  { text: "Write a 30-day local SEO plan for a new salon", category: "SEO" },
  { text: "How do I get a small business into Google's map results?", category: "SEO" },
  { text: "Write meta titles and descriptions for a bakery's pages", category: "SEO" },
  { text: "Which keywords should a family lawyer in Toronto target?", category: "SEO" },
  { text: "How important are Google reviews for local rankings?", category: "SEO" },
  { text: "Write an About page for a family-run Italian restaurant", category: "Copy" },
  { text: "Rewrite this service description to sound more premium", category: "Copy" },
  { text: "Write five customer testimonials prompts to send to clients", category: "Copy" },
  { text: "Write a friendly FAQ section for a dog groomer", category: "Copy" },
  { text: "Write a call-to-action for a free consultation", category: "Copy" },
  { text: "Write the services section for a wedding photographer", category: "Copy" },
  { text: "How do I onboard a new website client smoothly?", category: "Clients" },
  { text: "Write a contract checklist for website projects", category: "Clients" },
  { text: "How do I handle a client who keeps asking for revisions?", category: "Clients" },
  { text: "Write a handover email for a finished website", category: "Clients" },
  { text: "What questions should I ask on a discovery call?", category: "Clients" },
  { text: "How do I ask happy clients for referrals?", category: "Clients" },
];

// Prompts whose words contain every word typed, best matches first.
export function matchPrompts(query: string, limit = 5) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || query.length < 2) return [];
  return PROMPTS.filter((p) => {
    const text = p.text.toLowerCase();
    return words.every((w) => text.includes(w));
  })
    .map((p) => ({
      ...p,
      score: p.text.toLowerCase().startsWith(query.toLowerCase()) ? 0 : p.text.toLowerCase().indexOf(words[0]),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}
