// The shapes the Octa Agents screens draw. For now they're filled from mock.ts; the outreach API will
// return the same shapes.

export type AgentStatus = "active" | "paused" | "auto_paused";

// Where a business is in an agent's pipeline, left to right.
export type Stage = "found" | "email" | "contacted" | "replied" | "interested";

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "found", label: "Found", hint: "No website of their own" },
  { id: "email", label: "Email found", hint: "Published on their pages" },
  { id: "contacted", label: "Contacted", hint: "First email or a follow-up sent" },
  { id: "replied", label: "Replied", hint: "Wrote back" },
  { id: "interested", label: "Interested", hint: "Wants to talk" },
];

// Pins and dots get quieter the earlier the stage, and warm up to the accent as a business shows interest.
export const STAGE_DOT: Record<Stage, string> = {
  found: "bg-fg-3/70",
  email: "bg-fg-2",
  contacted: "bg-fg",
  replied: "bg-octa-400",
  interested: "bg-octa-600",
};

export type AgentStats = { found: number; emails: number; contacted: number; replies: number; interested: number };

export type Agent = {
  id: string;
  name: string;
  niche: string;
  locations: string[];
  country: "US" | "CA";
  center: [lng: number, lat: number];
  dailyCap: number;
  senderName: string;
  pitch: string;
  status: AgentStatus;
  // One line on what the agent is doing right now.
  now: string;
  sentToday: number;
  stats: AgentStats;
};

export type FieldLead = {
  id: string;
  name: string;
  category: string;
  address: string;
  lng: number;
  lat: number;
  stage: Stage;
  score: number;
  email: string | null;
  emailSource: string | null;
  // When the lead reached its stage, for "3h ago".
  at: number;
};

export type EventKind = "search" | "found" | "email" | "sent" | "followup" | "reply" | "paused";

export type AgentEvent = { id: string; at: number; kind: EventKind; text: string; detail?: string; leadId?: string };

export type Intent = "interested" | "question" | "not_now";

export type ThreadMessage = { from: "agent" | "them"; body: string; at: number };

export type Thread = {
  id: string;
  agentId: string;
  leadId: string;
  business: string;
  contact: string;
  category: string;
  intent: Intent;
  unread: boolean;
  messages: ThreadMessage[];
  // What the agent suggests sending back.
  draft: string;
};
