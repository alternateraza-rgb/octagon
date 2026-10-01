// Octacore's own record of every business Octa has found, shared by all accounts. A niche and city
// searched once is served from here for two weeks, and a business's reviews and hunted email are
// fetched once and reused by whoever picks it next.
import type { Country, Place, PlaceDetails, Review } from "./places";
import type { Listing } from "./serp";
import { webPresence, type WebPresence } from "./score";

const DAY = 24 * 60 * 60 * 1000;
export const QUERY_TTL = 14 * DAY;
export const REVIEWS_TTL = 30 * DAY;
export const HUNT_RETRY = 30 * DAY;
// How long a business someone picked stays out of everyone else's searches.
export const CLAIM_DAYS = 30;

export type ContactStatus = "pending" | "found" | "none";
export type Confidence = "high" | "medium" | "low";

export type Business = Omit<Listing, "hours" | "closed" | "mapsUrl"> & {
  mapsUrl: string | null;
  hours: string[];
  closed: boolean;
  webPresence: WebPresence | null;
  socialUrl: string | null;
  reviews: Review[] | null;
  reviewsAt: number | null;
  email: string | null;
  emailSource: string | null;
  emailConfidence: Confidence | null;
  contactStatus: ContactStatus;
  huntedAt: number | null;
  firstSeenAt: number;
  lastSeenAt: number;
};

type Row = Omit<Business, "hours" | "closed" | "reviews"> & { hoursJson: string | null; closed: number; reviewsJson: string | null };

