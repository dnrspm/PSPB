import { useState, useMemo } from "react";
import { MonitoringSummary } from "../components/workspace/MonitoringSummary";
import { FilterBar, type FilterState } from "../components/workspace/FilterBar";
import { WorkspaceTable } from "../components/workspace/WorkspaceTable";
import { getContributions } from "../data/mockWorkspace";
import type { Contribution } from "../types/contribution";

export default function WorkspacePage() {
  const [contributions] = useState<Contribution[]>(getContributions);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    program: "",
    paket: "",
    status: "",
  });

  const programs = useMemo(
    () => [...new Set(contributions.map((c) => c.program))].sort(),
    [contributions]
  );

  // Daftar paket menyesuaikan program yang sedang dipilih
  const pakets = useMemo(
    () =>
      [
        ...new Set(
          contributions
            .filter((c) => !filters.program || c.program === filters.program)
            .map((c) => c.paketBantuan)
            .filter(Boolean)
        ),
      ].sort(),
    [contributions, filters.program]
  );

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return contributions.filter((c) => {
      if (q && ![c.namaMitra, c.program, c.paketBantuan].some((s) => (s || "").toLowerCase().includes(q)))
        return false;
      if (filters.program && c.program !== filters.program) return false;
      if (filters.paket && c.paketBantuan !== filters.paket) return false;
      if (filters.status && c.workflowStatus !== filters.status) return false;
      return true;
    });
  }, [contributions, filters]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-screen-2xl space-y-6 p-6">

          {/* Monitoring Summary */}
          <MonitoringSummary contributions={contributions} />

          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} programs={programs} pakets={pakets} />

          {/* Table */}
          <WorkspaceTable contributions={filtered} />

      </div>
    </div>
  );
}
