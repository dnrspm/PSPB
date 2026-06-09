import type { Contribution } from "../../types/contribution";
import { WORKFLOW_PHASES } from "../../lib/workflow";

interface MonitoringSummaryProps {
  contributions: Contribution[];
}

interface SummaryCard {
  label: string;
  count: number;
  color: string;
}

export function MonitoringSummary({ contributions }: MonitoringSummaryProps) {
  const byPhase = (states: string[]) =>
    contributions.filter((c) => states.includes(c.workflowStatus)).length;

  const cards: SummaryCard[] = WORKFLOW_PHASES
    .filter((p) => p.label !== "Tidak Dilanjutkan")
    .map((phase) => ({
      label: phase.label,
      count: byPhase(phase.states),
      color: phase.color,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-semibold text-black">Ringkasan Operasional</h2>
        <span className="text-sm text-gray-400">{contributions.length} total kontribusi</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: card.color }} />
              <span className="text-[20px] font-semibold leading-none text-black">{card.count}</span>
            </div>
            <div className="mt-2 text-[12px] font-medium text-gray-500 leading-snug">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
