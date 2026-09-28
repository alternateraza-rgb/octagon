import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "./nav";
import { SUPPORT_EMAIL } from "@/lib/support";
import { Footer } from "./sections";

export function SupportLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-octa-700 underline decoration-octa-700/30 underline-offset-2 hover:decoration-octa-700">
      {SUPPORT_EMAIL}
    </a>
  );
}

// A link to another legal page, styled like SupportLink.
export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-octa-700 underline decoration-octa-700/30 underline-offset-2 hover:decoration-octa-700">
      {children}
    </Link>
  );
}

// Shared shell for the legal pages: the marketing nav and footer around a single readable column,
// with an optional contents list linking to each section's anchor.
export function LegalPage({
  title,
  updated,
  intro,
  contents,
  children,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  contents?: [id: string, title: string][];
  children: ReactNode;
}) {
  return (
    <div data-theme="light" className="bg-canvas text-fg">
      <Nav />
      <main className="px-4 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-36">
        <article className="mx-auto max-w-[680px]">
          <p className="text-[14px] text-fg-3">Last updated {updated}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[44px] leading-[1] font-semibold tracking-[-0.04em] text-balance sm:text-[64px]">
            {title}
          </h1>
          <div className="mt-8 text-[19px] leading-[1.5] text-fg [&_p+p]:mt-4">{intro}</div>
          {contents && (
            <nav aria-label="Contents" className="mt-10 rounded-[18px] bg-canvas-2 p-6">
              <p className="text-[13px] font-medium tracking-[0.04em] text-fg-3 uppercase">Contents</p>
              <ol className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
                {contents.map(([id, label], i) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-fg-2 hover:text-fg">
                      <span className="mr-2 text-fg-3 tabular-nums">{i + 1}.</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="mt-4 text-[17px] leading-[1.6] text-fg-2 [&_li]:mt-2 [&_p]:mt-4 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24 border-t border-hairline pt-10">
      <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
      {children}
    </section>
  );
}
