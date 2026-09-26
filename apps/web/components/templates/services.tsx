import { Photo } from "./photo";
import type { TemplateProps } from "./types";

/* ——— Kestrel & Co. · Law firm ——— */
export function Kestrel({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#F3F0E8] font-[family-name:var(--font-manrope)] text-[#14213D]">
      <nav className="flex items-center justify-between border-b border-[#14213D]/15 px-6 py-5 @3xl:px-14">
        <span className="font-[family-name:var(--font-instrument)] text-3xl">Kestrel &amp; Co.</span>
        <div className="hidden gap-8 text-sm @3xl:flex">
          <span>Practice areas</span>
          <span>Attorneys</span>
          <span>Results</span>
          <span>Insights</span>
        </div>
        <span className="bg-[#14213D] px-5 py-3 text-sm text-white">Free consultation</span>
      </nav>
      <header className="grid @3xl:grid-cols-[1.2fr_1fr]">
        <div className="px-6 py-16 @3xl:px-14 @3xl:py-24">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#9C7A3C] uppercase">Business &amp; employment law</p>
          <h1 className="mt-6 font-[family-name:var(--font-instrument)] text-[60px] leading-[0.98] @3xl:text-[96px]">
            Counsel that <em>moves</em> as fast as your business.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#14213D]/70">
            For thirty years, founders and family businesses across Chicago have trusted Kestrel &amp; Co. with the
            decisions that matter most.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-[#14213D]/15 pt-6">
            {[
              ["$480M", "recovered"],
              ["1,200+", "clients"],
              ["30 yrs", "in practice"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-[family-name:var(--font-instrument)] text-4xl">{n}</p>
                <p className="text-xs text-[#14213D]/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <Photo id="photo-1573496359142-b8d87734a5a2" alt="Managing partner portrait" w={560} priority className="min-h-[420px]" />
      </header>
      <section className="grid gap-px bg-[#14213D]/15 @3xl:grid-cols-4">
        {["Corporate & M&A", "Employment", "Commercial disputes", "Estate planning"].map((a, i) => (
          <div key={a} className="bg-[#F3F0E8] px-6 py-10 @3xl:px-10">
            <p className="text-xs text-[#9C7A3C]">0{i + 1}</p>
            <p className="mt-6 font-[family-name:var(--font-instrument)] text-3xl">{a}</p>
          </div>
        ))}
      </section>
      {!preview && (
        <section className="bg-[#14213D] px-6 py-24 text-white @3xl:px-14">
          <p className="max-w-4xl font-[family-name:var(--font-instrument)] text-4xl leading-tight @3xl:text-6xl">
            “They didn&apos;t just win the case — they understood what our company needed on the other side of it.”
          </p>
          <p className="mt-8 text-sm text-white/60">Dana Whitfield, CEO · Lakeshore Logistics</p>
        </section>
      )}
    </div>
  );
}

/* ——— Harbor Dental · Dental clinic ——— */
export function Harbor({ preview }: TemplateProps) {
  return (
    <div className="@container bg-white font-[family-name:var(--font-manrope)] text-[#0E2A3F]">
      <nav className="flex items-center justify-between px-6 py-5 @3xl:px-14">
        <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-full bg-[#2F7FB8] text-sm text-white">H</span>
          Harbor Dental
        </span>
        <div className="hidden gap-8 text-sm text-[#0E2A3F]/70 @3xl:flex">
          <span>Treatments</span>
          <span>Our team</span>
          <span>New patients</span>
          <span>Insurance</span>
        </div>
        <span className="rounded-full bg-[#2F7FB8] px-5 py-2.5 text-sm font-bold text-white">Book online</span>
      </nav>
      <header className="mx-4 grid overflow-hidden rounded-[36px] bg-[#E6F1F9] @3xl:mx-8 @3xl:grid-cols-2">
        <div className="px-8 py-14 @3xl:px-14 @3xl:py-20">
          <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#2F7FB8]">
            ★ 4.9 · 1,300 Google reviews
          </span>
          <h1 className="mt-6 text-[52px] leading-[1.02] font-extrabold tracking-[-0.04em] @3xl:text-[76px]">
            Dentistry you&apos;ll actually look forward to.
          </h1>
          <p className="mt-5 max-w-md text-lg text-[#0E2A3F]/70">
            Gentle care, evening appointments and transparent pricing — right on the San Diego waterfront.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-full bg-[#0E2A3F] px-6 py-3.5 text-white">Book your first visit — $99</span>
            <span className="rounded-full bg-white px-6 py-3.5">Call (619) 555-0110</span>
          </div>
        </div>
        <Photo id="photo-1629909613654-28e377c37b09" alt="Bright modern dental suite" w={640} priority className="min-h-[380px]" />
      </header>
      <section className="grid grid-cols-2 gap-4 px-6 py-14 @3xl:grid-cols-4 @3xl:px-14">
        {["Cleanings & exams", "Invisalign", "Whitening", "Implants"].map((t) => (
          <div key={t} className="rounded-3xl border border-[#0E2A3F]/10 p-6">
            <p className="text-lg font-bold">{t}</p>
            <p className="mt-8 text-sm text-[#2F7FB8]">Learn more →</p>
          </div>
        ))}
      </section>
      {!preview && (
        <section className="grid items-center gap-10 px-6 pb-24 @3xl:grid-cols-2 @3xl:px-14">
          <Photo id="photo-1598256989800-fe5f95da9787" alt="Treatment room" w={620} className="aspect-[4/3] rounded-[28px]" />
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">No surprises. Ever.</h2>
            <p className="mt-4 text-lg text-[#0E2A3F]/70">
              You&apos;ll see your treatment plan and exact cost before we start. We work with every major insurer and
              offer 0% financing.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ——— Forma Studio · Architecture ——— */
export function Forma({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#EDEDEA] font-[family-name:var(--font-manrope)] text-[#111]">
      <nav className="flex items-center justify-between px-6 py-6 text-sm @3xl:px-14">
        <span className="font-extrabold tracking-[0.3em]">FORMA</span>
        <div className="hidden gap-10 @3xl:flex">
          <span>Projects</span>
          <span>Studio</span>
          <span>Journal</span>
        </div>
        <span className="underline underline-offset-4">Start a project</span>
      </nav>
      <header className="px-6 @3xl:px-14">
        <h1 className="max-w-5xl text-[52px] leading-[0.95] font-light tracking-[-0.05em] @3xl:text-[120px]">
          Quiet houses for loud lives.
        </h1>
        <div className="mt-10 grid gap-4 @3xl:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6">
            <p className="max-w-xs text-sm leading-relaxed text-[#111]/65">
              Forma is a residential architecture studio in Austin, designing light-filled homes that sit lightly on
              the land.
            </p>
            <Photo id="photo-1724582586529-62622e50c0b3" alt="Minimal living room" w={380} className="aspect-[4/5]" />
          </div>
          <Photo id="photo-1613490493576-7fde63acd811" alt="Modern concrete house" w={800} priority className="aspect-[4/3] @3xl:aspect-auto" />
        </div>
      </header>
      {!preview && (
        <section className="grid gap-10 px-6 py-24 @3xl:grid-cols-2 @3xl:px-14">
          <Photo id="photo-1748063578185-3d68121b11ff" alt="House exterior at dusk" w={620} className="aspect-[4/3]" />
          <div className="flex flex-col justify-end">
            <p className="text-xs tracking-[0.3em] text-[#111]/50">SELECTED WORK · 2025</p>
            <p className="mt-3 text-5xl font-light tracking-tight">Pedernales House</p>
            <p className="mt-4 max-w-md text-[#111]/65">A 3,200 sq ft family home cantilevered over the Texas Hill Country.</p>
          </div>
        </section>
      )}
      <div className="h-14" />
    </div>
  );
}
