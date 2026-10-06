"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowRight, Check, Copy, Lightbulb, Mic, RotateCcw, X } from "lucide-react";
import { TASKS } from "@/lib/academy/curriculum";
import type { Block, TaskState } from "@/lib/academy/types";
import { LessonMarkdown } from "./lesson-markdown";

// Values for the [Square brackets] in scripts: the user's details and the lead they picked.
export const FillContext = createContext<{ values: Record<string, string>; leadId: string | null }>({ values: {}, leadId: null });

export function fill(text: string, values: Record<string, string>) {
  return text.replace(/\[([^\]]+)\]/g, (whole, key: string) => values[key] || whole);
}

// Text with its [variables] shown as chips: filled ones in the accent, missing ones dashed.
function Filled({ text }: { text: string }) {
  const { values } = useContext(FillContext);
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const key = part.match(/^\[([^\]]+)\]$/)?.[1];
        if (!key) return part;
        return values[key] ? (
          <span key={i} className="rounded-[6px] bg-octa-600/10 px-1 font-medium text-octa-700 dark:text-octa-400">
            {values[key]}
          </span>
        ) : (
          <span key={i} className="rounded-[6px] px-1 border border-dashed border-fg/30 text-fg-3">
            {key}
          </span>
        );
      })}
    </>
  );
}

export function LessonBlock({ block, tasks, highlight }: { block: Block; tasks: TaskState; highlight: string | null }) {
  switch (block.type) {
    case "text":
      return <LessonMarkdown>{block.md}</LessonMarkdown>;
    case "task":
      return <TaskBlock task={block.task} optional={block.optional} done={tasks[block.task]} highlight={highlight === block.task} />;
    case "steps":
      return (
        <ol className="space-y-1">
          {block.items.map((item, i) => (
            <li key={item.title} className="relative flex gap-4 pb-5 last:pb-0">
              {i < block.items.length - 1 && <span className="absolute left-[17px] top-10 bottom-0 w-px bg-hairline" aria-hidden />}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fg/[.06] text-[14px] font-semibold tabular-nums">{i + 1}</span>
              <div className="pt-1.5">
                <p className="text-[17px] font-semibold tracking-[-0.01em]">{item.title}</p>
                <LessonMarkdown className="mt-1 !text-[16px]">{item.body}</LessonMarkdown>
              </div>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return <Callout tone={block.tone} title={block.title} md={block.md} />;
    case "script":
      return <ScriptBlock block={block} />;
    case "objections":
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <ObjectionCard key={item.says} {...item} />
          ))}
        </ul>
      );
    case "funnel": {
      const top = block.stages[0].value;
      return (
        <div className="rounded-[24px] bg-elevated p-6 shadow-soft ring-1 ring-hairline">
          <ul className="space-y-2.5">
            {block.stages.map((s, i) => (
              <li key={s.label} className="flex items-center gap-4">
                <span className="w-[150px] shrink-0 text-[14px] text-fg-2 sm:w-[190px]">{s.label}</span>
                <div className="h-9 flex-1">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(8, (s.value / top) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.08 * i }}
                    className={`flex h-full items-center justify-end rounded-[10px] px-3 text-[14px] font-semibold tabular-nums ${
                      i === block.stages.length - 1 ? "bg-octa-600 text-white" : "bg-fg/[.08]"
                    }`}
                  >
                    {s.value}
                  </motion.div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] text-fg-2">{block.note}</p>
        </div>
      );
    }
    case "compare":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[20px] bg-canvas-2 p-5">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-3">
              <X size={14} strokeWidth={2} /> {block.bad.label}
            </p>
            <p className="mt-2 text-[16px] leading-[1.5] text-fg-2">{block.bad.text}</p>
          </div>
          <div className="rounded-[20px] bg-elevated p-5 shadow-soft ring-2 ring-octa-600/40">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-octa-600">
              <Check size={14} strokeWidth={2} /> {block.good.label}
            </p>
            <p className="mt-2 text-[16px] leading-[1.5]">{block.good.text}</p>
          </div>
        </div>
      );
  }
}

