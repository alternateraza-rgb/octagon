// SerpApi: Google Maps results without a Google Cloud account. Three engines are used:
// - google_maps (type=search): 20 businesses per page, with phone, website, rating and photo.
// - google_maps_reviews: a listing's reviews, 8 on the first page.
// - google: a web search, which the contact hunt reads emails out of.
// Each request is one search on the SerpApi plan, so every call is logged (api_call) and capped per
// account per day, plus an optional monthly budget across all accounts.
import type { Country, Review } from "./places";

const BASE = "https://serpapi.com/search.json";
const DAY = 24 * 60 * 60 * 1000;
// SerpApi searches one account may spend in a day: about 25 searches' worth of cards plus a hunt and
// reviews for every business picked.
export const SERP_DAILY_PER_USER = 120;

export class SerpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// A business as it appears on Google Maps.
export type Listing = {
  placeId: string;
  dataId: string | null;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: Country;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number;
  website: string | null;
  mapsUrl: string;
  photoUrl: string | null;
  snippet: string | null;
  hours: string[];
  closed: boolean;
};

export const serpEnabled = (env: CloudflareEnv) => !!env.SERPAPI_API_KEY;

async function guard(env: CloudflareEnv, userId: string | null) {
  const now = Date.now();
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const budget = Number(env.SERPAPI_MONTHLY_BUDGET) || 0;
  const [mine, month] = await Promise.all([
    userId
      ? env.DB.prepare(`select count(*) as n from api_call where userId = ? and provider = 'serpapi' and createdAt >= ?`)
          .bind(userId, now - DAY)
          .first<{ n: number }>()
      : null,
    budget
      ? env.DB.prepare(`select count(*) as n from api_call where provider = 'serpapi' and createdAt >= ?`)
          .bind(monthStart.getTime())
          .first<{ n: number }>()
      : null,
  ]);
  if (mine && mine.n >= SERP_DAILY_PER_USER) {
    throw new SerpError("Octa has searched a lot for you today. It picks up again tomorrow.", 429);
  }
  if (month && month.n >= budget) throw new SerpError("Octa is resting until next month's searches open up.", 503);
}

