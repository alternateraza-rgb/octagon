// Google Places API (New): where Lead Finder gets its businesses. Two calls:
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
    console.error("Places request failed", res.status, path, await res.text().catch(() => ""));
    throw new PlacesError(
      res.status === 429 ? "Google is busy right now. Try again in a minute." : "Couldn't reach Google. Try again.",
      res.status === 404 ? 404 : 502,
    );
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
