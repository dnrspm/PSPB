import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, RotateCcw } from "lucide-react";
import { clearSession } from "../../lib/auth";
import type { SessionUser } from "../../lib/auth";
import { ROLE_LABELS } from "../../lib/workflow";

interface HeaderProps {
  user: SessionUser;
  onLogout: () => void;
  onReset: () => void;
}

export function Header({ user, onLogout, onReset }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4">
      <div />
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-800 leading-none">{user.name}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{ROLE_LABELS[user.role]}</div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <button
                onClick={() => { onReset(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Data
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
