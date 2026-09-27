// How likely a lead is to buy a website, 0–100 (see lib/agents/score.ts).
export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "bg-octa-600 text-white" : score >= 50 ? "bg-fg/[.1] text-fg" : "bg-fg/[.05] text-fg-2";
  return (
    <span
      title="Lead score: how likely this business is to buy a website"
      className={`grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-semibold tabular-nums ${tone}`}
    >
      {score}
    </span>
  );
}
