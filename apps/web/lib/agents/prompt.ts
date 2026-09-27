// The builder prompt for a lead: the business's real details from Google, written the way a user
// would describe the site, since it shows as the first message in the builder.
import type { PlaceDetails } from "./places";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function leadPrompt(details: PlaceDetails, fallback: { name: string; category: string | null }) {
  const name = details.displayName?.text?.trim() || fallback.name;
  const category = details.primaryTypeDisplayName?.text?.trim() || fallback.category;
  const city = details.addressComponents?.find((c) => c.types?.includes("locality"))?.longText;
  const region = details.addressComponents?.find((c) => c.types?.includes("administrative_area_level_1"))?.shortText;
  const place = [city, region].filter(Boolean).join(", ");

  const lines = [
    `A website for ${name}${category ? `, a ${category.toLowerCase()}` : ""}${place ? ` in ${place}` : ""}.`,
    details.editorialSummary?.text ? `About them: ${details.editorialSummary.text}` : "",
    details.nationalPhoneNumber ? `Phone: ${details.nationalPhoneNumber}` : "",
    details.formattedAddress ? `Address: ${details.formattedAddress}` : "",
    details.rating && details.userRatingCount
      ? `Rated ${details.rating.toFixed(1)} stars from ${details.userRatingCount} Google reviews.`
      : "",
  ];

  // What customers praise, so the copy leans on the business's real strengths. The reviews
  // themselves are added verbatim by lib/agents/inject.ts, not written by the model.
  const praise = (details.reviews ?? [])
    .filter((r) => (r.rating ?? 0) >= 4)
    .map((r) => r.text?.text?.replace(/\s+/g, " ").trim())
    .filter((t): t is string => !!t)
    .slice(0, 3)
    .map((t) => `- "${clip(t, 220)}"`);
  if (praise.length) lines.push(`What customers say (for tone and strengths only):\n${praise.join("\n")}`);

  lines.push("Make it feel local and trustworthy, with a clear call to action to phone or visit.");
  return lines.filter(Boolean).join("\n");
}
