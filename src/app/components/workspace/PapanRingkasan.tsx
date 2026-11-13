import { useState } from "react";
import type { Contribution } from "../../types/contribution";
import { groupContributions } from "../../lib/contributionGroups";
import { WORKFLOW_PHASES } from "../../lib/workflow";
import { bangunAntrean } from "../../lib/verval";
import { PratinjauDasborPublik, useJumlahBelumDipublikasikan } from "./PratinjauDasborPublik";

export type Tab = "operasional" | "verval" | "dampak";

interface PapanRingkasanProps {
  contributions: Contribution[];
  /** Dipanggil saat tab berganti, agar filter tabel bisa menyesuaikan. */
  onTabChange?: (tab: Tab) => void;
}

/** Kartu angka seperti ringkasan opsi 1: titik warna, angka, lalu label. */
function KartuAngka({ label, jumlah, warna }: { label: string; jumlah: number; warna: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: warna }} aria-hidden />
        <span className="text-[20px] font-semibold leading-none tabular-nums text-black">{jumlah}</span>
      </div>
      <div className="mt-2 text-[12px] font-medium leading-snug text-gray-500">{label}</div>
    </div>
  );
}

/**
 * Opsi tanpa menu: ringkasan di atas tabel dibagi dua tab agar tidak menumpuk.
 * "Status Workflow" berisi card tahapan workflow, "Tinjau Realisasi" berisi status tinjauan;
 * "Publikasi Dampak" berisi angka dampak untuk ditinjau dan dipublikasikan.
 */
export function PapanRingkasan({ contributions, onTabChange }: PapanRingkasanProps) {
  const [tab, setTab] = useState<Tab>("operasional");
  const belumDipublikasikan = useJumlahBelumDipublikasikan();
  const groups = groupContributions(contributions);
  const fase = WORKFLOW_PHASES.filter((p) => p.label !== "Tidak Dilanjutkan").map((p) => ({
    label: p.label,
    color: p.color,
    count: groups.filter((g) => p.states.includes(g.workflowStatus)).length,
  }));

  const kontribusiMasuk = groups.filter((g) => g.workflowStatus === "kontribusi-masuk").length;

  const antrean = bangunAntrean(contributions);
  const hitung = (s: string) => antrean.filter((i) => i.verval.status === s).length;
  const menunggu = hitung("menunggu");
  const statusVerval = [
    { label: "Perlu Ditinjau", n: menunggu, warna: "#F59E0B" },
    { label: "Terverifikasi", n: hitung("disetujui"), warna: "#16A34A" },
    { label: "Terverifikasi dengan Revisi", n: hitung("disetujui-revisi"), warna: "#0EA5E9" },
    { label: "Tidak Valid", n: hitung("tidak-relevan"), warna: "#9CA3AF" },
  ];

  const tabs: { key: Tab; label: string; badge?: number; badgeTitle?: string }[] = [
    { key: "operasional", label: "Status Workflow", badge: kontribusiMasuk, badgeTitle: "Kontribusi masuk" },
    { key: "verval", label: "Tinjau Realisasi", badge: menunggu, badgeTitle: "Realisasi perlu ditinjau" },
    { key: "dampak", label: "Publikasi Dampak", badge: belumDipublikasikan, badgeTitle: "Angka belum dipublikasikan" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[24px] font-semibold leading-8 text-gray-900">Alur Kontribusi</h2>
        <span className="text-[13px] leading-5 text-gray-600">{groups.length} total kontribusi</span>
      </div>

      <div role="tablist" aria-label="Ringkasan" className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              onTabChange?.(t.key);
            }}
            className={`relative flex items-center gap-2 px-4 py-2 text-[15px] font-semibold leading-[22px] transition-colors ${
              tab === t.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span
                title={t.badgeTitle}
                className="rounded-full bg-red-600 px-2 text-[12px] font-semibold leading-5 tabular-nums text-white"
              >
                {t.badge}
              </span>
            ) : null}
            {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      {tab === "operasional" ? (
        <div role="tabpanel" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {fase.map((f) => (
            <KartuAngka key={f.label} label={f.label} jumlah={f.count} warna={f.color} />
          ))}
        </div>
      ) : tab === "verval" ? (
        <div role="tabpanel" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statusVerval.map((v) => (
            <KartuAngka key={v.label} label={v.label} jumlah={v.n} warna={v.warna} />
          ))}
        </div>
      ) : (
        <div role="tabpanel">
          <PratinjauDasborPublik bisaDilipat={false} tanpaJudul kartuTerpisah />
        </div>
      )}
    </div>
  );
}
