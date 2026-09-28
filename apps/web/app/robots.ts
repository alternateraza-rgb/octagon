import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Private areas stay out of the crawl. /s/<slug> is left crawlable on purpose: those responses carry
// `x-robots-tag: noindex`, which Google can only see if it's allowed to fetch them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/owner", "/api/", "/preview/", "/buy/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
