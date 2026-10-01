import { OctaAgentsMark } from "@octacore/ui/logo";

// Octa Agents' own mark where the app lists its sections, in the text colour like the Lucide icons
// beside it (which is why it takes, and ignores, a stroke width).
export function AgentsIcon({ size = 18, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return <OctaAgentsMark size={size} color="currentColor" className={className} />;
}
