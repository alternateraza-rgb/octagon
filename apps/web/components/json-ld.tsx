import { ldJson } from "@/lib/seo";

// Structured data for search engines (schema.org JSON-LD).
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />;
}
