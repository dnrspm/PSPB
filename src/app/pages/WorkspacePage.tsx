import { useState, useMemo, useCallback } from "react";
import { MonitoringSummary } from "../components/workspace/MonitoringSummary";
import { FilterBar, type FilterState } from "../components/workspace/FilterBar";
import { WorkspaceTable } from "../components/workspace/WorkspaceTable";
import { getContributions } from "../data/mockWorkspace";
import type { Contribution } from "../types/contribution";
import type { SessionUser } from "../lib/auth";

interface WorkspacePageProps {
  currentUser: SessionUser;
}

export default function WorkspacePage({ currentUser }: WorkspacePageProps) {
  const [contributions, setContributions] = useState<Contribution[]>(getContributions);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    program: "",
    status: "",
    pic: "",
  });

  const refresh = useCallback(() => {
    setContributions(getContributions());
  }, []);

  const programs = useMemo(
    () => [...new Set(contributions.map((c) => c.program))].sort(),
    [contributions]
  );

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return contributions.filter((c) => {
      if (q && ![c.namaMitra, c.program, c.pic ?? ""].some((s) => s.toLowerCase().includes(q)))
        return false;
      if (filters.program && c.program !== filters.program) return false;
      if (filters.status && c.workflowStatus !== filters.status) return false;
      if (filters.pic === "__unassigned" && c.pic) return false;
      if (filters.pic && filters.pic !== "__unassigned" && c.pic !== filters.pic) return false;
      return true;
    });
  }, [contributions, filters]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl space-y-3 p-4">

          {/* Monitoring Summary */}
          <MonitoringSummary contributions={contributions} />

          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} programs={programs} />

          {/* Table */}
          <WorkspaceTable
            contributions={filtered}
            currentUser={currentUser}
            onActionComplete={refresh}
          />

        </div>
      </div>
    </div>
  );
}
