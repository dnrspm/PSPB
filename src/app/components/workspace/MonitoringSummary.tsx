import type { Contribution } from "../../types/contribution";

interface MonitoringSummaryProps {
  contributions: Contribution[];
}

interface SummaryCard {
  label: string;
  count: number;
  color: string;
}

export function MonitoringSummary({ contributions }: MonitoringSummaryProps) {
  const byState = (states: string[]) =>
    contributions.filter((c) => states.includes(c.workflowStatus)).length;

  const cards: SummaryCard[] = [
    {
      label: "Pengajuan",
      count: byState(["submission-review"]),
      color: "#C82236",
    },
    {
      label: "Perencanaan",
      count: byState(["verifikasi", "audiensi", "review-substansi", "draft-pks", "legal-review", "final-pks"]),
      color: "#FFC453",
    },
    {
      label: "Distribusi",
      count: byState(["distribusi-persiapan", "distribusi-in-progress", "distribusi-on-hold", "distribusi-adendum", "distribusi-completed"]),
      color: "#0B5FEF",
    },
    {
      label: "Dipublikasikan",
      count: byState(["published"]),
      color: "#35825A",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-semibold text-black">Ringkasan Operasional</h2>
        <span className="text-sm text-gray-400">{contributions.length} total kontribusi</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
