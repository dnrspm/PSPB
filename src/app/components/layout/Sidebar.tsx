import { NavLink } from "react-router";
import { ClipboardCheck, TableProperties, Users } from "lucide-react";
import { bangunAntrean, hitungMenunggu } from "../../lib/verval";
import { useContributionsSync } from "../../lib/useContributions";
import { punyaMenuVerval, useVervalLayout } from "../../lib/vervalLayout";

interface SidebarProps {
}

export function Sidebar({}: SidebarProps) {
  useContributionsSync();
  const adaMenuVerval = punyaMenuVerval(useVervalLayout());
  const menunggu = hitungMenunggu(bangunAntrean()).total;
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
          end
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
        {adaMenuVerval && (
          <NavLink
            to="/workspace/verval-dampak"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 font-medium text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <ClipboardCheck className="h-4 w-4" />
            <span className="flex-1">Verval Dampak</span>
            {menunggu > 0 && (
              <span
                title="Menunggu verval"
                className="rounded-full bg-amber-400 px-1.5 text-xs font-semibold leading-5 text-[#103178]"
              >
                {menunggu}
              </span>
            )}
          </NavLink>
        )}
        <NavLink
          to="/workspace/pemangku-kepentingan"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-white/10 font-medium text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Users className="h-4 w-4" />
          Pemangku Kepentingan
        </NavLink>
      </nav>

    </aside>
  );
}
