"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Eye } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import type { Attachment } from "@/lib/attachments";
import type { BuildProgress } from "@/lib/sites/build-progress";
import type { VersionSummary } from "@/lib/sites/store";
import { AttachmentList } from "@/components/uploads/attachments";
import { useSmoothText } from "@/components/chat/use-smooth-text";
import { StageLine } from "./build-progress";

const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });
const spring = { type: "spring" as const, stiffness: 240, damping: 26 };

export type Pending = {
  instruction: string;
  attachments: Attachment[];
  summary: string;
  noteDone: boolean;
  progress: BuildProgress;
};

// The builder's conversation: each request, Octa's reply about what it did, and the version it made.
export function BuilderTimeline({
  versions,
  pending,
  selectedId,
  liveVersionId,
  building,
  onSelect,
  onSuggestion,
  children,
}: {
  versions: VersionSummary[];
  pending: Pending | null;
  selectedId: string | null;
  liveVersionId: string | null;
  building: boolean;
  onSelect: (id: string) => void;
  onSuggestion: (text: string) => void;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const latest = versions.at(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const follow = () => el.scrollTo({ top: el.scrollHeight });
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(el.firstElementChild!);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-6 px-4 pb-6 pt-5">
        {versions.map((v, i) => (
          <div key={v.id} className="space-y-3">
            <UserBubble text={v.instruction} attachments={v.attachments} animate={false} />
            <OctaReply>
              <p className="whitespace-pre-line text-[15px] leading-[1.55]">
                {v.summary ??
                  (i === 0
                    ? "I've built your site. Have a look, then tell me what to change."
                    : "Done — I've applied your changes.")}
              </p>
              <button
                onClick={() => onSelect(v.id)}
                aria-pressed={selectedId === v.id}
                className={`mt-3 flex h-11 w-full items-center gap-3 rounded-[14px] px-3 text-left text-[13px] transition-all ${
                  selectedId === v.id
                    ? "bg-elevated shadow-soft ring-1 ring-octa-600/40"
                    : "bg-fg/[.04] ring-1 ring-transparent hover:bg-fg/[.07]"
                }`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-octa-600/10 text-[11px] font-semibold text-octa-700 dark:text-octa-400">
                  {i + 1}
                </span>
                <span className="font-medium">Version {i + 1}</span>
                {v.id === liveVersionId && (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1.5 text-fg-3">
                  {selectedId === v.id ? (
                    <>
                      <Eye size={13} /> Viewing
                    </>
                  ) : (
                    time.format(v.createdAt)
                  )}
                </span>
              </button>
            </OctaReply>
            {v === latest && !building && v.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {v.suggestions.map((s, j) => (
                  <motion.button
                    key={s}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.1 + j * 0.06 }}
                    onClick={() => onSuggestion(s)}
                    className="group flex min-h-9 items-center gap-1.5 rounded-full bg-elevated px-3.5 text-[13px] text-fg-2 ring-1 ring-hairline transition-colors hover:text-fg hover:ring-octa-600/40"
                  >
                    {s}
                    <ArrowUpRight size={13} className="text-fg-3 group-hover:text-octa-600" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        ))}

        <AnimatePresence>
          {pending && (
            <motion.div key="pending" initial={false} exit={{ opacity: 0 }} className="space-y-3">
              <UserBubble text={pending.instruction} attachments={pending.attachments} animate />
              <OctaReply>
                <LiveNote pending={pending} />
              </OctaReply>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>
    </div>
  );
}

function LiveNote({ pending }: { pending: Pending }) {
  const { text, done } = useSmoothText(pending.summary, true);
  return (
    <div>
      {text ? (
        <p className="whitespace-pre-line text-[15px] leading-[1.55]">
          {text}
          {!done || !pending.noteDone ? (
            <span aria-hidden className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-octa-600 align-middle" />
          ) : null}
        </p>
      ) : (
        <p className="shimmer-text text-[15px] font-medium">{pending.noteDone ? "Getting to work…" : "Thinking it through…"}</p>
      )}
      <div className="mt-4">
        <StageLine progress={pending.progress} />
      </div>
    </div>
  );
}

function UserBubble({ text, attachments, animate }: { text: string; attachments: Attachment[]; animate: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={animate && !reduce ? { opacity: 0, y: 14, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="flex origin-bottom-right flex-col items-end gap-2"
    >
      <AttachmentList items={attachments} />
      <p className="max-w-[90%] whitespace-pre-wrap break-words rounded-[18px] rounded-br-[6px] bg-fg/[.07] px-4 py-2.5 text-[15px] leading-[1.45]">
        {text}
      </p>
    </motion.div>
  );
}

function OctaReply({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-elevated shadow-soft ring-1 ring-hairline">
        <OctacoreMark size={15} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
