// Where businesses come from: Octacore's shared business table first, SerpApi when it doesn't know
// the niche and city yet (or what it knows is over two weeks old).
import {
  REVIEWS_TTL,
  cachedQuery,
  getBusiness,
  getBusinesses,
  queryKey,
  saveQuery,
  saveReviews,
  toDetails,
  upsertListings,
  type Business,
} from "./business";
import type { Country } from "./places";
import { serpMapsSearch, serpReviews } from "./serp";

// Google Maps stops after about 120 results; three pages is plenty of good fits for one city.
export const MAX_PAGES = 3;

export async function findPage(
  env: CloudflareEnv,
  userId: string,
  search: { niche: string; location: string; country: Country },
  page: number,
): Promise<{ businesses: Business[]; more: boolean; cached: boolean }> {
  const key = queryKey(search.niche, search.location, search.country, page);
  const hit = await cachedQuery(env.DB, key);
  if (hit) return { businesses: await getBusinesses(env.DB, hit.placeIds), more: hit.more && page + 1 < MAX_PAGES, cached: true };

  const query = `${search.niche} in ${search.location}, ${search.country === "CA" ? "Canada" : "USA"}`;
  const { listings, more } = await serpMapsSearch(env, userId, query, search.country, page);
  await upsertListings(env.DB, listings);
  const placeIds = [...new Set(listings.map((l) => l.placeId))];
  await saveQuery(env.DB, key, placeIds, more);
  return { businesses: await getBusinesses(env.DB, placeIds), more: more && page + 1 < MAX_PAGES, cached: false };
}

// A business with its reviews, fetched once and shared for a month.
export async function withReviews(env: CloudflareEnv, userId: string | null, placeId: string) {
  const b = await getBusiness(env.DB, placeId);
  if (!b) return null;
  const fresh = b.reviews && b.reviewsAt && Date.now() - b.reviewsAt < REVIEWS_TTL;
  if (fresh || !b.dataId || !b.reviewCount) return b;
  const reviews = await serpReviews(env, userId, b.dataId);
  await saveReviews(env.DB, placeId, reviews);
  return { ...b, reviews, reviewsAt: Date.now() };
}

export async function businessDetails(env: CloudflareEnv, userId: string | null, placeId: string) {
  const b = await withReviews(env, userId, placeId);
  return b ? { business: b, details: toDetails(b) } : null;
}
