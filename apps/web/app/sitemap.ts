import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/components/templates";
import { INDUSTRIES } from "@/components/templates/industries";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

// Every public marketing page. Customer sites live on their own subdomains and domains, not here.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, lastModified?: string) => ({
    url: absoluteUrl(path),
    priority,
    ...(lastModified ? { lastModified } : {}),
  });
  return [
    page("/", 1),
    page("/features", 0.9),
    page("/pricing", 0.9),
    page("/templates", 0.9),
    page("/agents", 0.8),
    page("/guides", 0.7),
    page("/about", 0.6),
    ...INDUSTRIES.map((i) => page(`/templates/${i.slug}`, 0.7)),
    ...TEMPLATES.map((t) => page(`/templates/${t.slug}`, 0.6)),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.6, g.published)),
    page("/privacy", 0.2),
    page("/refunds", 0.2),
    page("/terms", 0.2),
  ];
}
