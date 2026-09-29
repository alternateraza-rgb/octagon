import { InboxView } from "@/components/agents/hq/inbox-view";
import { mockAgents, mockThreads } from "@/components/agents/hq/mock";
import { renderTime } from "@/lib/time";

export const metadata = { title: "Replies" };

// Prototype: sample replies until the Resend inbound webhook is wired in.
export default function InboxPage() {
  const now = renderTime();
  return <InboxView threads={mockThreads(now)} agents={mockAgents()} now={now} />;
}
