import { useState } from "react";
import type { Contribution } from "../../types/contribution";
import { groupContributions } from "../../lib/contributionGroups";
import { WORKFLOW_PHASES } from "../../lib/workflow";
import { bangunAntrean } from "../../lib/verval";
import { PratinjauDasborPublik, useJumlahBelumDipublikasikan } from "./PratinjauDasborPublik";

type Tab = "operasional" | "dampak";

interface PapanRingkasanProps {
  contributions: Contribution[];
  /** Tabel sedang menampilkan hanya yang menunggu verval. */
  filterMenunggu: boolean;
  onToggleMenunggu: () => void;
}

/**
 * Opsi tanpa menu: ringkasan di atas tabel dibagi dua tab agar tidak menumpuk.
 * "Operasional" berisi card Status workflow dan Verval realisasi;
 * "Dasbor Dampak" berisi angka dampak untuk ditinjau dan dipublikasikan.
 */
export function PapanRingkasan({ contributions, filterMenunggu, onToggleMenunggu }: PapanRingkasanProps) {
  const [tab, setTab] = useState<Tab>("operasional");
  const belumDipublikasikan = useJumlahBelumDipublikasikan();
  const groups = groupContributions(contributions);
  const fase = WORKFLOW_PHASES.filter((p) => p.label !== "Tidak Dilanjutkan").map((p) => ({
    label: p.label,
    color: p.color,
    count: groups.filter((g) => p.states.includes(g.workflowStatus)).length,
  }));

  const antrean = bangunAntrean(contributions);
  const hitung = (s: string) => antrean.filter((i) => i.verval.status === s).length;
  const menunggu = hitung("menunggu");
  const statusVerval = [
    { label: "Menunggu verval", n: menunggu, dot: "bg-amber-500", menunggu: true },
    { label: "Disetujui", n: hitung("disetujui"), dot: "bg-green-600", menunggu: false },
    { label: "Disetujui dengan revisi", n: hitung("disetujui-revisi"), dot: "bg-sky-500", menunggu: false },
    { label: "Tidak relevan", n: hitung("tidak-relevan"), dot: "bg-gray-400", menunggu: false },
  ];

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "operasional", label: "Operasional" },
    { key: "dampak", label: "Dasbor Dampak", badge: belumDipublikasikan },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[24px] font-semibold leading-8 text-gray-900">Ringkasan Operasional</h2>
        <span className="text-[13px] leading-5 text-gray-600">{groups.length} total kontribusi</span>
      </div>

      <div role="tablist" aria-label="Ringkasan" className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2 text-[15px] font-semibold leading-[22px] transition-colors ${
              tab === t.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span
                title="Angka belum dipublikasikan"
                className="rounded-full bg-amber-100 px-2 text-[12px] font-semibold leading-5 tabular-nums text-amber-800"
              >
                {t.badge}
              </span>
            ) : null}
            {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      {tab === "operasional" ? (
        <div role="tabpanel" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section aria-label="Status workflow" className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <h3 className="border-b border-gray-100 px-4 py-3 text-[15px] font-semibold leading-[22px] text-gray-900">Status workflow</h3>
            <dl className="grid grid-cols-3 gap-y-1 py-2 sm:grid-cols-5 sm:divide-x sm:divide-gray-100">
              {fase.map((f) => (
                <div key={f.label} className="px-3 py-1.5">
                  <dt className="flex min-h-8 items-start gap-1.5 whitespace-nowrap text-[12px] leading-4 text-gray-600">
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: f.color }} aria-hidden />
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 text-[24px] font-semibold leading-8 tabular-nums text-gray-900">{f.count}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-label="Verval realisasi"
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2">
              <h3 className="text-[15px] font-semibold leading-[22px] text-gray-900">Verval realisasi</h3>
              {menunggu > 0 && (
                <button
                  type="button"
                  onClick={onToggleMenunggu}
                  aria-pressed={filterMenunggu}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-[13px] font-semibold leading-5 text-gray-700 hover:bg-gray-50 aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:text-blue-700"
                >
                  {filterMenunggu ? "Tampilkan semua" : "Lihat yang menunggu"}
                </button>
              )}
            </header>
            <dl className="grid grid-cols-2 gap-y-1 py-2 sm:grid-cols-4 sm:divide-x sm:divide-gray-100">
              {statusVerval.map((v) => (
                <div key={v.label} className="px-3 py-1.5">
                  <dt className="flex min-h-8 items-start gap-1.5 text-[12px] leading-4 text-gray-600">
                    <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${v.dot}`} aria-hidden />
                    {v.label}
                  </dt>
                  <dd className={`mt-0.5 text-[24px] font-semibold leading-8 tabular-nums ${v.menunggu && v.n > 0 ? "text-amber-700" : "text-gray-900"}`}>{v.n}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      ) : (
        <div role="tabpanel">
          <PratinjauDasborPublik bisaDilipat={false} />
        </div>
      )}
    </div>
  );
}
