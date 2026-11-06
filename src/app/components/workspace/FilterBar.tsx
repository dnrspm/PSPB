import { Search, X } from "lucide-react";
import { WORKFLOW_STATE_LABELS } from "../../lib/workflow";
import type { VervalStatus, WorkflowState } from "../../types/contribution";
import { VERVAL_STATUS_LABELS } from "../../lib/verval";

export interface FilterState {
  search: string;
  program: string;
  status: WorkflowState | "";
  /** Filter status verval dampak; hanya dipakai pada opsi tanpa menu Verval Dampak. */
  verval?: "" | VervalStatus;
}

interface FilterBarProps {
  tampilVerval?: boolean;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  programs: string[];
}

const ALL_STATES: WorkflowState[] = [
  "kontribusi-masuk", "verifikasi-dan-validasi", "audiensi-menunggu-jadwal", "audiensi-terjadwal",
  "audiensi-konfirmasi-lanjut-pks", "perjanjian-draft-pks",
  "perjanjian-pembahasan-pks", "perjanjian-finalisasi-pks",
  "pelaksanaan-persiapan", "pelaksanaan-dalam-proses",
  "selesai", "tidak-dilanjutkan",
];

export function FilterBar({ filters, onChange, programs, tampilVerval = false }: FilterBarProps) {
  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search || filters.program || filters.status || filters.verval;

  const reset = () =>
    onChange({ search: "", program: "", status: "", verval: "" });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama mitra, program..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </div>

      <select
        value={filters.program}
        onChange={(e) => set("program", e.target.value)}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
      >
        <option value="">Semua Paket Dukungan</option>
        {programs.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value as WorkflowState | "")}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
      >
        <option value="">Semua Status</option>
        {ALL_STATES.map((s) => (
          <option key={s} value={s}>{WORKFLOW_STATE_LABELS[s]}</option>
        ))}
      </select>

      {tampilVerval && (
        <select
          value={filters.verval || ""}
          onChange={(e) => onChange({ ...filters, verval: e.target.value as FilterState["verval"] })}
          aria-label="Filter status verval dampak"
          className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Semua Status Verval</option>
          {(Object.keys(VERVAL_STATUS_LABELS) as VervalStatus[]).map((s) => (
            <option key={s} value={s}>{VERVAL_STATUS_LABELS[s]}</option>
          ))}
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={reset}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          Atur Ulang
        </button>
      )}
    </div>
  );
}
