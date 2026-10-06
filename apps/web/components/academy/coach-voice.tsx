"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { PhoneOff } from "lucide-react";
import { coachStore, useCoach } from "./coach-store";
import { VoiceOrb } from "./voice-orb";

// Mounted once in the dashboard shell for accounts that can use Academy. Owns the ElevenLabs session
// for Coach and shows a small floating pill while Coach is live on a page without the Coach panel.
export default function CoachVoiceHost() {
  return (
    <ConversationProvider>
      <Host />
    </ConversationProvider>
  );
}

function Host() {
  const router = useRouter();
  const pathname = usePathname();
  const coach = useCoach();
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = useConversation({
    onConnect: () => coachStore.set({ status: "connected", error: null }),
    onDisconnect: () => {
      if (limit.current) clearTimeout(limit.current);
      coachStore.set({ status: "idle", speaking: false, highlight: null });
    },
    onError: (message: string) => coachStore.set({ status: "error", error: message || "Voice dropped. Try again." }),
    onMessage: ({ message, role }) => {
      if (!message.trim()) return;
      coachStore.set({ lines: [...coachStore.get().lines, { role: role === "user" ? "user" : "coach", text: message }] });
    },
    onModeChange: ({ mode }) => coachStore.set({ speaking: mode === "speaking" }),
  });
  const { startSession, endSession, getOutputVolume } = conversation;

  useEffect(() => {
    coachStore.register({
      async start(lessonId) {
        coachStore.set({ status: "starting", error: null, lessonId, lines: [] });
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          coachStore.set({ status: "error", error: "Allow microphone access to talk to Coach." });
          return;
        }
        const res = await fetch("/api/academy/coach/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId }),
        }).catch(() => null);
        const body = (await res?.json().catch(() => null)) as {
          signedUrl?: string;
          overrides?: Record<string, unknown>;
          maxSeconds?: number;
          error?: string;
        } | null;
        if (!res?.ok || !body?.signedUrl) {
          coachStore.set({ status: "error", error: body?.error ?? "Couldn't start voice. Try again." });
          return;
        }
        startSession({
          signedUrl: body.signedUrl,
          overrides: body.overrides,
          clientTools: {
            navigate: ({ path }: { path?: string }) => {
              if (typeof path !== "string" || !path.startsWith("/dashboard")) return "Only dashboard pages can be opened.";
              router.push(path);
              return `Opened ${path}.`;
            },
            highlight_task: ({ task }: { task?: string }) => {
              coachStore.set({ highlight: typeof task === "string" ? task : null });
              document.getElementById(`task-${task}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              return "Highlighted.";
            },
          },
        });
        limit.current = setTimeout(() => endSession(), (body.maxSeconds ?? 600) * 1000);
      },
      stop: () => endSession(),
      volume: () => getOutputVolume(),
    });
    return () => coachStore.register(null);
  }, [startSession, endSession, getOutputVolume, router]);

  // The lesson pages show Coach in their own panel.
  const onLesson = /^\/dashboard\/academy\/[^/]+\/[^/]+$/.test(pathname);
  const live = coach.status === "connected" || coach.status === "starting";
  return (
    <AnimatePresence>
      {live && !onLesson && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-material py-2 pl-2 pr-2 shadow-float ring-1 ring-hairline backdrop-blur-xl backdrop-saturate-150"
        >
          <VoiceOrb size={40} active={coach.status === "connected"} speaking={coach.speaking} />
          <Link href={coach.lessonId ? `/dashboard/academy/${coach.lessonId}` : "/dashboard/academy"} className="pr-1 text-[14px]">
            <span className="block font-medium">Coach</span>
            <span className="block text-[12px] text-fg-2">{coach.speaking ? "Talking…" : "Listening"}</span>
          </Link>
          <button
            onClick={() => coachStore.stop()}
            aria-label="End voice session"
            className="grid size-11 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff size={18} strokeWidth={1.75} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
