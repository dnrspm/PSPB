import { NavLink } from "react-router";
import { LayoutDashboard, TableProperties } from "lucide-react";

interface SidebarProps {
}

export function Sidebar({}: SidebarProps) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">PSPB</div>
            <div className="text-sm text-gray-400">Operational Workspace</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3">
        <div className="mb-1 px-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Menu
        </div>
        <NavLink
          to="/workspace"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`
          }
        >
          <TableProperties className="h-4 w-4" />
          Workspace
        </NavLink>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          Portal Publik
        </NavLink>
      </nav>

    </aside>
  );
}
