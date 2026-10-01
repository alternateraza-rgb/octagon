// Google Places API (New). Octa Agents now searches through SerpApi (lib/agents/serp.ts) and only uses
// the Place, PlaceDetails and Review shapes from here; the calls below are kept for switching back once
// Google Cloud billing is set up. Two calls:
// - Text Search, billed per page of up to 20 places. Asking for websiteUri and the phone number puts
//   it on the Enterprise SKU, which is what lets us drop businesses that already have a website
//   before paying for anything else.
// - Place Details, billed per place and only made when a lead is opened or built. It adds reviews and
//   opening hours (Enterprise + Atmosphere).
// Google's terms allow storing place IDs indefinitely but not the rest, so callers keep the other
// fields only as a snapshot that is refreshed from here.

const BASE = "https://places.googleapis.com/v1";

const PLACE_FIELDS = [
  "id",
  "displayName",
  "primaryTypeDisplayName",
  "formattedAddress",
  "addressComponents",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "businessStatus",
  "googleMapsUri",
];
const SEARCH_MASK = [...PLACE_FIELDS.map((f) => `places.${f}`), "nextPageToken"].join(",");
const DETAILS_MASK = [
  ...PLACE_FIELDS,
  "internationalPhoneNumber",
  "regularOpeningHours",
  "editorialSummary",
  "reviews",
].join(",");

// Text Search returns at most three pages of 20.
const MAX_PAGES = 3;

export type Country = "US" | "CA";

type LocalizedText = { text?: string; languageCode?: string };

export type Place = {
  id: string;
  displayName?: LocalizedText;
  primaryTypeDisplayName?: LocalizedText;
  formattedAddress?: string;
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  googleMapsUri?: string;
};

export type Review = {
  rating?: number;
  text?: LocalizedText;
  originalText?: LocalizedText;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

export type PlaceDetails = Place & {
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  editorialSummary?: LocalizedText;
  reviews?: Review[];
};

export class PlacesError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type GoogleError = { error?: { message?: string; status?: string; details?: { reason?: string }[] } };

// Google's reason for refusing a request, in words that say what to fix. Most of these are setup
// problems with the API key in Google Cloud, so the fix is named alongside Google's own message.
export function explain(status: number, body: string) {
  let error: GoogleError["error"];
  try {
    error = (JSON.parse(body) as GoogleError).error;
  } catch {
    error = undefined;
  }
  const reason = error?.details?.find((d) => d.reason)?.reason ?? error?.status ?? "";
  const message = (error?.message ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  const hint: Record<string, string> = {
    SERVICE_DISABLED: "Places API (New) isn't enabled for this Google Cloud project.",
    API_KEY_SERVICE_BLOCKED: "The Google API key isn't allowed to use Places API (New). Add it under the key's API restrictions.",
    API_KEY_HTTP_REFERRER_BLOCKED: "The Google API key is limited to websites. Set its application restriction to None.",
    API_KEY_IP_ADDRESS_BLOCKED: "The Google API key is limited to certain IP addresses. Set its application restriction to None.",
    API_KEY_INVALID: "Google says the API key isn't valid. Check the GOOGLE_PLACES_API_KEY secret for typos or spaces.",
    BILLING_DISABLED: "Billing isn't enabled on the Google Cloud project. Link a billing account.",
    RATE_LIMIT_EXCEEDED: "Google is busy right now. Try again in a minute.",
    RESOURCE_EXHAUSTED: "The daily Google Places quota has run out. Try again tomorrow or raise the quota.",
  };
  if (hint[reason]) return hint[reason];
  if (status === 429) return "Google is busy right now. Try again in a minute.";
  return message ? `Google refused the search: ${message}` : `Couldn't reach Google (error ${status}). Try again.`;
}

function key(env: CloudflareEnv) {
  if (!env.GOOGLE_PLACES_API_KEY) throw new PlacesError("Lead Finder isn't set up yet.", 503);
  return env.GOOGLE_PLACES_API_KEY;
}

async function call<T>(env: CloudflareEnv, path: string, mask: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-goog-api-key": key(env), "x-goog-fieldmask": mask },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Places request failed", res.status, path, text);
    throw new PlacesError(explain(res.status, text), res.status === 404 ? 404 : 502);
  }
  return (await res.json()) as T;
}

// Every place for a query, across all pages, without duplicates.
export async function searchPlaces(env: CloudflareEnv, query: string, country: Country) {
  const seen = new Map<string, Place>();
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = { textQuery: query, regionCode: country, languageCode: "en", pageSize: 20, pageToken };
    const res = await call<{ places?: Place[]; nextPageToken?: string }>(env, "/places:searchText", SEARCH_MASK, {
      method: "POST",
      body: JSON.stringify(body),
    });
    for (const place of res.places ?? []) if (!seen.has(place.id)) seen.set(place.id, place);
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }
  return [...seen.values()];
}

export function getPlaceDetails(env: CloudflareEnv, placeId: string) {
  if (!/^[\w-]{10,300}$/.test(placeId)) throw new PlacesError("That business couldn't be found.", 404);
  return call<PlaceDetails>(env, `/places/${placeId}?languageCode=en`, DETAILS_MASK);
}

export function countryOf(place: Place) {
  return place.addressComponents?.find((c) => c.types?.includes("country"))?.shortText ?? null;
}
