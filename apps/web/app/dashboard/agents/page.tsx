import { AgentsComingSoon } from "@/components/agents/coming-soon";
import { TeamView } from "@/components/agents/hq/team-view";
import { mockAgents, mockThreads } from "@/components/agents/hq/mock";
import { canPreviewAgents } from "@/lib/agents/preview";
import { renderTime } from "@/lib/time";

export const metadata = { title: "Agents" };

// Prototype: shows sample agents to the team until the outreach API is wired in.
export default async function AgentsPage() {
  if (!(await canPreviewAgents())) return <AgentsComingSoon />;
  const unread = mockThreads(renderTime()).filter((t) => t.unread).length;
  return <TeamView agents={mockAgents()} unread={unread} />;
}
