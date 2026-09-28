import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, MoreLink, display } from "@/components/marketing/page";
import { GUIDES, getGuide } from "@/lib/guides";
import { SITE_NAME, SITE_URL, absoluteUrl, breadcrumbs } from "@/lib/seo";

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return { title: "Guide" };
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    // Setting openGraph here replaces the root layout's, so the site name and share image are repeated.
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.published,
      images: "/opengraph-image.png",
    },
  };
}

const formatDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  return (
    <MarketingPage>
      <JsonLd data={breadcrumbs([["Guides", "/guides"], [guide.title, `/guides/${guide.slug}`]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          datePublished: guide.published,
          dateModified: guide.published,
          image: absoluteUrl("/opengraph-image.png"),
          mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
          author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } },
        }}
      />
      <article className="px-4 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-32">
        <div className="mx-auto max-w-[680px]">
          <p className="text-[14px] text-fg-3">
            <Link href="/guides" className="hover:text-fg">
              Guides
            </Link>{" "}
            · {formatDate(guide.published)} · {guide.readingMinutes} min read
          </p>
          <h1 className={`${display} mt-3 text-[40px] leading-[1.02] tracking-[-0.04em] text-balance sm:text-[60px]`}>{guide.title}</h1>
          <p className="mt-6 text-[19px] leading-[1.5]">{guide.description}</p>
          <div
            className={`mt-10 text-[17px] leading-[1.65] text-fg-2
              [&_a]:text-octa-700 [&_a]:underline [&_a]:decoration-octa-700/30 [&_a]:underline-offset-2 hover:[&_a]:decoration-octa-700
              [&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-octa-600 [&_blockquote]:pl-5 [&_blockquote]:text-fg
              [&_em]:text-fg-3
              [&_h2]:mt-14 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[28px] [&_h2]:leading-[1.15] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-fg
              [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6
              [&_table]:mt-6 [&_table]:w-full [&_table]:min-w-[560px] [&_table]:text-left [&_table]:text-[14px]
              [&_td]:border-b [&_td]:border-hairline [&_td]:py-3 [&_td]:pr-3 [&_td]:align-top
              [&_th]:border-b [&_th]:border-fg [&_th]:py-3 [&_th]:pr-3 [&_th]:font-medium [&_th]:text-fg`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ table: (props) => <div className="-mx-4 overflow-x-auto px-4"><table {...props} /></div> }}
            >
              {guide.body}
            </ReactMarkdown>
          </div>

          <aside className="mt-16 border-t border-hairline pt-10">
            <h2 className={`${display} text-[22px] tracking-[-0.02em]`}>More guides</h2>
            <ul className="mt-4 flex flex-col items-start gap-3">
              {others.map((g) => (
                <li key={g.slug}>
                  <MoreLink href={`/guides/${g.slug}`}>{g.title}</MoreLink>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </article>
      <CtaBand title="Build it. Ship it. Sell it." body="Describe a business and Octacore builds, hosts and helps you sell its website." />
    </MarketingPage>
  );
}