const parseJson = <T>(s: string | null, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const parse = ({ hoursJson, closed, reviewsJson, ...row }: Row): Business => ({
  ...row,
  hours: parseJson<string[]>(hoursJson, []),
  closed: !!closed,
  reviews: reviewsJson ? parseJson<Review[]>(reviewsJson, []) : null,
});

export const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const queryKey = (niche: string, location: string, country: Country, page: number) =>
  `${normalize(niche)}|${normalize(location)}|${country}|${page}`;

// Saves what a search returned. Contact and review fields from earlier hunts are kept.
export async function upsertListings(db: D1Database, listings: Listing[]) {
  if (!listings.length) return;
  const now = Date.now();
  await db.batch(
    listings.map((l) => {
      const presence = webPresence(l.website ?? undefined);
      return db
        .prepare(
          `insert into business (placeId, dataId, name, category, phone, address, city, region, country, lat, lng, rating,
             reviewCount, webPresence, website, socialUrl, mapsUrl, photoUrl, snippet, hoursJson, closed, firstSeenAt, lastSeenAt)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           on conflict (placeId) do update set dataId = coalesce(excluded.dataId, dataId), name = excluded.name,
             category = excluded.category, phone = coalesce(excluded.phone, phone), address = excluded.address,
             city = excluded.city, region = excluded.region, country = excluded.country, lat = excluded.lat, lng = excluded.lng,
             rating = excluded.rating, reviewCount = excluded.reviewCount, webPresence = excluded.webPresence,
             website = excluded.website, socialUrl = excluded.socialUrl, mapsUrl = excluded.mapsUrl,
             photoUrl = coalesce(excluded.photoUrl, photoUrl), snippet = coalesce(excluded.snippet, snippet),
             hoursJson = excluded.hoursJson, closed = excluded.closed, lastSeenAt = excluded.lastSeenAt`,
        )
        .bind(
          l.placeId,
          l.dataId,
          l.name,
          l.category,
          l.phone,
          l.address,
          l.city,
          l.region,
          l.country,
          l.lat,
          l.lng,
          l.rating,
          l.reviewCount,
          presence,
          l.website,
          presence === "social" ? l.website : null,
          l.mapsUrl,
          l.photoUrl,
          l.snippet,
          JSON.stringify(l.hours),
          l.closed ? 1 : 0,
          now,
          now,
        );
    }),
  );
}

export async function getBusinesses(db: D1Database, placeIds: string[]) {
  if (!placeIds.length) return [];
  const out = new Map<string, Business>();
  // D1 caps bound parameters at 100 per statement.
  for (let i = 0; i < placeIds.length; i += 90) {
    const ids = placeIds.slice(i, i + 90);
    const { results } = await db
      .prepare(`select * from business where placeId in (${ids.map(() => "?").join(",")})`)
      .bind(...ids)
      .all<Row>();
    for (const r of results) out.set(r.placeId, parse(r));
  }
  return placeIds.map((id) => out.get(id)).filter((b): b is Business => !!b);
}

export async function getBusiness(db: D1Database, placeId: string) {
  const row = await db.prepare(`select * from business where placeId = ?`).bind(placeId).first<Row>();
  return row ? parse(row) : null;
}

export async function cachedQuery(db: D1Database, key: string) {
  const row = await db
    .prepare(`select placeIds, more, fetchedAt from business_query where key = ?`)
    .bind(key)
    .first<{ placeIds: string; more: number; fetchedAt: number }>();
  if (!row || Date.now() - row.fetchedAt > QUERY_TTL) return null;
  return { placeIds: parseJson<string[]>(row.placeIds, []), more: !!row.more };
}

export function saveQuery(db: D1Database, key: string, placeIds: string[], more: boolean) {
  return db
    .prepare(
      `insert into business_query (key, placeIds, more, fetchedAt) values (?, ?, ?, ?)
       on conflict (key) do update set placeIds = excluded.placeIds, more = excluded.more, fetchedAt = excluded.fetchedAt`,
    )
    .bind(key, JSON.stringify(placeIds), more ? 1 : 0, Date.now())
    .run();
}

export function saveReviews(db: D1Database, placeId: string, reviews: Review[]) {
  return db
    .prepare(`update business set reviewsJson = ?, reviewsAt = ? where placeId = ?`)
    .bind(JSON.stringify(reviews), Date.now(), placeId)
    .run();
}

export function saveContact(
  db: D1Database,
  placeId: string,
  found: { email: string; source: string | null; confidence: Confidence } | null,
) {
  return db
    .prepare(
      `update business set email = ?, emailSource = ?, emailConfidence = ?, contactStatus = ?, huntedAt = ? where placeId = ?`,
    )
    .bind(found?.email ?? null, found?.source ?? null, found?.confidence ?? null, found ? "found" : "none", Date.now(), placeId)
    .run();
}

export const needsHunt = (b: Business) =>
  b.contactStatus === "pending" || (b.contactStatus === "none" && Date.now() - (b.huntedAt ?? 0) > HUNT_RETRY);

// Businesses this user can't be shown: ones they've already picked or skipped, and ones another
// account picked in the last CLAIM_DAYS, so two Octacore users don't pitch the same business at once.
export async function unavailable(db: D1Database, userId: string, placeIds: string[]) {
  const out = new Set<string>();
  const since = Date.now() - CLAIM_DAYS * DAY;
  for (let i = 0; i < placeIds.length; i += 90) {
    const ids = placeIds.slice(i, i + 90);
    const { results } = await db
      .prepare(
        `select distinct placeId from lead where placeId in (${ids.map(() => "?").join(",")})
           and (userId = ? or (status != 'dismissed' and createdAt >= ?))`,
      )
      .bind(...ids, userId, since)
      .all<{ placeId: string }>();
    for (const r of results) out.add(r.placeId);
  }
  return out;
}

// The shapes lib/agents/score.ts, inject.ts and prompt.ts were written for (Google Places).
function addressComponents(b: Business) {
  return [
    b.city ? { longText: b.city, shortText: b.city, types: ["locality"] } : null,
    b.region ? { longText: b.region, shortText: b.region, types: ["administrative_area_level_1"] } : null,
    { longText: b.country, shortText: b.country, types: ["country"] },
  ].filter((c) => c !== null);
}

export function toPlace(b: Business): Place {
  return {
    id: b.placeId,
    displayName: { text: b.name },
    primaryTypeDisplayName: b.category ? { text: b.category } : undefined,
    formattedAddress: b.address ?? undefined,
    addressComponents: addressComponents(b),
    nationalPhoneNumber: b.phone ?? undefined,
    websiteUri: b.website ?? undefined,
    rating: b.rating ?? undefined,
    userRatingCount: b.reviewCount,
    businessStatus: b.closed ? "CLOSED_PERMANENTLY" : "OPERATIONAL",
    googleMapsUri: b.mapsUrl ?? undefined,
  };
}

export function toDetails(b: Business): PlaceDetails {
  return {
    ...toPlace(b),
    internationalPhoneNumber: b.phone ? `${b.country === "US" || b.country === "CA" ? "+1 " : ""}${b.phone}` : undefined,
    regularOpeningHours: b.hours.length ? { weekdayDescriptions: b.hours } : undefined,
    reviews: b.reviews ?? [],
  };
}
