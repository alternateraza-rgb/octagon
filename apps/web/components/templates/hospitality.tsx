import { Photo } from "./photo";
import type { TemplateProps } from "./types";

/* ——— Nonna's Table · Italian restaurant ——— */
export function Nonna({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#FBF6EE] font-[family-name:var(--font-fraunces)] text-[#2A1A10]">
      <nav className="flex items-center justify-between px-6 py-5 @3xl:px-14">
        <span className="text-2xl italic">Nonna&apos;s Table</span>
        <div className="hidden gap-9 text-[15px] @3xl:flex">
          <span>Menu</span>
          <span>Our story</span>
          <span>Private dining</span>
          <span>Visit</span>
        </div>
        <span className="rounded-full bg-[#2A1A10] px-5 py-2.5 text-sm text-[#FBF6EE]">Reserve</span>
      </nav>
      <header className="grid gap-8 px-6 pb-16 pt-6 @3xl:grid-cols-[1.05fr_1fr] @3xl:items-end @3xl:px-14">
        <div>
          <p className="text-xs tracking-[0.3em] text-[#A0431B] uppercase">Est. 1962 · Carroll Gardens, Brooklyn</p>
          <h1 className="mt-5 text-[56px] leading-[0.95] tracking-[-0.03em] @3xl:text-[104px]">
            Sunday dinner, <em className="text-[#A0431B]">every</em> night.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#6B5646]">
            Hand-rolled pasta, wood-fired bread and recipes three generations deep. Pull up a chair — there&apos;s always
            room at our table.
          </p>
          <div className="mt-8 flex gap-3 font-sans text-sm">
            <span className="rounded-full bg-[#A0431B] px-6 py-3 text-white">Book a table</span>
            <span className="rounded-full border border-[#2A1A10]/25 px-6 py-3">View the menu</span>
          </div>
        </div>
        <Photo id="photo-1517248135467-4c7edcad34c4" alt="Warm restaurant dining room" w={620} priority className="aspect-[4/5] rounded-t-full" />
      </header>
      <section className="grid gap-4 px-6 pb-20 @3xl:grid-cols-3 @3xl:px-14">
        {[
          ["photo-1473093226795-af9932fe5856", "Tagliatelle al ragù", "$24"],
          ["photo-1447279506476-3faec8071eee", "Made by hand, daily", "Since 1962"],
          ["photo-1611270629569-8b357cb88da9", "Cacio e pepe", "$21"],
        ].map(([id, t, p]) => (
          <figure key={t}>
            <Photo id={id} alt={t} w={400} className="aspect-square rounded-2xl" />
            <figcaption className="mt-3 flex justify-between text-lg">
              <span>{t}</span>
              <span className="text-[#A0431B]">{p}</span>
            </figcaption>
          </figure>
        ))}
      </section>
      {!preview && (
        <>
          <section className="bg-[#2A1A10] px-6 py-24 text-center text-[#FBF6EE] @3xl:px-14">
            <p className="mx-auto max-w-3xl text-3xl leading-snug italic @3xl:text-5xl">
              “The closest thing to eating in my grandmother&apos;s kitchen in Bologna.”
            </p>
            <p className="mt-6 font-sans text-sm tracking-widest text-[#FBF6EE]/60 uppercase">The New York Table</p>
          </section>
          <footer className="grid gap-8 px-6 py-16 font-sans text-sm @3xl:grid-cols-3 @3xl:px-14">
            <div>
              <p className="font-[family-name:var(--font-fraunces)] text-2xl italic">Nonna&apos;s Table</p>
              <p className="mt-2 text-[#6B5646]">412 Court Street, Brooklyn NY</p>
            </div>
            <div className="text-[#6B5646]">
              <p className="text-[#2A1A10]">Hours</p>
              Tue–Thu 5–10pm · Fri–Sun 12–11pm
            </div>
            <div className="text-[#6B5646]">
              <p className="text-[#2A1A10]">Reservations</p>
              (718) 555-0142 · hello@nonnastable.com
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

/* ——— Common Grounds · Coffee house ——— */
export function CommonGrounds({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#1F2A1F] font-[family-name:var(--font-manrope)] text-[#F1EBDD]">
      <nav className="flex items-center justify-between px-6 py-5 @3xl:px-14">
        <span className="text-lg font-extrabold tracking-tight">common grounds.</span>
        <div className="hidden gap-8 text-sm text-[#F1EBDD]/70 @3xl:flex">
          <span>Coffee</span>
          <span>Kitchen</span>
          <span>Wholesale</span>
          <span>Locations</span>
        </div>
        <span className="rounded-full bg-[#E8B04B] px-5 py-2.5 text-sm font-bold text-[#1F2A1F]">Order ahead</span>
      </nav>
      <header className="px-6 pt-10 @3xl:px-14">
        <h1 className="text-[64px] leading-[0.9] font-extrabold tracking-[-0.05em] @3xl:text-[148px]">
          Slow coffee
          <br />
          <span className="font-[family-name:var(--font-fraunces)] font-normal text-[#E8B04B] italic">for fast mornings.</span>
        </h1>
        <div className="mt-10 grid gap-4 @3xl:grid-cols-[2fr_1fr]">
          <Photo id="photo-1600093463592-8e36ae95ef56" alt="Rustic café interior" w={820} priority className="aspect-[16/9] rounded-3xl" />
          <div className="flex flex-col gap-4">
            <Photo id="photo-1593443320739-77f74939d0da" alt="Latte on a wooden table" w={400} className="aspect-[4/3] rounded-3xl" />
            <div className="flex flex-1 flex-col justify-between rounded-3xl bg-[#E8B04B] p-6 text-[#1F2A1F]">
              <p className="text-sm font-bold uppercase tracking-widest">This week</p>
              <p className="text-2xl font-extrabold leading-tight">Ethiopia Guji — notes of peach, jasmine &amp; honey.</p>
            </div>
          </div>
        </div>
      </header>
      {!preview && (
        <section className="grid gap-10 px-6 py-24 @3xl:grid-cols-3 @3xl:px-14">
          {[
            ["Roasted in-house", "Small batches every Tuesday, never more than a week off roast."],
            ["Kitchen till 3pm", "Sourdough, seasonal plates and the best breakfast sandwich in town."],
            ["Three locations", "Eastside, Market Hall and our new roastery café on 5th."],
          ].map(([t, b]) => (
            <div key={t} className="border-t border-[#F1EBDD]/20 pt-6">
              <p className="text-xl font-bold">{t}</p>
              <p className="mt-2 text-[#F1EBDD]/65">{b}</p>
            </div>
          ))}
        </section>
      )}
      <div className="h-16" />
    </div>
  );
}

/* ——— Bloom & Branch · Florist ——— */
export function Bloom({ preview }: TemplateProps) {
  return (
    <div className="@container bg-[#F7EDEA] font-[family-name:var(--font-cormorant)] text-[#3B2230]">
      <nav className="grid grid-cols-3 items-center px-6 py-6 font-[family-name:var(--font-manrope)] text-xs tracking-[0.2em] uppercase @3xl:px-14">
        <span className="hidden @3xl:block">Shop · Weddings · Studio</span>
        <span className="col-span-2 text-left font-[family-name:var(--font-cormorant)] text-3xl tracking-normal normal-case italic @3xl:col-span-1 @3xl:text-center">
          Bloom &amp; Branch
        </span>
        <span className="text-right">Cart (0)</span>
      </nav>
      <header className="relative mx-6 overflow-hidden rounded-[32px] @3xl:mx-14">
        <Photo id="photo-1457089328109-e5d9bd499191" alt="Flower arrangement" w={1180} priority className="aspect-[4/5] @3xl:aspect-[21/9]" />
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-linear-to-t from-[#3B2230]/60 to-transparent p-10 text-center text-white">
          <h1 className="text-[56px] leading-none font-medium italic @3xl:text-[112px]">Flowers, gathered slowly.</h1>
          <p className="mt-4 font-[family-name:var(--font-manrope)] text-sm tracking-[0.25em] uppercase">
            Same-day delivery across Portland
          </p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-5 px-6 py-16 @3xl:grid-cols-3 @3xl:px-14">
        {[
          ["photo-1523693916903-027d144a2b7d", "The Blush", "$85"],
          ["photo-1561181286-d3fee7d55364", "Peony Vase", "$120"],
          ["photo-1630638915293-4cb45bb06c8a", "Garden Posy", "$60"],
        ].map(([id, t, p], i) => (
          <figure key={t} className={i === 2 ? "hidden @3xl:block" : ""}>
            <Photo id={id} alt={t} w={380} className="aspect-[3/4] rounded-2xl" />
            <figcaption className="mt-3 flex justify-between text-2xl">
              {t}
              <span className="font-[family-name:var(--font-manrope)] text-sm">{p}</span>
            </figcaption>
          </figure>
        ))}
      </section>
      {!preview && (
        <section className="px-6 pb-24 text-center @3xl:px-14">
          <p className="mx-auto max-w-2xl text-4xl leading-tight">
            Every arrangement is designed by hand in our Alberta Street studio, using flowers grown within 100 miles.
          </p>
        </section>
      )}
    </div>
  );
}
