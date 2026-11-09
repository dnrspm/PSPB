import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router";
import type { Contribution, VervalStatus } from "../../types/contribution";
import { StatusBadge } from "./StatusBadge";
import { groupContributions, type ContributionGroup } from "../../lib/contributionGroups";
import { PROGRAM_UNIT_KERJA_DEFAULTS, SUB_TYPE_UNIT_KERJA_MAP } from "../../lib/workflow";
import { VERVAL_STATUS_LABELS, bangunAntrean, formatAngka, ringkasVerval, statusGabungan, type HitungStatus } from "../../lib/verval";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type SortKey = "instansi" | "program" | "workflowStatus" | "paketBantuan" | "lastUpdate" | "pic";

const PIC_EMAILS: Record<string, string> = {
  "Andi Pratama": "andi.pratama@kemdikbud.go.id",
  "Budi Santoso": "budi.santoso@kemdikbud.go.id",
  "Citra Dewi": "citra.dewi@kemdikbud.go.id",
  "Eka Putri": "eka.putri@kemdikbud.go.id",
};

function getPicEmail(c: Contribution): string {
  if (!c.pic) return "-";
  return PIC_EMAILS[c.pic] || c.pic;
}
type SortDir = "asc" | "desc";

export type VervalFilter = "" | VervalStatus;

interface WorkspaceTableProps {
  contributions: Contribution[];
  statusFilter?: string;
  /** Tampilkan kolom status verval dampak (opsi tanpa menu Verval Dampak). */
  tampilVerval?: boolean;
  vervalFilter?: VervalFilter;
}

interface AngkaRealisasi {
  siswa: number;
  guru: number;
  satuanPendidikan: number;
}

const WARNA_VERVAL: Record<VervalStatus, string> = {
  menunggu: "#F59E0B",
  disetujui: "#16A34A",
  "disetujui-revisi": "#0EA5E9",
  "tidak-relevan": "#9CA3AF",
};

/**
 * Hanya jenis dengan angka terbesar yang tampil (dalam kontainer abu-abu, lengkap dengan namanya);
 * jenis lainnya muncul saat kontainer "…" di-hover atau difokus.
 */
