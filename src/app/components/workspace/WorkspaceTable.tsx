import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Contribution } from "../../types/contribution";
import { StatusBadge } from "./StatusBadge";
import { RowActions } from "./RowActions";
import type { SessionUser } from "../../lib/auth";

type SortKey = "namaMitra" | "program" | "workflowStatus" | "pic" | "lastUpdate";
type SortDir = "asc" | "desc";

interface WorkspaceTableProps {
  contributions: Contribution[];
  currentUser: SessionUser;
  onActionComplete: () => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-300" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays}h lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

const PAGE_SIZE = 10;

export function WorkspaceTable({ contributions, currentUser, onActionComplete }: WorkspaceTableProps) {
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
    if (sortKey === "lastUpdate") {
      const diff = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
      return sortDir === "asc" ? diff : -diff;
    }
    const va = (a[sortKey] as string | null) ?? "";
    const vb = (b[sortKey] as string | null) ?? "";
    const cmp = va.localeCompare(vb, "id");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const headers: { key: SortKey; label: string }[] = [
    { key: "namaMitra", label: "Nama Mitra" },
    { key: "program", label: "Program" },
    { key: "workflowStatus", label: "Status" },
    { key: "pic", label: "PIC" },
    { key: "lastUpdate", label: "Update" },
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="cursor-pointer px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 select-none"
                  onClick={() => handleSort(h.key)}
                >
                  <div className="flex items-center gap-1">
                    {h.label}
                    <SortIcon active={sortKey === h.key} dir={sortDir} />
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                Paket Bantuan
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((c) => {
              const noPic = c.workflowStatus === "submission-review" && !c.pic;
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/workspace/${c.id}`)}
                  className={`group cursor-pointer hover:bg-blue-50/30 transition-colors ${noPic ? "bg-amber-50/20" : ""}`}
                >
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-800 leading-snug">{c.namaMitra}</div>
                    <div className="text-sm text-gray-400 leading-none mt-0.5">{c.wilayah}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{c.program}</td>
                  <td className="px-3 py-2">
                    <StatusBadge state={c.workflowStatus} />
                  </td>
                  <td className="px-3 py-2">
                    {c.pic
                      ? <span className="text-sm text-gray-600">{c.pic}</span>
                      : <span className="text-sm font-medium text-amber-500">Belum assign</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-400 whitespace-nowrap">
                    {formatDate(c.lastUpdate)}
                  </td>
                  <td className="px-3 py-2 max-w-36">
                    <span className="line-clamp-2 text-sm text-gray-500">{c.paketBantuan}</span>
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      contribution={c}
                      currentUser={currentUser}
                      onActionComplete={onActionComplete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2 flex items-center justify-between">
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
