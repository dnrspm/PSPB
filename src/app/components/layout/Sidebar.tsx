import { NavLink } from "react-router";
import { TableProperties } from "lucide-react";

interface SidebarProps {
}

export function Sidebar({}: SidebarProps) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[#1a4a8a] bg-[#103178]">
      <div className="border-b border-[#1a4a8a] px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">PSPB</div>
            <div className="text-sm text-blue-200">Dasbor Operasional</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3">
        <div className="mb-1 px-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
          Menu
        </div>
        <NavLink
          to="/workspace"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-white/10 font-medium text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <TableProperties className="h-4 w-4" />
          Dasbor Operasional
        </NavLink>
      </nav>

    </aside>
  );
}