function AngkaTerbesar({ angka }: { angka: AngkaRealisasi }) {
  const semua = [
    { nama: "siswa", n: angka.siswa },
    { nama: "guru", n: angka.guru },
    { nama: "satdik", n: angka.satuanPendidikan },
  ];
  // Jumlah sama: urutan siswa, guru, satdik
  const utama = semua.reduce((a, b) => (b.n > a.n ? b : a));
  const lainnya = semua.filter((x) => x !== utama);
  const ringkas = lainnya.map((x) => `${x.nama} ${formatAngka(x.n)}`).join(", ");
  return (
    <span className="flex items-center gap-2 text-sm leading-5">
      <span className="shrink-0 whitespace-nowrap rounded-[2px] bg-gray-100 px-2 py-0.5 text-sm leading-5 tabular-nums text-gray-900">
        {formatAngka(utama.n)} {utama.nama}
      </span>
      {/* Kontainer "…" sebagai penanda ada jenis lain; isinya muncul saat di-hover atau difokus */}
      <span
        className="group relative shrink-0 cursor-default rounded-[2px] bg-gray-100 px-2 py-0.5 text-sm leading-5 text-gray-600 hover:bg-gray-200 focus:bg-gray-200"
        tabIndex={0}
        aria-label={`${lainnya.length} lainnya: ${ringkas}`}
      >
        …
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[2px] border border-gray-200 bg-white px-3 py-2 text-sm leading-5 text-gray-900 shadow-md group-hover:block group-focus:block"
        >
          {lainnya.map((x) => (
            <span key={x.nama} className="flex items-baseline justify-between gap-4 text-sm leading-5">
              <span className="text-sm leading-5 text-gray-600">{x.nama.charAt(0).toUpperCase() + x.nama.slice(1)}</span>
              <span className="text-sm leading-5 tabular-nums">{formatAngka(x.n)}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

/** Sel realisasi: titik warna status verval gabungan, lalu angka realisasi yang diajukan. */
function SelVerval({ h, angka, onOpen }: { h: HitungStatus; angka?: AngkaRealisasi; onOpen: () => void }) {
  const status = statusGabungan(h);
  if (!status) return <span className="whitespace-nowrap text-sm leading-5 text-gray-500">Belum Ada Realisasi</span>;
  const label = VERVAL_STATUS_LABELS[status];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title={`${label}. Buka tab Pelaksanaan untuk memverval`}
      className="flex flex-col items-start gap-1.5 text-left text-sm font-normal text-gray-600"
    >
      {/* Status ditulis dengan titik warna, di atas angka realisasi */}
      <span className="flex items-center gap-1.5 text-sm leading-5 text-gray-700">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: WARNA_VERVAL[status] }} aria-hidden />
        {label}
      </span>
      {angka && <AngkaTerbesar angka={angka} />}
    </button>
  );
}

/** Jumlah realisasi yang diajukan (tanpa yang ditandai tidak relevan); kosong bila belum ada. */
function angkaRealisasi(items: Contribution[]): AngkaRealisasi | undefined {
  const list = bangunAntrean(items).filter((i) => i.verval.status !== "tidak-relevan");
  if (list.length === 0) return undefined;
  const jumlah = (k: keyof AngkaRealisasi) => list.reduce((n, i) => n + (i.dampak[k] || 0), 0);
  return { siswa: jumlah("siswa"), guru: jumlah("guru"), satuanPendidikan: jumlah("satuanPendidikan") };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-300" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

/** Tanggal dan jam dipisah agar bisa tampil di dua baris dan menghemat lebar kolom. */
function formatDate(date: Date): { tanggal: string; jam: string } {
  const d = new Date(date);
  return {
    tanggal: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    jam: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Email dipecah di tanda @ agar domain turun ke baris baru. */
function EmailBertingkat({ email }: { email: string }) {
  const i = email.indexOf("@");
  if (i < 0) return <span className="block text-sm leading-5">{email}</span>;
  return (
    <span className="block text-sm leading-5">
      <span className="block text-sm leading-5">{email.slice(0, i)}</span>
      <span className="block text-sm leading-5">{email.slice(i)}</span>
    </span>
  );
}

const PAGE_SIZE = 10;

export function WorkspaceTable({ contributions, statusFilter, tampilVerval = false, vervalFilter = "" }: WorkspaceTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const menungguVervalGrup = (g: ContributionGroup) =>
    tampilVerval && statusGabungan(ringkasVerval(g.items).realisasi) === "menunggu";

  const sorted = groupContributions(
    contributions.filter(c => c.pic || c.workflowStatus === "kontribusi-masuk")
  ).filter((g) => !statusFilter || g.workflowStatus === statusFilter)
  .filter((g) => {
    if (!tampilVerval || !vervalFilter) return true;
    const r = ringkasVerval(g.items);
    // Cocok bila ada realisasi dengan status verval yang dipilih
    const jumlah: Record<VervalStatus, number> = {
      menunggu: r.realisasi.menunggu,
      disetujui: r.realisasi.disetujui,
      "disetujui-revisi": r.realisasi.revisi,
      "tidak-relevan": r.realisasi.tidakRelevan,
    };
    return jumlah[vervalFilter] > 0;
  })
  .sort((a, b) => {
    // Baris bergaris selalu di atas: merah (kontribusi masuk), lalu kuning (menunggu verval)
    const prioritas = (g: ContributionGroup) =>
      g.workflowStatus === "kontribusi-masuk" ? 2 : menungguVervalGrup(g) ? 1 : 0;
    const aPrio = prioritas(a);
    const bPrio = prioritas(b);
    if (aPrio !== bPrio) return bPrio - aPrio;

    if (sortKey === "lastUpdate") {
      const diff = a.lastUpdate.getTime() - b.lastUpdate.getTime();
      return sortDir === "asc" ? diff : -diff;
    }
    const va = (a[sortKey] as string | null) ?? "";
    const vb = (b[sortKey] as string | null) ?? "";
    const cmp = va.localeCompare(vb, "id");
    return sortDir === "asc" ? cmp : -cmp;
  });

  function getUnitKerja(c: Contribution): string {
    for (let i = c.aktivitas.length - 1; i >= 0; i--) {
      const a = c.aktivitas[i];
      if (a.fields) {
        for (const [label, value] of Object.entries(a.fields)) {
          if (label.toLowerCase().includes("unit kerja")) {
            return value.split(", ").map(part => part.split(" (")[0]).join(", ");
          }
        }
      }
    }
    const defaultUnit = PROGRAM_UNIT_KERJA_DEFAULTS[c.program];
    if (defaultUnit) return defaultUnit;
    if (c.program === "Kebutuhan Pendidikan Lainnya" && c.paketBantuan) {
      return SUB_TYPE_UNIT_KERJA_MAP[c.paketBantuan] || "-";
    }
    return "-";
  }

  function getGroupUnitKerja(g: ContributionGroup): string {
    const units = [...new Set(g.items.map(getUnitKerja).filter((u) => u && u !== "-"))];
    return units.length > 0 ? units.join(", ") : "-";
  }

  function getGroupPicEmails(g: ContributionGroup): string[] {
    return [...new Set(g.items.map(getPicEmail).filter((e) => e && e !== "-"))];
  }

  const headers: { key: SortKey | null; label: string }[] = [
    { key: "instansi", label: "Nama Instansi" },
    { key: "program", label: "Paket Dukungan" },
    { key: null, label: "Unit Kerja" },
    { key: "workflowStatus", label: "Status Workflow" },
    ...(tampilVerval ? [{ key: null, label: "Status Realisasi" }] : []),
    { key: "lastUpdate", label: "Last Update" },
    { key: "pic", label: "PIC" },
    { key: null, label: "" },
  ];

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-10 text-center">
        <p className="text-sm text-gray-400">Tidak ada kontribusi yang sesuai filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead className="bg-[#F1F1F1]">
            <tr className="border-b border-gray-200">
              {headers.map((h) => (
                <th
                  key={h.label}
                  className={`bg-[#F1F1F1] px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232] ${h.key ? "cursor-pointer hover:text-gray-600 select-none" : ""} ${!h.label ? "w-8" : ""}`}
                  onClick={() => h.key && handleSort(h.key)}
                >
                  <div className="flex items-center gap-1">
                    {h.label}
                    {h.key && <SortIcon active={sortKey === h.key} dir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((g) => {
              const isNew = g.workflowStatus === "kontribusi-masuk";
              // Garis kuning untuk baris yang masih menunggu verval realisasi
              const menungguVerval = menungguVervalGrup(g);
              const garis = isNew
                ? "border-l-4 border-l-red-500"
                : menungguVerval
                  ? "border-l-4 border-l-amber-400"
                  : "";
              return (
                <tr
                  key={g.key}
                  onClick={() => navigate(`/workspace/${g.primary.id}`)}
                  className={`cursor-pointer transition-colors hover:bg-gray-100 ${garis}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800 leading-snug">{g.instansi}</div>
                  </td>
                  <td className="px-4 py-3">
                    {g.items.map((c, i) => {
                      const kata = c.program.split(" ");
                      const akhir = kata.pop();
                      const ikon = i === g.items.length - 1 && g.items.length > 1;
                      return (
                        <div key={c.id} className="text-sm text-gray-800 leading-snug">
                          {kata.length > 0 && `${kata.join(" ")} `}
                          {/* Ikon menempel di kata terakhir agar tidak turun baris sendirian */}
                          <span className="whitespace-nowrap text-sm leading-snug">
                            {akhir}
                            {ikon && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 inline-flex align-text-bottom text-gray-400 hover:text-gray-600" aria-label="Contoh demo multiple kontribusi">
                                    <Info className="h-3.5 w-3.5" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-gray-900 text-white" arrowClassName="bg-gray-900 fill-gray-900">Contoh untuk demo flow multiple kontribusi</TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getGroupUnitKerja(g)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge state={g.workflowStatus} />
                  </td>
                  {tampilVerval && (() => {
                    const r = ringkasVerval(g.items);
                    // Buka kontribusi yang punya data menunggu verval lebih dulu
                    const target = g.items.find((c) => ringkasVerval([c]).menunggu > 0) || g.primary;
                    const buka = () => navigate(`/workspace/${target.id}`, { state: { tab: "pelaksanaan" } });
                    return (
                      <td className="px-4 py-3 align-top"><SelVerval h={r.realisasi} angka={angkaRealisasi(g.items)} onOpen={buka} /></td>
                    );
                  })()}
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {formatDate(g.lastUpdate).tanggal}
                    <br />
                    {formatDate(g.lastUpdate).jam}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getGroupPicEmails(g).length > 0
                      ? getGroupPicEmails(g).map((e) => (
                          <div key={e} className="[&:not(:first-child)]:mt-1">
                            <EmailBertingkat email={e} />
                          </div>
                        ))
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} dari {sorted.length} kontribusi
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="rounded border border-gray-200 p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[28px] rounded border px-1.5 py-0.5 text-sm ${
                p === safePage
                  ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="rounded border border-gray-200 p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
