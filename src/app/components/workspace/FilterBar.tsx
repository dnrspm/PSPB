import { Search, X } from "lucide-react";
import { WORKFLOW_STATE_LABELS } from "../../lib/workflow";
import type { WorkflowState } from "../../types/contribution";

export interface FilterState {
  search: string;
  program: string;
  paket: string;
  status: WorkflowState | "";
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  programs: string[];
  /** Paket dukungan yang tersedia; ikut menyempit saat program dipilih */
  pakets: string[];
}

const ALL_STATES: WorkflowState[] = [
  "kontribusi-masuk", "verifikasi-dan-validasi", "audiensi-menunggu-jadwal", "audiensi-terjadwal",
  "audiensi-konfirmasi-lanjut-pks", "perjanjian-draft-pks",
  "perjanjian-pembahasan-pks", "perjanjian-finalisasi-pks",
  "pelaksanaan-penandatangan-kerjasama", "pelaksanaan-persiapan", "pelaksanaan-dalam-proses",
  "pelaksanaan-dalam-evaluasi", "pelaksanaan-penyesuaian-pks",
  "pemantauan-terlaksana", "pemantauan-dokumen-belum-lengkap", "pemantauan-pemanfaatan",
  "selesai", "tidak-dilanjutkan",
];

export function FilterBar({ filters, onChange, programs, pakets }: FilterBarProps) {
  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search || filters.program || filters.paket || filters.status;

  const reset = () =>
    onChange({ search: "", program: "", paket: "", status: "" });

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
        onChange={(e) => onChange({ ...filters, program: e.target.value, paket: "" })}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
      >
        <option value="">Semua Program</option>
        {programs.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.paket}
        onChange={(e) => set("paket", e.target.value)}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
      >
        <option value="">Semua Paket Dukungan</option>
        {pakets.map((p) => (
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
