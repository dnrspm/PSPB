import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import type { Contribution } from "../../types/contribution";
import { StatusBadge } from "./StatusBadge";
import { PROGRAM_UNIT_KERJA_DEFAULTS, SUB_TYPE_UNIT_KERJA_MAP } from "../../lib/workflow";

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

interface WorkspaceTableProps {
  contributions: Contribution[];
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-300" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const formattedTime = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${formattedDate}, ${formattedTime}`;
}

const PAGE_SIZE = 10;

export function WorkspaceTable({ contributions }: WorkspaceTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const sorted = [...contributions].sort((a, b) => {
    const aMasuk = a.workflowStatus === "kontribusi-masuk" ? 1 : 0;
    const bMasuk = b.workflowStatus === "kontribusi-masuk" ? 1 : 0;
    if (aMasuk !== bMasuk) return bMasuk - aMasuk;

    if (sortKey === "lastUpdate") {
      const diff = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
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

  const headers: { key: SortKey | null; label: string }[] = [
    { key: "instansi", label: "Nama Instansi" },
    { key: "program", label: "Paket Dukungan" },
    { key: null, label: "Unit Kerja" },
    { key: "workflowStatus", label: "Status Workflow" },
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
            {paginated.map((c) => {
              const isNew = c.workflowStatus === "kontribusi-masuk";
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/workspace/${c.id}`)}
                  className={`cursor-pointer transition-colors ${isNew ? "border-l-4 border-l-red-500 hover:bg-gray-100" : "hover:bg-gray-100"}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800 leading-snug">{c.instansi}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{c.program}</div>
                    <div className="text-xs text-gray-400 leading-snug mt-0.5">{c.paketBantuan}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getUnitKerja(c)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge state={c.workflowStatus} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {formatDate(c.lastUpdate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getPicEmail(c)}
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
