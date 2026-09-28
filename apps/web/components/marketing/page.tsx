import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { TEMPLATES, type Template } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { templateFontVariables } from "@/lib/template-fonts";
import { Nav } from "./nav";
import { Footer } from "./sections";

// Building blocks for the marketing pages beyond the landing page (features, pricing, agents,
// templates, guides): the same nav, footer, type and colour, as server-rendered HTML.

export const display = "font-[family-name:var(--font-display)] font-semibold";

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className={`${templateFontVariables} bg-canvas text-fg`}>
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  cta = { href: "/start", label: "Start building" },
  children,
}: {
  eyebrow: ReactNode;
  title: string;
  intro: ReactNode;
  cta?: { href: string; label: string } | null;
  children?: ReactNode;
}) {
  return (
    <section className="dots px-4 pt-16 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-[15px] text-fg-2">{eyebrow}</p>
        <h1 className={`${display} mt-4 max-w-[980px] text-[44px] leading-[1] tracking-[-0.045em] text-balance sm:text-[80px]`}>{title}</h1>
        <div className="mt-6 max-w-[640px] text-[17px] leading-[1.5] sm:text-[19px]">{intro}</div>
        {cta && (
          <PrimaryLink href={cta.href} className="mt-9">
            {cta.label}
          </PrimaryLink>
        )}
        {children}
      </div>
    </section>
  );
}

export function PrimaryLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-6 text-[16px] font-medium text-canvas transition-colors hover:bg-octa-700 hover:text-white ${className}`}
    >
      {children} <ArrowRight size={16} />
    </Link>
  );
}

// Tertiary "Learn more ›" style link.
export function MoreLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-1 text-[16px] font-medium text-octa-700 hover:text-octa-600 ${className}`}>
      {children} <span aria-hidden>›</span>
    </Link>
  );
}

export function Section({
  id,
  title,
  intro,
  tone = "white",
  children,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  tone?: "white" | "canvas" | "stone";
  children: ReactNode;
}) {
  const bg = { white: "bg-white", canvas: "dots", stone: "bg-canvas-2" }[tone];
  return (
    <section id={id} className={`scroll-mt-16 px-4 py-20 sm:px-8 sm:py-32 ${bg}`}>
      <div className="mx-auto max-w-[1280px]">
        <h2 className={`${display} max-w-[860px] text-[36px] leading-[1.02] tracking-[-0.04em] text-balance sm:text-[56px]`}>{title}</h2>
        {intro && <div className="mt-5 max-w-[640px] text-[17px] leading-[1.5] text-fg-2">{intro}</div>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

// A grid of titled points, e.g. features or "what a restaurant site needs".
export function PointGrid({ points, columns = 3 }: { points: [title: string, body: ReactNode][]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid gap-x-10 gap-y-10 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {points.map(([title, body]) => (
        <li key={title} className="border-t border-fg pt-5">
          <h3 className={`${display} text-[22px] leading-[1.15] tracking-[-0.02em]`}>{title}</h3>
          <p className="mt-2 text-[16px] leading-[1.5] text-fg-2">{body}</p>
        </li>
      ))}
    </ul>
  );
}

// Numbered steps in a row.
export function Steps({ steps }: { steps: [title: string, body: ReactNode][] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map(([title, body], i) => (
        <li key={title} className="flex flex-col rounded-[18px] bg-elevated p-6 shadow-soft">
          <span className={`${display} text-[15px] text-octa-700 tabular-nums`}>{String(i + 1).padStart(2, "0")}</span>
          <h3 className={`${display} mt-6 text-[22px] leading-[1.15] tracking-[-0.02em]`}>{title}</h3>
          <p className="mt-2 text-[15px] leading-[1.5] text-fg-2">{body}</p>
        </li>
      ))}
    </ol>
  );
}

// Plain question-and-answer list; every answer is in the HTML, open by default.
export function QuestionList({ items }: { items: [q: string, a: ReactNode][] }) {
  return (
    <dl className="max-w-[820px] border-t border-fg">
      {items.map(([q, a]) => (
        <div key={q} className="border-b border-fg py-6">
          <dt className="text-[19px] font-medium sm:text-[20px]">{q}</dt>
          <dd className="mt-2 max-w-[680px] text-[16px] leading-[1.55] text-fg-2">{a}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TemplateGrid({ templates = TEMPLATES }: { templates?: Template[] }) {
  return (
    <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {templates.map((t) => (
        <li key={t.slug}>
          <Link href={`/templates/${t.slug}`} className="group block">
            <div className="relative bg-canvas-2 p-2 transition-colors group-hover:bg-octa-600">
              <TemplateFrame className="aspect-[4/5] bg-white">
                <t.Component />
              </TemplateFrame>
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 bg-white/90 py-3 text-[13px] font-medium opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                Preview template <ArrowUpRight size={14} />
              </span>
            </div>
            <p className="mt-3 flex items-baseline justify-between gap-3 text-[15px]">
              <span className="font-medium">{t.name}</span>
              <span className="text-fg-3">{t.blurb}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CtaBand({ title, body, href = "/start", label = "Start building" }: { title: string; body?: ReactNode; href?: string; label?: string }) {
  return (
    <section className="grain bg-octa-700 px-4 py-20 text-center text-white sm:py-28">
      <h2 className={`${display} mx-auto max-w-[900px] text-[40px] leading-[1] tracking-[-0.045em] text-balance sm:text-[72px]`}>{title}</h2>
      {body && <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.5] text-white/90">{body}</p>}
      <Link
        href={href}
        className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-[16px] font-medium text-octa-700 transition-colors hover:bg-white/90"
      >
        {label} <ArrowRight size={16} />
      </Link>
    </section>
  );
}
