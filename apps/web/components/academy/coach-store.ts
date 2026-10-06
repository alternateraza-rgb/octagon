"use client";

import { useSyncExternalStore } from "react";

// Coach's voice session lives in the dashboard shell (components/academy/coach-voice.tsx), so it keeps
// talking while Coach sends the user to another page. This store is how the lesson's Coach panel sees
// and drives it, without loading the ElevenLabs SDK itself.
export type CoachLine = { role: "user" | "coach"; text: string };
export type CoachState = {
  status: "idle" | "starting" | "connected" | "error";
  speaking: boolean;
  lessonId: string | null;
  lines: CoachLine[];
  error: string | null;
  // A task Coach pointed at, highlighted on the lesson.
  highlight: string | null;
};

type Controls = { start: (lessonId: string | null) => void; stop: () => void; volume: () => number };

let state: CoachState = { status: "idle", speaking: false, lessonId: null, lines: [], error: null, highlight: null };
let controls: Controls | null = null;
const listeners = new Set<() => void>();

export const coachStore = {
  get: () => state,
  set(patch: Partial<CoachState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  register(c: Controls | null) {
    controls = c;
  },
  start: (lessonId: string | null) => controls?.start(lessonId),
  stop: () => controls?.stop(),
  volume: () => controls?.volume() ?? 0,
  available: () => !!controls,
};

export function useCoach() {
  return useSyncExternalStore(coachStore.subscribe, coachStore.get, coachStore.get);
}
