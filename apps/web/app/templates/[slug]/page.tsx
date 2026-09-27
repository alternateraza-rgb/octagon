import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import { TEMPLATES, getTemplate } from "@/components/templates";
import { templateFontVariables } from "@/lib/template-fonts";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">) {
  const t = getTemplate((await params).slug);
  return { title: t ? `${t.name} — ${t.blurb} template` : "Template" };
}

export default async function TemplatePage({ params }: PageProps<"/templates/[slug]">) {
  const template = getTemplate((await params).slug);
  if (!template) notFound();
  const { Component } = template;
  return (
    <div data-theme="light" className={templateFontVariables}>
      <div className="material sticky top-0 z-50 flex h-12 items-center justify-between border-b border-hairline px-4 text-[13px]">
        <Link href="/#templates" className="flex items-center gap-2 text-fg-2 hover:text-fg">
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
    </div>
  );
}