async function call<T>(env: CloudflareEnv, userId: string | null, kind: string, params: Record<string, string>): Promise<T> {
  if (!env.SERPAPI_API_KEY) throw new SerpError("Business search isn't set up yet.", 503);
  await guard(env, userId);
  const url = `${BASE}?${new URLSearchParams({ ...params, api_key: env.SERPAPI_API_KEY })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) }).catch(() => null);
  if (!res) throw new SerpError("Couldn't reach Google Maps. Try again.", 502);
  const body = (await res.json().catch(() => null)) as (T & { error?: string; search_metadata?: { status?: string } }) | null;
  // Searches SerpApi answers from its cache aren't billed, but they're rare enough to count anyway.
  await env.DB.prepare(`insert into api_call (id, userId, provider, kind, createdAt) values (?, ?, 'serpapi', ?, ?)`)
    .bind(crypto.randomUUID(), userId, kind, Date.now())
    .run();
  if (!res.ok || !body) {
    console.error("SerpApi request failed", res.status, kind, body?.error);
    const error = body?.error ?? "";
    if (res.status === 401) throw new SerpError("The SerpApi key isn't valid. Check the SERPAPI_API_KEY secret.", 503);
    if (res.status === 429 || /run out of searches|plan/i.test(error)) {
      throw new SerpError("Octa's monthly searches have run out. They reset with the SerpApi plan.", 503);
    }
    throw new SerpError("Google Maps didn't answer. Try again in a minute.", 502);
  }
  // "Google hasn't returned any results" comes back as an error with status 200.
  if (body.error && !/hasn't returned any results/i.test(body.error)) {
    console.error("SerpApi error", kind, body.error);
    throw new SerpError("Google Maps didn't answer. Try again in a minute.", 502);
  }
  return body;
}

type SerpLocal = {
  title?: string;
  place_id?: string;
  data_id?: string;
  gps_coordinates?: { latitude?: number; longitude?: number };
  rating?: number;
  reviews?: number;
  type?: string;
  address?: string;
  phone?: string;
  website?: string;
  thumbnail?: string;
  open_state?: string;
  operating_hours?: Record<string, string>;
  user_review?: string;
  extensions?: unknown;
};

// "123 King St E, Hamilton, ON L8N 1B1" → Hamilton, ON. "Austin, TX 78701" → Austin, TX.
export function placeOf(address: string | null | undefined): { city: string | null; region: string | null } {
  const parts = (address ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  const last = parts.at(-1) ?? "";
  const tail = /^(united states|usa|canada)$/i.test(last) ? parts.slice(0, -1) : parts;
  const regionPart = tail.at(-1) ?? "";
  const region = /^([A-Z]{2})\b/.exec(regionPart)?.[1] ?? null;
  const city = region && tail.length >= 2 ? tail.at(-2)! : null;
  return { city, region };
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function hoursOf(hours: Record<string, string> | undefined) {
  if (!hours) return [];
  return DAYS.filter((d) => hours[d]).map((d) => `${d[0].toUpperCase()}${d.slice(1)}: ${hours[d]}`);
}

function listing(r: SerpLocal, country: Country): Listing | null {
  if (!r.place_id || !r.title) return null;
  const { city, region } = placeOf(r.address);
  return {
    placeId: r.place_id,
    dataId: r.data_id ?? null,
    name: r.title,
    category: r.type ?? null,
    phone: r.phone ?? null,
    address: r.address ?? null,
    city,
    region,
    country,
    lat: r.gps_coordinates?.latitude ?? null,
    lng: r.gps_coordinates?.longitude ?? null,
    rating: r.rating ?? null,
    reviewCount: r.reviews ?? 0,
    website: r.website ?? null,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
    photoUrl: r.thumbnail ?? null,
    snippet: r.user_review?.replace(/^"|"$/g, "").trim() || null,
    hours: hoursOf(r.operating_hours),
    closed: /closed/i.test(r.open_state ?? "") && /permanently|temporarily/i.test(r.open_state ?? ""),
  };
}

// One page (20) of Google Maps results for a query such as "plumbers in Hamilton, ON, Canada".
export async function serpMapsSearch(env: CloudflareEnv, userId: string, query: string, country: Country, page: number) {
  const body = await call<{ local_results?: SerpLocal[]; place_results?: SerpLocal; serpapi_pagination?: { next?: string } }>(
    env,
    userId,
    "maps",
    {
      engine: "google_maps",
      type: "search",
      q: query,
      hl: "en",
      gl: country.toLowerCase(),
      start: String(page * 20),
    },
  );
  const raw = body.local_results ?? (body.place_results ? [body.place_results] : []);
  const listings = raw.map((r) => listing(r, country)).filter((l): l is Listing => l !== null);
  return { listings, more: !!body.serpapi_pagination?.next && raw.length >= 20 };
}

type SerpReview = {
  link?: string;
  rating?: number;
  date?: string;
  iso_date?: string;
  snippet?: string;
  extracted_snippet?: { original?: string };
  user?: { name?: string; link?: string; thumbnail?: string };
};

// The first page of a listing's reviews (Google's "most relevant" order), in the Places Review shape
// so lib/agents/inject.ts and prompt.ts use them unchanged.
export async function serpReviews(env: CloudflareEnv, userId: string | null, dataId: string): Promise<Review[]> {
  const body = await call<{ reviews?: SerpReview[] }>(env, userId, "reviews", {
    engine: "google_maps_reviews",
    data_id: dataId,
    hl: "en",
  });
  return (body.reviews ?? [])
    .map((r): Review => {
      const text = (r.extracted_snippet?.original ?? r.snippet ?? "").trim();
      return {
        rating: r.rating,
        text: text ? { text, languageCode: "en" } : undefined,
        relativePublishTimeDescription: r.date,
        publishTime: r.iso_date,
        googleMapsUri: r.link,
        authorAttribution: { displayName: r.user?.name, uri: r.user?.link, photoUri: r.user?.thumbnail },
      };
    })
    .filter((r) => r.text);
}

export type WebResult = { title?: string; link?: string; snippet?: string; text: string };

// A Google web search, flattened to the text of each result for the contact hunt.
export async function serpWebSearch(env: CloudflareEnv, userId: string | null, q: string, country: Country) {
  const body = await call<{
    organic_results?: { title?: string; link?: string; snippet?: string; rich_snippet?: unknown; about_this_result?: unknown }[];
    knowledge_graph?: Record<string, unknown> & { website?: string };
    local_results?: unknown;
  }>(env, userId, "web", { engine: "google", q, hl: "en", gl: country.toLowerCase(), num: "10" });
  const results: WebResult[] = (body.organic_results ?? []).map((r) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
    text: [r.title, r.snippet, JSON.stringify(r.rich_snippet ?? "")].join(" "),
  }));
  if (body.knowledge_graph) {
    // Titled with the business it's about, so the hunt can tell whether that's this business.
    const title = typeof body.knowledge_graph.title === "string" ? body.knowledge_graph.title : "";
    results.unshift({ title, link: body.knowledge_graph.website, text: JSON.stringify(body.knowledge_graph) });
  }
  return results;
}
