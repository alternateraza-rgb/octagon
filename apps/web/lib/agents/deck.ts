// A search's deck: the good fits waiting to be shown, three at a time. Kept in KV for a day, and
// topped up from the next page of Google Maps only when the user gets close to the end, so a search
// costs one SerpApi call until someone actually goes deeper.
import { needsHunt, toPlace, unavailable, type Business, type Confidence, type ContactStatus } from "./business";
import { MAX_PAGES, findPage } from "./find";
import type { Country } from "./places";
import { rank, type WebPresence } from "./score";

export const HAND = 3;
const TTL = 24 * 60 * 60;

export type Card = {
  placeId: string;
  name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  photoUrl: string | null;
  snippet: string | null;
  webPresence: WebPresence;
  socialUrl: string | null;
  mapsUrl: string | null;
  score: number;
  reasons: string[];
  // Known already from another search's hunt.
  email: string | null;
  emailConfidence: Confidence | null;
  contactStatus: ContactStatus;
};

type Deck = {
  userId: string;
  niche: string;
  location: string;
  country: Country;
  page: number;
  more: boolean;
  queue: Card[];
  seen: string[];
  shown: number;
  found: number;
  qualified: number;
};

const key = (searchId: string) => `agent:deck:${searchId}`;

function card(b: Business, s: ReturnType<typeof rank>[number]): Card {
  return {
    placeId: b.placeId,
    name: b.name,
    category: b.category,
    city: b.city,
    region: b.region,
    phone: b.phone,
    rating: b.rating,
    reviewCount: b.reviewCount,
    photoUrl: b.photoUrl,
    snippet: b.snippet,
    webPresence: s.webPresence,
    socialUrl: s.socialUrl,
    mapsUrl: b.mapsUrl,
    score: s.score,
    reasons: s.reasons,
    email: b.contactStatus === "found" ? b.email : null,
    emailConfidence: b.contactStatus === "found" ? b.emailConfidence : null,
    contactStatus: needsHunt(b) ? "pending" : b.contactStatus,
  };
}

// The businesses on one page worth showing this user: no website of their own, reachable by phone,
// with reviews, and not already picked or skipped (by them) or claimed (by anyone, recently).
async function fill(env: CloudflareEnv, deck: Deck) {
  const { businesses, more } = await findPage(env, deck.userId, deck, deck.page);
  const byId = new Map(businesses.map((b) => [b.placeId, b]));
  const fresh = businesses.filter((b) => !deck.seen.includes(b.placeId));
  const ranked = rank(fresh.map(toPlace), deck.niche).filter((s) => (s.place.userRatingCount ?? 0) > 0);
  const blocked = await unavailable(env.DB, deck.userId, ranked.map((s) => s.place.id));
  const cards = ranked.filter((s) => !blocked.has(s.place.id)).map((s) => card(byId.get(s.place.id)!, s));
  deck.queue.push(...cards);
  deck.seen.push(...businesses.map((b) => b.placeId));
  deck.found += businesses.length;
  deck.qualified += cards.length;
  deck.more = more;
}

async function save(env: CloudflareEnv, searchId: string, deck: Deck) {
  await env.SITES.put(key(searchId), JSON.stringify(deck), { expirationTtl: TTL });
}

async function deal(env: CloudflareEnv, searchId: string, deck: Deck) {
  // Keep going until there's a full hand or Google runs out, so a page of all-websites doesn't
  // leave the user looking at an empty deck.
  while (deck.queue.length < HAND && deck.more && deck.page + 1 < MAX_PAGES) {
    deck.page += 1;
    await fill(env, deck);
  }
  const hand = deck.queue.splice(0, HAND);
  deck.shown += hand.length;
  await save(env, searchId, deck);
  return {
    cards: hand,
    // Waiting in the queue; more may come from the next page.
    left: deck.queue.length,
    more: deck.more && deck.page + 1 < MAX_PAGES,
    shown: deck.shown,
    found: deck.found,
    qualified: deck.qualified,
  };
}

export type Hand = Awaited<ReturnType<typeof deal>>;

export async function startDeck(
  env: CloudflareEnv,
  userId: string,
  searchId: string,
  search: { niche: string; location: string; country: Country },
) {
  const deck: Deck = { userId, ...search, page: 0, more: false, queue: [], seen: [], shown: 0, found: 0, qualified: 0 };
  await fill(env, deck);
  return deal(env, searchId, deck);
}

export async function nextHand(env: CloudflareEnv, userId: string, searchId: string) {
  const deck = await env.SITES.get<Deck>(key(searchId), "json");
  if (!deck || deck.userId !== userId) return null;
  return deal(env, searchId, deck);
}
