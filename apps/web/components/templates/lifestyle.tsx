import { Photo } from "./photo";
import type { TemplateProps } from "./types";

/* ——— Atelier Noir · Hair salon ——— */
export function Atelier({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#0F0E0D] font-[family-name:var(--font-cormorant)] text-[#EFE6DA]">
      <nav className="flex items-center justify-between px-6 py-6 font-[family-name:var(--font-manrope)] text-xs tracking-[0.25em] uppercase @3xl:px-14">
        <span className="font-[family-name:var(--font-cormorant)] text-2xl tracking-[0.35em]">ATELIER NOIR</span>
        <div className="hidden gap-10 @3xl:flex">
          <span>Services</span>
          <span>Artists</span>
          <span>Gallery</span>
        </div>
        <span className="border border-[#EFE6DA]/40 px-5 py-3">Book</span>
      </nav>
      <header className="grid gap-6 px-6 pt-6 @3xl:grid-cols-[1fr_1.1fr_0.7fr] @3xl:items-end @3xl:px-14">
        <div className="pb-4">
          <h1 className="text-[64px] leading-[0.9] font-medium @3xl:text-[112px]">
            Hair,
            <br />
            <em className="text-[#C9A27A]">as art.</em>
          </h1>
          <p className="mt-6 max-w-xs font-[family-name:var(--font-manrope)] text-sm leading-relaxed text-[#EFE6DA]/65">
            Precision cutting, lived-in colour and bridal artistry in the heart of the West Loop.
          </p>
        </div>
        <Photo id="photo-1502823403499-6ccfcf4fb453" alt="Editorial hair portrait" w={520} priority className="aspect-[3/4]" />
        <div className="hidden flex-col gap-6 @3xl:flex">
          <Photo id="photo-1600948836101-f9ffda59d250" alt="Salon interior" w={300} className="aspect-[3/4]" />
          <p className="font-[family-name:var(--font-manrope)] text-xs tracking-[0.2em] uppercase">
            Tue — Sat · 10am to 8pm
          </p>
        </div>
      </header>
      <section className="mt-16 grid border-t border-[#EFE6DA]/15 font-[family-name:var(--font-manrope)] @3xl:grid-cols-3">
        {[
          ["Signature cut", "from $95"],
          ["Balayage", "from $260"],
          ["Bridal", "by consultation"],
        ].map(([s, p]) => (
          <div key={s} className="flex items-baseline justify-between border-b border-[#EFE6DA]/15 px-6 py-8 @3xl:border-r @3xl:px-14">
            <span className="font-[family-name:var(--font-cormorant)] text-3xl">{s}</span>
            <span className="text-sm text-[#C9A27A]">{p}</span>
          </div>
        ))}
      </section>
      {!preview && (
        <section className="grid gap-4 px-6 py-20 @3xl:grid-cols-2 @3xl:px-14">
          <Photo id="photo-1695527081848-1e46c06e6458" alt="Stylist at work" w={620} className="aspect-[4/3]" />
          <div className="flex flex-col justify-center gap-6 p-6">
            <p className="text-5xl leading-tight italic">“The only salon I&apos;ve trusted with my hair for a decade.”</p>
            <p className="font-[family-name:var(--font-manrope)] text-xs tracking-[0.2em] uppercase">— Vogue Chicago</p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ——— Ironside · Strength gym ——— */
export function Ironside({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#0A0A0A] font-[family-name:var(--font-manrope)] text-white">
      <nav className="flex items-center justify-between px-6 py-5 @3xl:px-14">
        <span className="font-[family-name:var(--font-anton)] text-3xl tracking-wide">IRONSIDE</span>
        <div className="hidden gap-8 text-sm font-semibold text-white/70 uppercase @3xl:flex">
          <span>Classes</span>
          <span>Coaches</span>
          <span>Pricing</span>
          <span>Timetable</span>
        </div>
        <span className="bg-[#D4FF3A] px-5 py-3 text-sm font-extrabold text-black uppercase">Free week</span>
      </nav>
      <header className="relative">
        <Photo id="photo-1517836357463-d25dfeac3438" alt="Athlete lifting a barbell" w={1280} priority className="aspect-[4/5] @3xl:aspect-[16/7]" />
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black via-black/30 to-transparent px-6 pb-10 @3xl:px-14">
          <h1 className="font-[family-name:var(--font-anton)] text-[72px] leading-[0.88] uppercase @3xl:text-[168px]">
            Stronger <span className="text-[#D4FF3A]">every</span> week.
          </h1>
          <p className="mt-4 max-w-md text-white/75">
            Coached strength &amp; conditioning in Denver. Small groups, real programming, zero ego.
          </p>
        </div>
      </header>
      <section className="grid grid-cols-2 border-y border-white/10 @3xl:grid-cols-4">
        {[
          ["12", "coaches"],
          ["60+", "classes a week"],
          ["6am", "first session"],
          ["4.9★", "on Google"],
        ].map(([n, l]) => (
          <div key={l} className="border-r border-white/10 px-6 py-8 @3xl:px-14">
            <p className="font-[family-name:var(--font-anton)] text-5xl">{n}</p>
            <p className="mt-1 text-sm text-white/60 uppercase">{l}</p>
          </div>
        ))}
      </section>
      {!preview && (
        <section className="grid gap-4 px-6 py-20 @3xl:grid-cols-3 @3xl:px-14">
          {[
            ["photo-1541534741688-6078c6bfb5c5", "Barbell club"],
            ["photo-1556817411-31ae72fa3ea0", "Powerlifting"],
            ["photo-1517838277536-f5f99be501cd", "Strength 101"],
          ].map(([id, t]) => (
            <figure key={t} className="relative">
              <Photo id={id} alt={t} w={400} className="aspect-[3/4]" />
              <figcaption className="absolute bottom-4 left-4 font-[family-name:var(--font-anton)] text-3xl uppercase">
                {t}
              </figcaption>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}
