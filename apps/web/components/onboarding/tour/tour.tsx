"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { OctacoreMark } from "@octacore/ui/logo";
import { useWorkspace } from "@/components/app/workspace";
import { BUSINESSES, CHAPTERS, type Business } from "./chapters";

// The first-run tour: opens by itself once for new builders, and from the account menu after that.
export function Tour() {
  const { tourOpen, closeTour, me } = useWorkspace();
  return <AnimatePresence>{tourOpen && <TourDialog name={me.name.split(" ")[0]} onClose={closeTour} />}</AnimatePresence>;
}

function TourDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [[step, dir], setStep] = useState<[number, number]>([0, 1]);
  const [business, setBusiness] = useState<Business>(BUSINESSES[0]);
  const [warm, setWarm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [published, setPublished] = useState(false);
  const [setup, setSetup] = useState(200000);
  const [hosting, setHosting] = useState(7900);

  const last = step === CHAPTERS.length - 1;
  const go = (to: number) => {
    if (to < 0 || to >= CHAPTERS.length) return;
    setStep([to, to > step ? 1 : -1]);
  };
  const finish = () => {
    onClose();
    router.push(`/dashboard/sites?prompt=${encodeURIComponent(business.prompt)}`);
  };

  // Arrow keys to move, Escape to leave, and Tab kept inside the tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT";
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !typing) go(step + 1);
      else if (e.key === "ArrowLeft" && !typing) go(step - 1);
      else if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]")];
        if (!items.length) return;
        const first = items[0], end = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          end.focus();
        } else if (!e.shiftKey && document.activeElement === end) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Focus the dialog on open so screen readers and keyboards start inside it.
  useEffect(() => ref.current?.focus(), []);

  const Current = CHAPTERS[step];

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      data-theme="dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-canvas text-fg focus:outline-none"
    >
      {/* Warm light that drifts behind the content. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 70% 45%, color-mix(in srgb, var(--color-octa-600) 26%, transparent), transparent 70%), radial-gradient(40% 40% at 15% 90%, color-mix(in srgb, var(--color-octa-800) 30%, transparent), transparent 70%)",
        }}
        animate={reduce ? undefined : { x: ["-3%", "3%", "-3%"], y: ["-2%", "2%", "-2%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="relative flex h-16 shrink-0 items-center gap-3 px-4 sm:px-8">
        <OctacoreMark size={24} />
        <span className="text-[14px] font-medium">Welcome tour</span>
        <span className="text-[14px] text-fg-3 tabular-nums">
          {step + 1} / {CHAPTERS.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] text-fg-2 hover:bg-fg/[.08] hover:text-fg"
        >
          {last ? "Close" : "Skip tour"} <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      <main className="relative min-h-0 flex-1 overflow-y-auto px-5 sm:px-10">
        <div className="mx-auto flex min-h-full max-w-[1180px] flex-col justify-center py-6 sm:py-10">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              <Current
                name={name}
                business={business}
                setBusiness={setBusiness}
                warm={warm}
                setWarm={setWarm}
                booking={booking}
                setBooking={setBooking}
                published={published}
                setPublished={setPublished}
                setup={setup}
                setSetup={setSetup}
                hosting={hosting}
                setHosting={setHosting}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative shrink-0 border-t border-hairline px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4">
          <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Tour chapters">
            {CHAPTERS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Chapter ${i + 1}`}
                onClick={() => go(i)}
                className="group flex h-11 max-w-[64px] flex-1 items-center"
              >
                <span className="relative h-1 w-full overflow-hidden rounded-full bg-fg/15 group-hover:bg-fg/25">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-octa-500"
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  />
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            aria-label="Back"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-fg/[.08] text-fg transition-opacity hover:bg-fg/[.13] disabled:opacity-0"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={last ? finish : () => go(step + 1)}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-octa-600 px-6 text-[15px] font-medium text-white shadow-glow transition-[background-color,transform] hover:bg-octa-500 active:scale-[.97]"
          >
            {last ? "Build your first site" : step === 0 ? "Show me" : "Next"}
            <ArrowRight size={17} strokeWidth={2} />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
