import type { ReactNode } from "react";
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

// Shared shell for the legal pages: the marketing nav and footer around a single readable column.
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div data-theme="light" className="bg-canvas text-fg">
      <Nav />
      <main className="px-4 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-36">
        <article className="mx-auto max-w-[680px]">
          <p className="text-[14px] text-fg-3">Last updated {updated}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[44px] leading-[1] font-semibold tracking-[-0.04em] text-balance sm:text-[64px]">
            {title}
          </h1>
          <div className="mt-8 text-[19px] leading-[1.5] text-fg">{intro}</div>
          <div className="mt-4 text-[17px] leading-[1.6] text-fg-2 [&_li]:mt-2 [&_p]:mt-4 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14 border-t border-hairline pt-10">
      <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
      {children}
    </section>
  );
}
