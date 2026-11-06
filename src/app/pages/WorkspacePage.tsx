import { useState, useMemo } from "react";
import { MonitoringSummary } from "../components/workspace/MonitoringSummary";
import { FilterBar, type FilterState } from "../components/workspace/FilterBar";
import { WorkspaceTable } from "../components/workspace/WorkspaceTable";
import { getContributions } from "../data/mockWorkspace";
import { useVervalLayout } from "../lib/vervalLayout";
import type { Contribution } from "../types/contribution";

export default function WorkspacePage() {
  const tampilVerval = useVervalLayout() === "tabel";
  const [contributions] = useState<Contribution[]>(getContributions);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    program: "",
    status: "",
  });

  const programs = useMemo(
    () => [...new Set(contributions.map((c) => c.program))].sort(),
    [contributions]
  );

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return contributions.filter((c) => {
      if (q && ![c.namaMitra, c.program, c.paketBantuan].some((s) => (s || "").toLowerCase().includes(q)))
        return false;
      if (filters.program && c.program !== filters.program) return false;
      return true;
    });
  }, [contributions, filters]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-screen-2xl space-y-6 p-6">

          {/* Monitoring Summary */}
          <MonitoringSummary contributions={contributions} tampilVerval={tampilVerval} />

          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} programs={programs} tampilVerval={tampilVerval} />

          {/* Table */}
          <WorkspaceTable contributions={filtered} statusFilter={filters.status} tampilVerval={tampilVerval} vervalFilter={filters.verval} />

      </div>
    </div>
  );
}
