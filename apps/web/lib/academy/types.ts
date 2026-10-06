// The shapes Academy content is written in. Shared by the server (progress, Coach's prompt) and the
// lesson view.

// Things a user does in Octacore that a lesson can check off by itself (lib/academy/tasks.ts).
export type TaskId =
  | "built"
  | "edited"
  | "published"
  | "domain"
  | "searched"
  | "saved"
  | "demo"
  | "mailbox"
  | "emailed"
  | "practiced"
  | "payouts"
  | "sent"
  | "sold";

export type TaskState = Record<TaskId, boolean>;

export type Trade = "plumber" | "salon" | "dentist" | "gym" | "cafe" | "landscaper";
export type Mood = "busy" | "skeptical" | "friendly" | "burned";
export type Difficulty = "easy" | "normal" | "hard";
export type Scenario = { trade: Trade; mood: Mood; difficulty: Difficulty };

export type Block =
  | { type: "text"; md: string }
  | { type: "task"; task: TaskId; optional?: boolean }
  | { type: "steps"; items: { title: string; body: string }[] }
  | { type: "callout"; tone: "tip" | "warning" | "story"; title: string; md: string }
  // A call or email script. [Square brackets] are filled from the user and a lead they pick.
  | { type: "script"; title: string; when: string; lines: string[]; practice?: Partial<Scenario> }
  | { type: "objections"; items: { says: string; reply: string; why: string }[] }
  // A sales funnel: how many of each stage it takes to reach the next.
  | { type: "funnel"; stages: { label: string; value: number }[]; note: string }
  | { type: "compare"; bad: { label: string; text: string }; good: { label: string; text: string } };

export type Lesson = { id: string; title: string; minutes: number; summary: string; blocks: Block[] };
export type Module = { id: string; title: string; tagline: string; lessons: Lesson[] };
