"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Globe, Lock } from "lucide-react";
import { OctacoreLogo, OctacoreMark } from "@octacore/ui/logo";
import { TEMPLATES } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { Photo } from "@/components/templates/photo";
import { CropMarks, CutIn, Reveal, RevealText } from "./motion";
import { SUPPORT_EMAIL } from "@/lib/support";

const display = "font-[family-name:var(--font-display)] font-semibold";

function CircleArrow({ open = false, className = "" }: { open?: boolean; className?: string }) {
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-current transition-transform duration-500 ease-spring ${
        open ? "rotate-90" : "group-hover:translate-x-1"
      } ${className}`}
    >
      <ArrowRight size={16} strokeWidth={2} />
    </span>
  );
}

/* ———————————————————— The whole stack ———————————————————— */

const STACK = [
  ["Backend and storage, built in", "Every site ships with a database, file storage, forms and bookings running on Octacore — nothing to configure."],
  ["Hosting on a global edge network", "Publish in one click. Sites load fast everywhere, with SSL and automatic scaling included."],
  ["Custom domains for every client", "Connect the business's own domain in a couple of clicks, or use a free octacore.site address."],
  ["Get paid directly through Octacore", "Send a checkout link. Payment lands in your account, and the site transfers when it clears."],
  ["Hand over ownership in one click", "Buyers get an email invite to claim their site. You can stay on as a collaborator for upkeep."],
  ["Enterprise-grade security", "Isolated data per site, encrypted at rest, with daily backups and access controls."],
];

export function Stack() {
  const [open, setOpen] = useState(0);
  return (
    <section id="stack" className="dots scroll-mt-16 px-4 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
        <div>
          <RevealText
            text={"The whole business.\nNo setup slowdown."}
            className={`${display} text-[44px] leading-[1] tracking-[-0.04em] sm:text-[64px]`}
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-[380px] text-[17px] leading-[1.5]">
              Build something real, host it and get paid — without touching a server, wiring up payments or chasing a
              client for their domain password.
            </p>
          </Reveal>
          <CutIn delay={0.2} className="relative mt-12 grid max-w-[460px] grid-cols-[1fr_1.4fr]">
            <div className="grain grid aspect-square place-items-center bg-[#0f0f0f]">
              <OctacoreMark size={96} />
            </div>
            <Photo id="photo-1695527081848-1e46c06e6458" alt="Salon owner with her new website" w={280} className="h-full" />
            <CropMarks />
          </CutIn>
        </div>
        <ul className="self-end border-t border-[#0f0f0f]">
          {STACK.map(([title, body], i) => (
            <li key={title} className="border-b border-[#0f0f0f]">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className={`${display} text-[22px] tracking-[-0.02em] sm:text-[28px]`}>{title}</span>
                <CircleArrow open={open === i} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="overflow-hidden"
              >
                <p className="max-w-[520px] pb-6 text-[16px] leading-[1.5] text-fg-2">{body}</p>
              </motion.div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ———————————————————— Build / Ship / Sell ———————————————————— */

function BuildVisual() {
  const Gym = TEMPLATES[3].Component;
  return (
    <div className="flex h-full flex-col justify-end gap-2 p-5">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#0f0f0f] px-3.5 py-2 text-[13px] text-white">
        A bold site for a Denver strength gym
      </div>
      <div className="relative overflow-hidden rounded-lg ring-1 ring-black/10">
        <TemplateFrame className="h-[120px]">
          <Gym preview />
        </TemplateFrame>
      </div>
    </div>
  );
}

function ShipVisual() {
  return (
    <div className="flex h-full flex-col justify-end gap-3 p-5">
      <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-[13px] shadow-sm ring-1 ring-black/5">
        <Lock size={12} className="text-fg-3" />
        ironside.octacore.site
        <span className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[#1a7f37]">
          <span className="size-2 animate-pulse rounded-full bg-[#1a7f37]" /> Live
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-[13px] shadow-sm ring-1 ring-black/5">
        <Globe size={12} className="text-fg-3" />
        ironsidedenver.com
        <span className="ml-auto text-[12px] text-fg-3">Connected</span>
      </div>
    </div>
  );
}

function SellVisual() {
  return (
    <div className="flex h-full flex-col justify-end p-5">
      <div className="rounded-xl bg-white p-4 text-[13px] shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="font-medium">Ironside website</span>
          <span className="rounded-full bg-[#1a7f37]/10 px-2 py-0.5 text-[11px] font-medium text-[#1a7f37]">Paid</span>
        </div>
        <p className={`${display} mt-2 text-[28px] tracking-tight`}>$2,400.00</p>
        <p className="mt-1 text-fg-3">Ownership invite sent to marcus@ironside…</p>
      </div>
    </div>
  );
}

const PILLARS = [
  { title: "Build", body: "Describe the business. Octacore plans the pages, writes the copy and designs a site that looks hand-made.", cta: "Build a website", Visual: BuildVisual },
  { title: "Ship", body: "Publish in one click to a fast global network, with a free address and the client's own domain.", cta: "See hosting", Visual: ShipVisual },
  { title: "Sell", body: "Send a checkout link. When they pay, the owner is invited to claim the site — and you get paid.", cta: "How selling works", Visual: SellVisual },
];

export function Pillars() {
  return (
    <section className="dots px-4 pb-24 sm:px-8 sm:pb-36">
      <div className="mx-auto max-w-[1280px]">
        <RevealText text={"What will\nyou sell?"} className={`${display} text-[44px] leading-[1] tracking-[-0.04em] sm:text-[64px]`} />
        <Reveal delay={0.1}>
          <p className="mt-5 text-[17px]">Whatever the business, Octacore takes it from idea to invoice.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PILLARS.map(({ title, body, cta, Visual }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="group flex h-full flex-col border-b-[6px] border-octa-600 bg-[#f1efec] transition-colors hover:bg-[#ebe8e4]">
                <h3 className={`${display} px-6 pt-6 text-[32px] tracking-[-0.03em]`}>{title}</h3>
                <div className="h-[200px] transition-transform duration-700 ease-spring group-hover:-translate-y-1">
                  <Visual />
                </div>
                <p className="px-6 text-[15px] leading-[1.5]">{body}</p>
                <Link
                  href="/start"
                  className="m-6 mt-6 self-start rounded-[8px] bg-[#0f0f0f] px-4 py-2.5 text-[14px] text-white transition-colors hover:bg-octa-700"
                >
                  {cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ———————————————————— Beautiful by default ———————————————————— */

const DESIGN = [
  ["Real templates, real photography", "Start from designs made by people who build websites for a living — then make them yours."],
  ["Edit by talking", "“Make the hero warmer.” “Add a booking page.” Every change is a sentence away."],
  ["Brand controls in one place", "Set colours, fonts and logo once and the whole site updates to match."],
  ["Client-ready handoff", "Watermark-free on payment, with a simple dashboard your buyer can actually use."],
];

export function Design() {
  return (
    <section className="flex flex-col bg-[#eeeceb] lg:flex-row">
      <div className="grain flex flex-col justify-between gap-10 bg-octa-700 px-6 py-16 text-white sm:px-12 lg:w-[48%] lg:py-24">
        <RevealText
          text={"Beautiful\nby default.\nYours to sell."}
          className={`${display} text-[52px] leading-[0.95] tracking-[-0.045em] sm:text-[88px]`}
        />
        <Reveal delay={0.2}>
          <p className="max-w-[420px] text-[19px] leading-[1.45] text-white/90">
            Octacore sites look expensive before you change a thing — which is exactly what makes them easy to sell.
          </p>
        </Reveal>
      </div>
      <ul className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:py-20">
        {DESIGN.map(([t, b], i) => (
          <Reveal key={t} delay={i * 0.06}>
            <li className="group border-b border-[#0f0f0f]/80 py-7 last:border-0">
              <p className={`${display} flex items-center gap-3 text-[24px] tracking-[-0.02em] sm:text-[30px]`}>
                {t} <CircleArrow />
              </p>
              <p className="mt-2 max-w-[480px] text-[15px] leading-[1.5]">{b}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ———————————————————— Templates gallery ———————————————————— */

export function Templates() {
  return (
    <section id="templates" className="scroll-mt-16 bg-white px-4 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <RevealText text={"Start from a\nreal template."} className={`${display} text-[44px] leading-[1] tracking-[-0.04em] sm:text-[64px]`} />
          <Reveal>
            <p className="max-w-[360px] text-[17px] leading-[1.5]">
              Eight launch-ready sites for the businesses that buy websites most. Open one, describe your client, done.
            </p>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <CutIn key={t.slug} delay={(i % 4) * 0.08}>
              <Link href={`/templates/${t.slug}`} className="group block">
                <div className="relative bg-[#f1efec] p-2 transition-colors group-hover:bg-octa-600">
                  <TemplateFrame className="aspect-[4/5] bg-white">
                    <t.Component />
                  </TemplateFrame>
                  <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 bg-white/90 py-3 text-[13px] font-medium opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    Preview template <ArrowUpRight size={14} />
                  </span>
                </div>
                <p className="mt-3 flex items-baseline justify-between text-[15px]">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-fg-3">{t.blurb}</span>
                </p>
              </Link>
            </CutIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ———————————————————— Octa Agents ———————————————————— */

function LeadsVisual() {
  const leads = [
    ["Marco's Pizzeria", "No website"],
    ["Bright Smile Dental", "Facebook only"],
    ["Peak Performance Gym", "No website"],
  ];
  return (
    <ul className="space-y-1.5 text-[12px]">
      {leads.map(([n, s]) => (
        <li key={n} className="flex items-center justify-between rounded-md bg-white px-3 py-2 ring-1 ring-black/5">
          {n}
          <span className="rounded-full bg-octa-600/10 px-2 py-0.5 text-[11px] text-octa-700">{s}</span>
        </li>
      ))}
    </ul>
  );
}

function DemoVisual() {
  const Dental = TEMPLATES[4].Component;
  return (
    <div className="overflow-hidden rounded-md ring-1 ring-black/10">
      <TemplateFrame className="h-[104px]">
        <Dental preview />
      </TemplateFrame>
    </div>
  );
}

function OutreachVisual() {
  return (
    <div className="rounded-md bg-white p-3 text-[12px] leading-[1.45] ring-1 ring-black/5">
      <p className="font-medium">Subject: I built Bright Smile a new website</p>
      <p className="mt-1 text-fg-2">Hi Dr. Patel — I noticed your site doesn&apos;t work on phones, so I made you a new one. Take a look…</p>
    </div>
  );
}

const AGENTS = [
  { t: "Lead Finder", b: "Finds local businesses on Google with no website in any niche and city across the US and Canada, ranked and ready to call.", Visual: LeadsVisual },
  { t: "Demo Builder", b: "Builds a site for any lead in one click, with their real name, phone, hours and Google reviews, before you ever call.", Visual: DemoVisual },
  { t: "Outreach", soon: true, b: "Writes the first email with their new site attached and follows up on schedule.", Visual: OutreachVisual },
];

export function Agents() {
  return (
    <section id="agents" className="scroll-mt-16 bg-[#eeeceb]">
      <div className="mx-auto max-w-[1280px] px-4 pt-20 pb-14 sm:px-8 sm:pt-28">
        <Reveal>
          <p className="text-[15px]">Octa Agents that sell while you sleep</p>
        </Reveal>
        <RevealText
          as="p"
          text="Octacore doesn't stop when you publish. Agents find the businesses that need a website and build theirs before you call."
          className={`${display} mt-3 max-w-[900px] text-[26px] leading-[1.2] tracking-[-0.02em] sm:text-[36px]`}
        />
      </div>
      <div className="relative overflow-hidden px-4 py-14 sm:px-8 sm:py-20">
        <Photo id="photo-1600093463592-8e36ae95ef56" alt="" w={1440} className="!absolute inset-0 scale-110 blur-2xl" />
        <div className="absolute inset-0 bg-octa-800/25" />
        <div className="relative mx-auto grid max-w-[1280px] gap-4 md:grid-cols-3">
          {AGENTS.map(({ t, b, soon, Visual }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="group flex h-full flex-col bg-[#f9f8f6] p-6 transition-transform duration-500 ease-spring hover:-translate-y-1.5">
                <p className={`${display} flex items-center gap-2 text-[26px] leading-[1.05] tracking-[-0.02em]`}>
                  {t}
                  {soon && <span className="rounded-full bg-black/[.06] px-2 py-0.5 font-sans text-[11px] tracking-normal text-fg-2">Soon</span>}
                </p>
                <div className="my-6">
                  <Visual />
                </div>
                <p className="mt-auto text-[14px] leading-[1.5]">{b}</p>
                <span className="mt-6 grid size-8 place-items-center rounded-full bg-[#0f0f0f] text-white transition-colors group-hover:bg-octa-600">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ———————————————————— Customer story ———————————————————— */

const STATS = [
  { value: "$20k MRR", label: "up from $500 a month", h: "h-[240px] sm:h-[300px]" },
  { value: "40×", label: "growth in monthly revenue", h: "h-[200px] sm:h-[250px]" },
  { value: "5 hours", label: "of prompting a month", h: "h-[160px] sm:h-[200px]" },
];

export function Story() {
  const reduce = useReducedMotion();
  return (
    <section id="stories" className="dots scroll-mt-16 px-4 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <Reveal>
              <p className="text-[15px]">— Touseef · CEO, Killzone</p>
            </Reveal>
            <RevealText
              as="p"
              text={"“Octacore took me from making $500 a month\nselling websites to $20k MRR. It took me\n5 hours a month of prompting to make\nall the websites.”"}
              className={`${display} mt-4 text-[28px] leading-[1.15] tracking-[-0.025em] sm:text-[44px]`}
            />
          </div>
          <CutIn delay={0.2} className="relative w-[180px] sm:w-[240px]">
            <Image src="/clients/touseef.jpg" alt="Touseef, CEO of Killzone" width={399} height={501} className="block h-auto w-full" />
            <CropMarks />
          </CutIn>
        </div>
        <div className="mt-14 grid items-end gap-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.value}
              initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
              whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.12 * i }}
              className={`flex flex-col justify-between p-6 ${s.h} ${i === 0 ? "bg-octa-600 text-white" : "bg-[#e6e3de]"}`}
            >
              <p className={`${display} text-[40px] leading-none tracking-[-0.04em] sm:text-[52px]`}>{s.value}</p>
              <p className="text-[15px]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ———————————————————— FAQ ———————————————————— */

const FAQS = [
  ["What is Octacore?", "Octacore is an app for building, hosting and selling websites. You describe a site in plain language, Octacore builds it, and you can sell it to a business and hand over ownership — all in one place."],
  ["Do I need to know how to code?", "No. You describe what you want and refine it the same way. The code is there if you ever want it."],
  ["Who owns the website after I sell it?", "The buyer. Once they pay (or you mark the site as sold), they get an email invite to claim ownership. You can stay on as a collaborator if they want."],
  ["How do I get paid?", "Connect a payout account once. Buyers pay through a secure checkout link and the money goes straight to you, minus a small platform fee."],
  ["Where are the websites hosted?", "On Octacore's global infrastructure, with SSL, a free octacore.site address and support for custom domains."],
  ["What do Octa Agents do?", "They find local businesses on Google that don't have a website yet, rank them, and build each one a site with its real details and reviews — so you spend your time closing, not prospecting. Automated outreach is coming soon."],
  ["Can I bring my own clients?", "Of course. Agents are optional, and you can transfer a site without using Octacore checkout."],
  ["Can I get a refund?", "Yes. If Octacore isn't right for you, email us within 14 days of your first payment for a full refund. You can cancel any time from Settings, and your plan runs to the end of the period. See the refund policy for details."],
  ["How do I get help?", `Email ${SUPPORT_EMAIL} with your question and we'll get back to you.`],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-white px-4 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[1fr_1.3fr]">
        <RevealText text={"Frequently\nasked questions"} className={`${display} text-[44px] leading-[1] tracking-[-0.04em] sm:text-[64px]`} />
        <ul className="border-t border-[#0f0f0f]">
          {FAQS.map(([q, a], i) => (
            <li key={q} className="border-b border-[#0f0f0f]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[18px] font-medium sm:text-[20px]"
              >
                {q}
                <span className={`text-[26px] font-light transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="overflow-hidden"
              >
                <p className="max-w-[640px] pb-6 text-[16px] leading-[1.55] text-fg-2">{a}</p>
              </motion.div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ———————————————————— Send-off ———————————————————— */

export function Sendoff() {
  const picks = [TEMPLATES[0], TEMPLATES[1], TEMPLATES[4], TEMPLATES[3], TEMPLATES[6]];
  return (
    <section className="grain overflow-hidden bg-octa-700 px-4 py-24 text-center text-white sm:py-32">
      <RevealText
        text={"Go ahead.\nBuild it. Sell it."}
        className={`${display} text-[52px] leading-[0.95] tracking-[-0.045em] sm:text-[96px]`}
      />
      <div className="mx-auto mt-12 flex max-w-[900px] items-center justify-center gap-3 sm:gap-4">
        {picks.map((t, i) => (
          <CutIn key={t.slug} delay={0.1 + i * 0.1} className={`relative shrink-0 ${i % 2 ? "w-[70px] sm:w-[110px]" : "w-[110px] sm:w-[180px]"}`}>
            <TemplateFrame designWidth={i % 2 ? 390 : 1280} className={i % 2 ? "h-[120px] sm:h-[180px]" : "h-[90px] sm:h-[130px]"}>
              <t.Component preview />
            </TemplateFrame>
            <CropMarks className="bg-white" />
          </CutIn>
        ))}
      </div>
      <Reveal delay={0.3}>
        <Link href="/start" className="group mt-14 inline-flex items-center gap-4">
          <CircleArrow className="size-10 sm:size-12" />
          <span className={`${display} border-b-[3px] border-white text-[44px] leading-[1.1] tracking-[-0.04em] sm:text-[80px]`}>
            Start building
          </span>
        </Link>
      </Reveal>
    </section>
  );
}

/* ———————————————————— Footer ———————————————————— */

const FOOTER: Record<string, [string, string][]> = {
  Company: [["About us", "#"], ["Affiliate program", "#"], ["Careers", "#"], ["Contact", `mailto:${SUPPORT_EMAIL}`]],
  Product: [["Builder", "/#stack"], ["Hosting", "/#stack"], ["Octa Agents", "/#agents"], ["Templates", "/#templates"]],
  Resources: [["Guides", "#"], ["Help center", `mailto:${SUPPORT_EMAIL}`], ["Changelog", "#"], ["Status", "#"]],
  Legal: [["Privacy policy", "/privacy"], ["Refund policy", "/refunds"], ["Terms of service", "#"], ["Acceptable use", "#"]],
};

export function Footer() {
  return (
    <footer className="bg-white px-4 py-16 text-[14px] sm:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <OctacoreLogo size={24} />
          <p className="mt-4 max-w-[260px] text-fg-2">
            Octacore is the app for building, hosting and selling websites. Describe a site, ship it in minutes, and get
            paid when the business says yes.
          </p>
          <p className="mt-4 text-fg-2">
            Support:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-fg hover:text-octa-700">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
        {Object.entries(FOOTER).map(([h, items]) => (
          <div key={h}>
            <p className="font-medium">{h}</p>
            <ul className="mt-4 space-y-2.5 text-fg-2">
              {items.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="hover:text-fg">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-14 max-w-[1280px] text-fg-3">© {new Date().getFullYear()} Octacore. All rights reserved.</p>
    </footer>
  );
}
