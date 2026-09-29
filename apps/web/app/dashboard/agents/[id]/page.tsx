import { notFound } from "next/navigation";
import { AgentHQ } from "@/components/agents/hq/agent-hq";
import { mockAgents, mockEvents, mockLeads } from "@/components/agents/hq/mock";
import { renderTime } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/dashboard/agents/[id]">) {
  const { id } = await params;
  return { title: mockAgents().find((a) => a.id === id)?.name ?? "Agent" };
}

// Prototype: one sample agent's map, pipeline and activity until the outreach API is wired in.
export default async function AgentPage({ params }: PageProps<"/dashboard/agents/[id]">) {
  const { id } = await params;
  const agent = mockAgents().find((a) => a.id === id);
  if (!agent) notFound();
  const now = renderTime();
  return <AgentHQ agent={agent} initialLeads={mockLeads(now, agent.id)} initialEvents={agent.id === "scout" ? mockEvents(now) : []} now={now} />;
}
