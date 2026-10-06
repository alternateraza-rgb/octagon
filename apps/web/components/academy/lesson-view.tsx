"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, MessageCircle } from "lucide-react";
import type { Lesson, TaskState } from "@/lib/academy/types";
import type { AcademyLead } from "@/lib/academy/store";
import { useToast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/app/workspace";
import { BlockList, FillContext, LessonBlock } from "./blocks";
import { CoachPanel } from "./coach-panel";
import { useCoach } from "./coach-store";

type Nav = { id: string; title: string } | null;

// What the user typed into "Fill in the scripts", kept in this browser.
const FILL_KEY = "academy-fill";
type Mine = { leadId: string; phone: string; setup: string; monthly: string };
const NO_FILL: Mine = { leadId: "", phone: "", setup: "", monthly: "" };
const fillListeners = new Set<() => void>();
const fillStore = {
  subscribe(l: () => void) {
    fillListeners.add(l);
    return () => fillListeners.delete(l);
  },
  get() {
    try {
      return localStorage.getItem(FILL_KEY) ?? "";
    } catch {
      return "";
    }
  },
  set(value: Mine) {
    try {
      localStorage.setItem(FILL_KEY, JSON.stringify(value));
    } catch {}
    fillListeners.forEach((l) => l());
  },
};

export function LessonView({
  lesson,
  module,
  moduleIndex,
  siblings,
  prev,
  next,
  done,
  tasks,
  leads,
  voice,
}: {
  lesson: Lesson;
  module: { id: string; title: string };
  moduleIndex: number;
  siblings: { id: string; title: string; done: boolean }[];
  prev: Nav;
  next: Nav;
  done: boolean;
  tasks: TaskState;
  leads: AcademyLead[];
  voice: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { me } = useWorkspace();
  const coach = useCoach();
  const [saving, setSaving] = useState(false);
  const hasScripts = lesson.blocks.some((b) => b.type === "script" || b.type === "objections");
  const saved = useSyncExternalStore(fillStore.subscribe, fillStore.get, () => "");
  const mine = useMemo<Mine>(() => {
    try {
      return { ...NO_FILL, ...(saved ? JSON.parse(saved) : {}) };
    } catch {
      return NO_FILL;
    }
  }, [saved]);
  const update = (patch: Partial<Mine>) => fillStore.set({ ...mine, ...patch });

  // Tasks are done elsewhere in the app; check again whenever the user comes back to this tab.
  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [router]);

  const lead = leads.find((l) => l.id === mine.leadId) ?? null;
  const fill = useMemo(
    () => ({
      leadId: lead?.id ?? null,
      values: {
        "Your name": me.name.split(" ")[0] ?? "",
        "Your phone": mine.phone,
        "Setup price": mine.setup ? `$${mine.setup.replace(/^\$/, "")}` : "",
        "Monthly price": mine.monthly ? `$${mine.monthly.replace(/^\$/, "")}` : "",
        Business: lead?.name ?? "",
        City: lead?.city ?? "",
        Trade: lead?.category?.toLowerCase() ?? "",
        Link: lead?.link ?? "",
      } as Record<string, string>,
    }),
    [lead, me.name, mine],
  );

  async function complete() {
    setSaving(true);
    const res = await fetch("/api/academy/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return toast.error("Couldn't save that. Try again.");
    router.push(next ? `/dashboard/academy/${next.id}` : "/dashboard/academy");
    router.refresh();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pt-12">
        <article className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] text-fg-2">
            <Link href="/dashboard/academy" className="hover:text-fg">
              Academy
            </Link>
            <ChevronRight size={14} strokeWidth={1.75} className="text-fg-3" />
            <span>
              {String(moduleIndex + 1).padStart(2, "0")} · {module.title}
            </span>
          </nav>

          <ol className="mt-5 flex flex-wrap gap-1.5" aria-label="Lessons in this module">
            {siblings.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/academy/${s.id}`}
                  aria-current={s.id === lesson.id ? "page" : undefined}
                  title={s.title}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] ${
                    s.id === lesson.id ? "bg-fg text-canvas" : s.done ? "bg-octa-600/10 text-octa-700 dark:text-octa-400" : "bg-fg/[.06] text-fg-2 hover:text-fg"
                  }`}
                >
                  {s.done && s.id !== lesson.id ? <Check size={13} strokeWidth={2.25} /> : i + 1}
                  <span className="hidden sm:inline">{s.title}</span>
                </Link>
              </li>
            ))}
          </ol>

          <motion.h1
            key={lesson.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            className="mt-8 text-balance font-[family-name:var(--font-display)] text-[38px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[48px]"
          >
            {lesson.title}
          </motion.h1>
          <p className="mt-4 max-w-[640px] text-[19px] leading-[1.45] text-fg-2">{lesson.summary}</p>
          <p className="mt-4 flex items-center gap-3 text-[14px] text-fg-3">
            <span className="flex items-center gap-1.5">
              <Clock size={14} strokeWidth={1.75} /> {lesson.minutes} min
            </span>
            {done && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                <Check size={12} strokeWidth={2.25} /> Done
              </span>
            )}
          </p>

          {hasScripts && (
            <div className="mt-8 rounded-[20px] bg-canvas-2 p-4">
              <p className="text-[13px] font-medium text-fg-2">Fill in the scripts</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_0.7fr_0.7fr]">
                <select
                  value={mine.leadId}
                  onChange={(e) => update({ leadId: e.target.value })}
                  aria-label="Business"
                  className="col-span-2 h-11 w-full min-w-0 sm:col-span-1 rounded-[12px] bg-elevated px-3 text-[14px] outline-none ring-1 ring-hairline focus:ring-4 focus:ring-octa-600/15"
                >
                  <option value="">{leads.length ? "Pick a business you found" : "No businesses saved yet"}</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.city ? ` · ${l.city}` : ""}
                    </option>
                  ))}
                </select>
                <input
                  value={mine.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="Your phone"
                  aria-label="Your phone"
                  className="col-span-2 h-11 w-full min-w-0 sm:col-span-1 rounded-[12px] bg-elevated px-3 text-[14px] outline-none ring-1 ring-hairline placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15"
                />
                <input
                  value={mine.setup}
                  onChange={(e) => update({ setup: e.target.value })}
                  placeholder="Setup $"
                  aria-label="Setup price"
                  inputMode="numeric"
                  className="h-11 w-full min-w-0 rounded-[12px] bg-elevated px-3 text-[14px] outline-none ring-1 ring-hairline placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15"
                />
                <input
                  value={mine.monthly}
                  onChange={(e) => update({ monthly: e.target.value })}
                  placeholder="Monthly $"
                  aria-label="Monthly price"
                  inputMode="numeric"
                  className="h-11 w-full min-w-0 rounded-[12px] bg-elevated px-3 text-[14px] outline-none ring-1 ring-hairline placeholder:text-fg-3 focus:ring-4 focus:ring-octa-600/15"
                />
              </div>
            </div>
          )}

          <FillContext.Provider value={fill}>
            <div className="mt-10">
              <BlockList>
                {lesson.blocks.map((block, i) => (
                  <LessonBlock key={i} block={block} tasks={tasks} highlight={coach.highlight} />
                ))}
              </BlockList>
            </div>
          </FillContext.Provider>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6">
            {prev ? (
              <Link
                href={`/dashboard/academy/${prev.id}`}
                className="flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] text-fg-2 ring-1 ring-hairline hover:bg-fg/5 hover:text-fg"
              >
                <ArrowLeft size={16} strokeWidth={1.75} /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {done ? (
              <Link
                href={next ? `/dashboard/academy/${next.id}` : "/dashboard/academy"}
                className="flex h-12 items-center gap-1.5 rounded-full bg-octa-600 px-6 text-[16px] font-medium text-white hover:bg-octa-500"
              >
                {next ? `Next: ${next.title}` : "Back to Academy"} <ArrowRight size={17} strokeWidth={1.75} />
              </Link>
            ) : (
              <button
                onClick={complete}
                disabled={saving}
                className="flex h-12 items-center gap-1.5 rounded-full bg-octa-600 px-6 text-[16px] font-medium text-white hover:bg-octa-500 disabled:opacity-60"
              >
                <Check size={17} strokeWidth={2} /> {next ? "Done, next lesson" : "Finish the Academy"}
              </button>
            )}
          </div>
        </article>

        <aside id="coach" className="lg:sticky lg:top-8 lg:self-start">
          <CoachPanel key={lesson.id} lessonId={lesson.id} voice={voice} />
        </aside>
      </div>

      <a
        href="#coach"
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-octa-600 px-5 text-[15px] font-medium text-white shadow-float lg:hidden"
      >
        <MessageCircle size={18} strokeWidth={1.75} /> Coach
      </a>
    </div>
  );
}
