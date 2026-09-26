import { Megaphone, MessagesSquare, TrendingUp } from "lucide-react";

export const metadata = { title: "Agents" };

const AGENTS = [
  { icon: Megaphone, name: "Sales agent", body: "Finds local businesses with dated websites and drafts the pitch." },
  { icon: MessagesSquare, name: "Support agent", body: "Answers visitors on the sites you ship, around the clock." },
  { icon: TrendingUp, name: "Growth agent", body: "Keeps every site’s copy, speed and search ranking sharp." },
];

export default function AgentsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:py-16">
        <span className="rounded-full bg-octa-600/10 px-3 py-1 text-[13px] font-medium text-octa-700 dark:text-octa-400">Coming soon</span>
        <h1 className="mt-5 text-balance font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          Octa Agents
        </h1>
        <p className="mt-3 max-w-[560px] text-[17px] text-fg-2">AI teammates that run the busywork of a web business, so you can focus on selling.</p>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {AGENTS.map(({ icon: Icon, name, body }) => (
            <li key={name} className="rounded-[28px] bg-elevated p-7 shadow-soft ring-1 ring-hairline">
              <span className="grid size-11 place-items-center rounded-[12px] bg-canvas-2 text-fg">
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <p className="mt-6 text-[21px] font-semibold tracking-[-0.02em]">{name}</p>
              <p className="mt-2 text-[15px] leading-[1.47] text-fg-2">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
