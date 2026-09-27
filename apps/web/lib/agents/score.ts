// Which businesses are worth pitching, and in what order. Pure functions so they're easy to test.
import { countryOf, type Country, type Place } from "./places";

// Pages that aren't a website of the business's own: a lead that only has one of these still needs a site.
const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "fb.me",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "yelp.com",
  "yelp.ca",
  "linktr.ee",
  "linkin.bio",
  // Google's retired free sites: these links no longer work.
  "business.site",
  "g.page",
  "maps.app.goo.gl",
  "google.com",
  "nextdoor.com",
  "angi.com",
  "homeadvisor.com",
  "thumbtack.com",
  "houzz.com",
  "booksy.com",
  "vagaro.com",
  "squareup.com",
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "skipthedishes.com",
  "toasttab.com",
];

// Niches whose owners tend to pay well for a site that brings in calls.
const HIGH_VALUE = [
  "plumb",
  "roof",
  "hvac",
  "heating",
  "air condition",
  "electric",
  "contractor",
  "construction",
  "remodel",
  "landscap",
  "paving",
  "concrete",
  "fence",
  "pest",
  "clean",
  "moving",
  "mover",
  "locksmith",
  "garage door",
  "pool",
  "tree",
  "dent",
  "orthodon",
  "chiro",
  "physio",
  "physical therap",
  "clinic",
  "spa",
  "aesthetic",
  "salon",
  "barber",
  "nail",
  "lawyer",
  "attorney",
  "law firm",
  "notary",
  "account",
  "tax",
  "insurance",
  "real estate",
  "mortgage",
  "auto",
  "mechanic",
  "car repair",
  "body shop",
  "tire",
  "detailing",
  "towing",
  "veterinar",
  "groom",
  "restaurant",
  "catering",
  "bakery",
  "florist",
  "photograph",
  "tutor",
  "daycare",
  "gym",
  "fitness",
  "yoga",
  "martial arts",
];

export type WebPresence = "none" | "social";

export type ScoredPlace = {
  place: Place;
  country: Country;
  webPresence: WebPresence;
  socialUrl: string | null;
  score: number;
  reasons: string[];
};

function host(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// null when the business has a real website of its own.
export function webPresence(websiteUri: string | undefined): WebPresence | null {
  if (!websiteUri?.trim()) return "none";
  const h = host(websiteUri.trim());
  if (!h) return "none";
  return SOCIAL_HOSTS.some((s) => h === s || h.endsWith(`.${s}`)) ? "social" : null;
}

export const isHighValue = (category: string | undefined) =>
  !!category && HIGH_VALUE.some((k) => category.toLowerCase().includes(k));

// A business we'd pitch: open, reachable by phone, in the US or Canada, and without its own website.
export function qualify(place: Place): Omit<ScoredPlace, "score" | "reasons"> | null {
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null;
  if (!place.nationalPhoneNumber || !place.displayName?.text) return null;
  const country = countryOf(place);
  if (country !== "US" && country !== "CA") return null;
  const presence = webPresence(place.websiteUri);
  if (!presence) return null;
  return { place, country, webPresence: presence, socialUrl: presence === "social" ? place.websiteUri! : null };
}

// 0–100. No website at all beats a social page; an established, well-reviewed business in a niche
// that spends on marketing is the most likely to buy.
export function score(q: Omit<ScoredPlace, "score" | "reasons">, niche = ""): ScoredPlace {
  const { place } = q;
  const reviews = place.userRatingCount ?? 0;
  const rating = place.rating ?? 0;
  const category = place.primaryTypeDisplayName?.text;
  const reasons: string[] = [q.webPresence === "none" ? "No website" : "Social page only"];

  let points = q.webPresence === "none" ? 40 : 30;
  points += Math.min(30, Math.round(Math.log10(reviews + 1) * 15));
  if (reviews) {
    points += rating >= 4.5 ? 15 : rating >= 4 ? 10 : rating >= 3.5 ? 5 : 0;
    reasons.push(`${rating.toFixed(1)}★ · ${reviews.toLocaleString("en-US")} review${reviews === 1 ? "" : "s"}`);
  } else {
    reasons.push("No reviews yet");
  }
  if (reviews >= 50) reasons.push("Established");
  if (isHighValue(category) || isHighValue(niche)) {
    points += 15;
    reasons.push("High-value niche");
  }
  return { ...q, score: Math.max(0, Math.min(100, points)), reasons };
}

export function rank(places: Place[], niche: string) {
  return places
    .map(qualify)
    .filter((q) => q !== null)
    .map((q) => score(q, niche))
    .sort((a, b) => b.score - a.score);
}
