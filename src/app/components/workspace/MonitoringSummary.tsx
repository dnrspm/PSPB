import type { Contribution } from "../../types/contribution";

interface MonitoringSummaryProps {
  contributions: Contribution[];
}

interface SummaryCard {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

export function MonitoringSummary({ contributions }: MonitoringSummaryProps) {
  const byState = (states: string[]) =>
    contributions.filter((c) => states.includes(c.workflowStatus)).length;

  const cards: SummaryCard[] = [
    {
      label: "Submission & Verifikasi",
      count: byState(["submission-review", "verifikasi"]),
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200",
    },
    {
      label: "Audiensi & Review",
      count: byState(["audiensi", "review-substansi"]),
      color: "text-purple-700",
      bgColor: "bg-purple-50 border-purple-200",
    },
    {
      label: "Proses PKS",
      count: byState(["draft-pks", "legal-review", "final-pks"]),
      color: "text-orange-700",
      bgColor: "bg-orange-50 border-orange-200",
    },
    {
      label: "Distribusi Aktif",
      count: byState(["distribusi-persiapan", "distribusi-in-progress", "distribusi-adendum"]),
      color: "text-teal-700",
      bgColor: "bg-teal-50 border-teal-200",
    },
    {
      label: "Distribusi On Hold",
      count: byState(["distribusi-on-hold"]),
      color: "text-red-700",
      bgColor: "bg-red-50 border-red-200",
    },
    {
      label: "Selesai & Published",
      count: byState(["distribusi-completed", "published"]),
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200",
    },
  ];

  const noPic = contributions.filter(
    (c) => c.workflowStatus === "submission-review" && !c.pic
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-semibold text-black">Ringkasan Operasional</h2>
        <span className="text-sm text-gray-400">{contributions.length} total kontribusi</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-md border px-2.5 py-2 ${card.bgColor}`}
          >
            <div className={`text-[20px] font-bold leading-none ${card.color}`}>{card.count}</div>
            <div className="mt-1.5 text-[12px] text-gray-500 leading-tight">{card.label}</div>
          </div>
        ))}
      </div>
      {noPic > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>{noPic}</strong> kontribusi di Submission Review belum memiliki PIC
          </span>
        </div>
      )}
    </div>
  );
}
