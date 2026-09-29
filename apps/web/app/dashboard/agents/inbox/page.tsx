import { InboxView } from "@/components/agents/hq/inbox-view";
import { mockAgents, mockThreads } from "@/components/agents/hq/mock";
import { renderTime } from "@/lib/time";
import { requireAgentsPreview } from "@/lib/agents/preview";

export const metadata = { title: "Replies" };

// Prototype: sample replies until the Resend inbound webhook is wired in.
export default async function InboxPage() {
  await requireAgentsPreview();
  const now = renderTime();
  return <InboxView threads={mockThreads(now)} agents={mockAgents()} now={now} />;
}
