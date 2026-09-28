// Search-facing facts about Octacore itself: the canonical origin and the structured data that tells
// Google "Octacore" is this company. Marketing pages, the sitemap and robots.txt all read from here.
import { PLANS } from "@/lib/billing/plans";
import { SUPPORT_EMAIL } from "@/lib/support";

export const SITE_URL = "https://octacore.app";
export const SITE_NAME = "Octacore";
export const SITE_DESCRIPTION =
  "Octacore is the AI website builder for selling websites. Describe a site, host it instantly, and sell it to local businesses — all in one place.";

// Octacore's official profiles (X, LinkedIn, GitHub, YouTube, Product Hunt…). Each one listed here
// becomes a `sameAs` link, which is how Google ties the brand name to this site.
export const SOCIAL_PROFILES: string[] = [];

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/logo.png"),
  email: SUPPORT_EMAIL,
  description: SITE_DESCRIPTION,
  ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
};

// Organization + WebSite + SoftwareApplication for the home page.
export const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    ORGANIZATION,
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: Math.min(...PLANS.map((p) => p.price)),
        highPrice: Math.max(...PLANS.map((p) => p.price)),
        offerCount: PLANS.length,
      },
    },
  ],
};

// Breadcrumbs for a page below the home page: [["Guides", "/guides"], ["This guide", "/guides/x"]].
export function breadcrumbs(trail: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Octacore", "/"] as const, ...trail].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

// Serialises structured data for a <script type="application/ld+json">, escaping `<` so no string
// in it can close the tag.
export const ldJson = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
