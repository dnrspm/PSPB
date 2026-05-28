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
      label: "Pengajuan & Verifikasi",
      count: byState(["submission-review", "verifikasi"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
    },
    {
      label: "Audiensi & Tinjauan",
      count: byState(["audiensi", "review-substansi"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
    },
    {
      label: "Proses PKS",
      count: byState(["draft-pks", "legal-review", "final-pks"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
    },
    {
      label: "Distribusi Aktif",
      count: byState(["distribusi-persiapan", "distribusi-in-progress", "distribusi-adendum"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
    },
    {
      label: "Distribusi Ditunda",
      count: byState(["distribusi-on-hold"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
    },
    {
      label: "Selesai & Dipublikasikan",
      count: byState(["distribusi-completed", "published"]),
      color: "text-gray-900",
      bgColor: "bg-white border-gray-200",
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
            className={`rounded-lg border px-3 py-3 ${card.bgColor}`}
          >
            <div className={`text-[20px] font-semibold leading-none ${card.color}`}>{card.count}</div>
            <div className="mt-2 text-[12px] font-medium text-gray-500 leading-snug">{card.label}</div>
          </div>
        ))}
      </div>
      {noPic > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>{noPic}</strong> kontribusi dalam tahap Pengajuan belum memiliki PIC
          </span>
        </div>
      )}
    </div>
  );
}
