import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, MarketingPage, MoreLink, PageHero, PointGrid, Section, TemplateGrid, display } from "@/components/marketing/page";
import { TEMPLATES, getTemplate, type Template } from "@/components/templates";
import { TEMPLATE_COPY } from "@/components/templates/copy";
import { INDUSTRIES, getIndustry, industryTitle, type Industry } from "@/components/templates/industries";
import { templateFontVariables } from "@/lib/template-fonts";
import { breadcrumbs } from "@/lib/seo";

// One segment serves two kinds of page: a template's live preview (/templates/nonnas-table) and an
// industry landing page (/templates/restaurants). The slugs never overlap.
export function generateStaticParams() {
  return [...TEMPLATES, ...INDUSTRIES].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (industry) {
    return { title: industryTitle(industry), description: industry.description, alternates: { canonical: `/templates/${slug}` } };
  }
  const t = getTemplate(slug);
  if (!t) return { title: "Template" };
  return {
    title: `${t.name} — ${t.blurb} website template`,
    description: TEMPLATE_COPY[slug]?.description,
    alternates: { canonical: `/templates/${slug}` },
  };
}

export default async function Page({ params }: PageProps<"/templates/[slug]">) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (industry) return <IndustryPage industry={industry} />;
  const template = getTemplate(slug);
  if (!template) notFound();
  return <TemplatePage template={template} />;
}

function TemplatePage({ template }: { template: Template }) {
  const { Component } = template;
  const copy = TEMPLATE_COPY[template.slug];
  const industry = copy && getIndustry(copy.industry);
  return (
    <div data-theme="light" className={templateFontVariables}>
      <JsonLd
        data={breadcrumbs([
          ["Templates", "/templates"],
          ...(industry ? [[industry.name, `/templates/${industry.slug}`] as [string, string]] : []),
          [template.name, `/templates/${template.slug}`],
        ])}
      />
      <div className="material sticky top-0 z-50 flex h-12 items-center justify-between border-b border-hairline px-4 text-[13px]">
        <Link href="/templates" className="flex items-center gap-2 text-fg-2 hover:text-fg">
          <ArrowLeft size={14} /> <OctacoreMark size={18} /> Templates
        </Link>
        <span className="hidden font-medium sm:block">
          {template.name} <span className="text-fg-3">· {template.blurb}</span>
        </span>
        <Link
          href={`/start?template=${template.slug}`}
          className="rounded-full bg-octa-600 px-4 py-1.5 font-medium text-white hover:bg-octa-500"
        >
          Use this template
        </Link>
      </div>
      <Component />
      {copy && (
        <section className="bg-canvas px-4 py-20 text-fg sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="text-[15px] text-fg-2">Octacore template</p>
              <h2 className={`${display} mt-3 text-[40px] leading-[1] tracking-[-0.04em] text-balance sm:text-[56px]`}>
                {template.blurb} website template: {template.name}
              </h2>
            </div>
            <div className="text-[17px] leading-[1.6] text-fg-2">
              {copy.about.map((p) => (
                <p key={p.slice(0, 24)} className="mt-4 first:mt-0">
                  {p}
                </p>
              ))}
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href={`/start?template=${template.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-fg px-6 text-[16px] font-medium text-canvas transition-colors hover:bg-octa-700 hover:text-white"
                >
                  Use this template
                </Link>
                {industry && <MoreLink href={`/templates/${industry.slug}`}>More {industryTitle(industry).toLowerCase()}</MoreLink>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function IndustryPage({ industry }: { industry: Industry }) {
  const templates = industry.templates.map(getTemplate).filter((t): t is Template => !!t);
  const title = industryTitle(industry);
  return (
    <MarketingPage>
      <JsonLd
        data={breadcrumbs([
          ["Templates", "/templates"],
          [industry.name, `/templates/${industry.slug}`],
        ])}
      />
      <PageHero
        eyebrow={
          <Link href="/templates" className="hover:text-fg">
            Templates › {industry.name}
          </Link>
        }
        title={title}
        intro={industry.intro}
        cta={{ href: `/start?template=${templates[0].slug}`, label: "Use a template" }}
      >
        <div className="mt-14">
          <TemplateGrid templates={templates} />
        </div>
      </PageHero>

      <Section title={`What a great ${industry.noun} website needs.`} tone="white">
        <PointGrid points={industry.needs} />
      </Section>

      <Section title={`Selling websites to ${industry.name.toLowerCase()}.`} tone="stone">
        <p className="max-w-[680px] text-[17px] leading-[1.6] text-fg-2">{industry.selling}</p>
        <div className="mt-8 flex flex-col items-start gap-3">
          <MoreLink href="/agents">How Octa Agents find clients</MoreLink>
          <MoreLink href="/guides/how-to-sell-websites-to-local-businesses">How to sell websites to local businesses</MoreLink>
        </div>
      </Section>

      <Section title="More industries." tone="white">
        <ul className="flex flex-wrap gap-2">
          {INDUSTRIES.filter((i) => i.slug !== industry.slug).map((i) => (
            <li key={i.slug}>
              <Link href={`/templates/${i.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-canvas-2 px-5 text-[15px] hover:bg-octa-600 hover:text-white">
                {industryTitle(i)}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title={`Build a ${industry.noun} website in minutes.`} body="Start from a template or describe the business — Octacore does the rest." />
    </MarketingPage>
  );
}
