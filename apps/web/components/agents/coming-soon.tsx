import { Megaphone, MessagesSquare, TrendingUp } from "lucide-react";
import { Reveal, RevealText } from "@/components/marketing/motion";

const AGENTS = [
  { icon: Megaphone, name: "Sales agent", body: "Finds local businesses with dated websites and drafts the pitch.", tone: "from-octa-500/20" },
  { icon: MessagesSquare, name: "Support agent", body: "Answers visitors on the sites you ship, around the clock.", tone: "from-sky-500/20" },
  { icon: TrendingUp, name: "Growth agent", body: "Keeps every site’s copy, speed and search ranking sharp.", tone: "from-emerald-500/20" },
];

// What everyone sees on the Agents page until Octa Agents ships.
export function AgentsComingSoon() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
        <Reveal>
          <span className="inline-flex h-7 items-center gap-2 rounded-full bg-octa-600/10 px-3 text-[13px] font-medium text-octa-700 dark:text-octa-400">
            <span className="size-1.5 animate-pulse rounded-full bg-octa-600" /> Coming soon
          </span>
        </Reveal>
        <RevealText
          as="h1"
          text="Octa Agents"
          className="mt-5 font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[64px]"
        />
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.47] text-fg-2">
            AI teammates that run the busywork of a web business, so you can focus on selling.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {AGENTS.map(({ icon: Icon, name, body, tone }, i) => (
            <li key={name}>
              <Reveal delay={0.15 + i * 0.08} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-[28px] bg-elevated p-7 shadow-soft ring-1 ring-hairline transition-all duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-float">
                  <div className={`pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br ${tone} to-transparent blur-2xl transition-transform duration-700 group-hover:scale-125`} />
                  <span className="relative grid size-12 place-items-center rounded-[14px] bg-canvas-2 text-fg ring-1 ring-hairline">
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <p className="relative mt-8 text-[21px] font-semibold tracking-[-0.02em]">{name}</p>
                  <p className="relative mt-2 text-[15px] leading-[1.47] text-fg-2">{body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