function TaskBlock({ task, optional, done, highlight }: { task: keyof TaskState; optional?: boolean; done: boolean; highlight: boolean }) {
  const t = TASKS[task];
  return (
    <div
      id={`task-${task}`}
      className={`flex flex-wrap items-center gap-4 rounded-[20px] p-4 pr-5 transition-shadow ${
        done ? "bg-emerald-500/[.08]" : "bg-elevated shadow-soft ring-1 ring-hairline"
      } ${highlight ? "ring-4 ring-octa-600/30" : ""}`}
    >
      <motion.span
        key={String(done)}
        initial={done ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          done ? "bg-emerald-500 text-white" : "border-2 border-dashed border-fg/25"
        }`}
      >
        {done && <Check size={20} strokeWidth={2.5} />}
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-3">
          {done ? "Done" : optional ? "Do it now · optional" : "Do it now"}
        </p>
        <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em]">{t.label}</p>
      </div>
      {!done && (
        <Link
          href={t.href}
          className="flex h-11 items-center gap-1.5 rounded-full bg-fg/[.07] px-4 text-[14px] font-medium hover:bg-fg/[.11]"
        >
          {t.cta} <ArrowRight size={15} strokeWidth={1.75} />
        </Link>
      )}
    </div>
  );
}

function Callout({ tone, title, md }: { tone: "tip" | "warning" | "story"; title: string; md: string }) {
  if (tone === "story")
    return (
      <figure className="flex flex-col gap-5 rounded-[24px] bg-canvas-2 p-6 sm:flex-row sm:items-center">
        <Image src="/clients/touseef.jpg" alt="" width={96} height={120} className="h-[120px] w-[96px] shrink-0 object-cover" />
        <div>
          <LessonMarkdown className="!text-[20px] !leading-[1.35] !text-fg font-[family-name:var(--font-display)] tracking-[-0.015em]">{md}</LessonMarkdown>
          <figcaption className="mt-3 text-[14px] text-fg-2">— {title}</figcaption>
        </div>
      </figure>
    );
  const Icon = tone === "tip" ? Lightbulb : AlertTriangle;
  return (
    <aside className={`flex gap-3.5 rounded-[20px] p-5 ${tone === "tip" ? "bg-octa-600/[.07]" : "bg-amber-500/10"}`}>
      <Icon size={20} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${tone === "tip" ? "text-octa-600" : "text-amber-600 dark:text-amber-400"}`} />
      <div>
        <p className="text-[16px] font-semibold">{title}</p>
        <LessonMarkdown className="mt-1 !text-[15px]">{md}</LessonMarkdown>
      </div>
    </aside>
  );
}

function ScriptBlock({ block }: { block: Extract<Block, { type: "script" }> }) {
  const { values, leadId } = useContext(FillContext);
  const [copied, setCopied] = useState(false);
  const practice = new URLSearchParams();
  for (const [k, v] of Object.entries(block.practice ?? {})) practice.set(k, String(v));
  if (leadId) practice.set("lead", leadId);
  return (
    <div className="overflow-hidden rounded-[24px] bg-elevated shadow-soft ring-1 ring-hairline">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-6 py-4">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.01em]">{block.title}</p>
          <p className="mt-0.5 text-[14px] text-fg-2">{block.when}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(block.lines.map((l) => fill(l, values)).join("\n\n")).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              });
            }}
            className="flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[14px] text-fg-2 ring-1 ring-hairline hover:bg-fg/5 hover:text-fg"
          >
            {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.5} />} {copied ? "Copied" : "Copy"}
          </button>
          {block.practice && (
            <Link
              href={`/dashboard/academy/practice${practice.size ? `?${practice}` : ""}`}
              className="flex h-11 items-center gap-1.5 rounded-full bg-fg/[.07] px-3.5 text-[14px] font-medium hover:bg-fg/[.11]"
            >
              <Mic size={15} strokeWidth={1.5} /> Practise this
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-3 px-6 py-5 text-[16px] leading-[1.6]">
        {block.lines.map((line, i) => {
          const stage = line.match(/^\(([^)]+)\)\s*(.*)$/);
          return (
            <p key={i}>
              {stage && <span className="mr-1.5 text-[14px] italic text-fg-3">{stage[1]}</span>}
              <Filled text={stage ? stage[2] : line} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

function ObjectionCard({ says, reply, why }: { says: string; reply: string; why: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`relative flex min-h-[188px] w-full flex-col rounded-[22px] p-5 text-left transition-colors ${
          open ? "bg-elevated shadow-soft ring-1 ring-hairline" : "bg-canvas-2 hover:bg-fg/[.06]"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="reply"
              initial={reduce ? false : { opacity: 0, rotateX: -12, y: 6 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-1 flex-col"
            >
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-octa-600">You say</p>
              <p className="mt-2 text-[15px] leading-[1.55]">
                <Filled text={reply} />
              </p>
              <p className="mt-auto pt-4 text-[13px] leading-[1.45] text-fg-3">{why}</p>
            </motion.div>
          ) : (
            <motion.div
              key="says"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-1 flex-col"
            >
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-3">They say</p>
              <p className="mt-2 text-balance font-[family-name:var(--font-display)] text-[24px] font-semibold leading-[1.15] tracking-[-0.025em]">
                “{says}”
              </p>
              <p className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] text-fg-3">
                <RotateCcw size={13} strokeWidth={1.75} /> Tap for the reply
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </li>
  );
}

export function BlockList({ children }: { children: ReactNode }) {
  return <div className="space-y-7">{children}</div>;
}
