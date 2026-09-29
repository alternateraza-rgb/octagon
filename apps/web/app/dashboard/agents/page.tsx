import { TeamView } from "@/components/agents/hq/team-view";
import { mockAgents, mockThreads } from "@/components/agents/hq/mock";
import { renderTime } from "@/lib/time";

export const metadata = { title: "Agents" };

// Prototype: shows sample agents until the outreach API is wired in.
export default function AgentsPage() {
  const unread = mockThreads(renderTime()).filter((t) => t.unread).length;
  return <TeamView agents={mockAgents()} unread={unread} />;
}
