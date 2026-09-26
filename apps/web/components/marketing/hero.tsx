"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, Mic, Plus } from "lucide-react";
import { CATEGORIES, TEMPLATES, type Category } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/frame";
import { CropMarks, RevealText } from "./motion";

const PROMPTS = [
  "A warm website for a family-run Italian restaurant in Brooklyn, with online reservations",
  "A moody, editorial site for a West Loop hair salon with online booking",
  "A trustworthy site for a Chicago business law firm with a free consultation form",
  "A bold site for a Denver strength gym with a class timetable and free-week signup",
];

function useTypewriter(lines: string[], active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) return;
    let line = 0;
    let i = 0;
    let deleting = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line];
      if (!deleting) {
        i++;
        setText(full.slice(0, i));
        if (i === full.length) {
          deleting = true;
          t = setTimeout(tick, 2200);
          return;
        }
        t = setTimeout(tick, 28 + Math.random() * 40);
      } else {
        i -= 3;
        setText(full.slice(0, Math.max(i, 0)));
        if (i <= 0) {
          deleting = false;
          line = (line + 1) % lines.length;
        }
        t = setTimeout(tick, 14);
      }
    };
    t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [lines, active]);
  return text;
}

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [pinned, setPinned] = useState(false);
  const typed = useTypewriter(PROMPTS, !prompt && !focused && !reduce);

  // Cycle categories like a slideshow until the visitor picks one.
  useEffect(() => {
    if (pinned || reduce) return;
    const id = setInterval(
      () => setCategory((c) => CATEGORIES[(CATEGORIES.indexOf(c) + 1) % CATEGORIES.length]),
      5000,
    );
    return () => clearInterval(id);
  }, [pinned, reduce]);

  function submit() {
    const value = prompt.trim();
    if (!value) return;
    router.push(`/start?prompt=${encodeURIComponent(value)}`);
  }

  return (
    <section className="dots relative -mt-16 overflow-hidden pt-32 sm:pt-40">
      <div className="mx-auto max-w-[1240px] px-4 text-center">
        <RevealText
          as="h1"
          once
          text={"Every business needs a website.\nSell them one."}
          className="font-[family-name:var(--font-display)] text-[44px] leading-[0.98] font-semibold tracking-[-0.045em] sm:text-[68px] lg:text-[84px]"
        />
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.35 }}
          className="mx-auto mt-6 max-w-[600px] text-balance text-[17px] leading-[1.5] text-fg sm:text-[19px]"
        >
          Build premium websites in your own words, host them on Octacore, and sell them to the businesses they were
          made for — all from one app.
        </motion.p>

        <motion.form
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.5 }}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto mt-10 max-w-[680px] rounded-[18px] bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,.06),0_12px_40px_-8px_rgba(0,0,0,.12)] ring-1 ring-black/5 transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,.06),0_20px_60px_-10px_rgba(194,65,12,.28)]"
        >
          <label htmlFor="hero-prompt" className="sr-only">
            Describe the website you want to build
          </label>
          <div className="relative">
            <textarea
              id="hero-prompt"
              rows={3}
              value={prompt}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="block w-full resize-none bg-transparent px-2 pt-1 text-[16px] leading-[1.5] text-[#0f0f0f] focus:outline-none"
            />
            {!prompt && (
              <span aria-hidden className="pointer-events-none absolute left-2 top-1 pr-2 text-[16px] leading-[1.5] text-[#8a8a8e]">
                {focused || reduce ? "Describe the website you want to sell…" : typed}
                {!focused && !reduce && <span className="ml-px inline-block h-[18px] w-px translate-y-[3px] animate-pulse bg-[#8a8a8e]" />}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <button type="button" aria-label="Attach a file" className="grid size-10 place-items-center rounded-full text-[#0f0f0f] hover:bg-black/5">
              <Plus size={20} strokeWidth={1.75} />
            </button>
            <span className="ml-auto flex items-center gap-1 rounded-full px-3 py-2 text-[14px] text-[#0f0f0f]">
              Website <ChevronDown size={14} />
            </span>
            <button type="button" aria-label="Dictate" className="grid size-10 place-items-center rounded-full text-[#0f0f0f] hover:bg-black/5">
              <Mic size={18} strokeWidth={1.75} />
            </button>
            <button
              type="submit"
              aria-label="Start building"
              className="grid size-10 place-items-center rounded-[10px] bg-octa-600 text-white transition-all hover:bg-octa-500 active:scale-95"
            >
              <ArrowUpRight size={20} strokeWidth={2} />
            </button>
          </div>
        </motion.form>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          role="tablist"
          aria-label="Template categories"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-[14px]"
        >
          {CATEGORIES.map((c, i) => (
            <span key={c} className="flex items-center">
              {i > 0 && <span className="mx-2 size-1 rounded-full bg-[#0f0f0f]" aria-hidden />}
              <button
                role="tab"
                aria-selected={c === category}
                onClick={() => {
                  setCategory(c);
                  setPinned(true);
                }}
                className={`px-1 py-1 transition-colors ${c === category ? "font-medium text-[#0f0f0f]" : "text-[#5f5f63] hover:text-[#0f0f0f]"}`}
              >
                {c === category ? `[${c}]` : c}
              </button>
            </span>
          ))}
        </motion.div>
      </div>

      <TemplateStrip category={category} />
    </section>
  );
}

/** Row of live template thumbnails that wipe in whenever the category changes. */
function TemplateStrip({ category }: { category: Category }) {
  const inCat = TEMPLATES.filter((t) => t.category === category);
  const others = TEMPLATES.filter((t) => t.category !== category);
  // [phone, desktop, desktop, phone] for the active category, framed by other templates on the edges.
  const items = [
    { t: others[0], kind: "desktop" as const },
    { t: inCat[0], kind: "phone" as const },
    { t: inCat[0], kind: "desktop" as const },
    { t: inCat[1], kind: "desktop" as const },
    { t: inCat[1], kind: "phone" as const },
    { t: others[3], kind: "desktop" as const },
  ];

  return (
    <div className="relative mt-14 h-[230px] sm:mt-16 sm:h-[300px]">
      <div className="absolute left-1/2 flex -translate-x-1/2 items-start gap-4 sm:gap-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map(({ t, kind }, i) => (
            <motion.a
              key={`${category}-${i}`}
              href={`/templates/${t.slug}`}
              className={`relative block shrink-0 bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,.25)] ${
                kind === "phone" ? "w-[112px] sm:w-[140px]" : "w-[300px] sm:w-[420px]"
              } ${i === 0 || i === 5 ? "opacity-60" : ""}`}
              initial={{ clipPath: "inset(100% 0% 0% 0%)", y: 40 }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
              exit={{ clipPath: "inset(0% 0% 100% 0%)", y: -20, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.06 * i }}
              aria-label={`${t.name} template`}
            >
              <TemplateFrame
                designWidth={kind === "phone" ? 390 : 1280}
                className={kind === "phone" ? "h-[230px] sm:h-[290px]" : "h-[190px] sm:h-[266px]"}
              >
                <t.Component preview />
              </TemplateFrame>
              <CropMarks />
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
