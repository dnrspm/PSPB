import { useState } from "react";
import { Search, X } from "lucide-react";
import { WORKFLOW_STATE_LABELS } from "../../lib/workflow";
import type { WorkflowState } from "../../types/contribution";
import { INTERNAL_TEAM } from "../../lib/workflow";

export interface FilterState {
  search: string;
  program: string;
  status: WorkflowState | "";
  pic: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  programs: string[];
}

const ALL_STATES: WorkflowState[] = [
  "submission-review", "verifikasi", "audiensi", "review-substansi",
  "draft-pks", "legal-review", "final-pks", "distribusi-persiapan",
  "distribusi-in-progress", "distribusi-on-hold", "distribusi-adendum",
  "distribusi-completed", "published",
];

export function FilterBar({ filters, onChange, programs }: FilterBarProps) {
  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search || filters.program || filters.status || filters.pic;

  const reset = () =>
    onChange({ search: "", program: "", status: "", pic: "" });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama mitra, program, PIC..."
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
        <option value="">Semua Program</option>
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

      <select
        value={filters.pic}
        onChange={(e) => set("pic", e.target.value)}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-400"
      >
        <option value="">Semua PIC</option>
        <option value="__unassigned">Belum Assign</option>
        {INTERNAL_TEAM.map((u) => (
          <option key={u.id} value={u.name}>{u.name}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={reset}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          Reset
        </button>
      )}
    </div>
  );
}
