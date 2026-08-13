import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { ChevronDown, ChevronRight, LogOut, UserRound, LayoutDashboard, Home } from "lucide-react";
import { clearMitraSession, getMitraSession, getMitraContributionById } from "../../lib/mitra";
import { getMitraProfile } from "../../lib/mitra";
import LogoKemitraanPendidikan from "../LogoKemitraanPendidikan";

function Breadcrumb() {
  const location = useLocation();
  const session = getMitraSession();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments[1] === "dashboard" && segments.length <= 2) {
    return null;
  }

  const items: { label: string; to?: string }[] = [
    { label: "Dashboard", to: "/mitra/dashboard" },
  ];

  if (segments[1] === "profil") {
    items.push({ label: "Profil Mitra" });
  } else if (segments[1] === "kontribusi" && segments.length >= 3) {
    const contribution = session
      ? getMitraContributionById(session.email, segments[2])
      : null;
    items.push({ label: contribution?.program || "Detail Kontribusi" });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        if (isLast) {
          return (
            <span
              key={idx}
              className="flex items-center gap-1.5 font-medium text-[var(--text-default)]"
            >
              {idx === 0 && <Home className="h-4 w-4 text-[var(--text-subdued)]" />}
              {item.label}
            </span>
          );
        }
        return (
          <span key={idx} className="flex items-center gap-1.5">
            {item.to ? (
              <Link
                to={item.to}
                className="flex items-center gap-1.5 text-[var(--text-subdued)] transition-colors hover:text-[var(--text-default)]"
              >
                {idx === 0 && <Home className="h-4 w-4" />}
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--text-subdued)]">{item.label}</span>
            )}
            <ChevronRight className="h-4 w-4 text-[var(--text-subdued)]" />
          </span>
        );
      })}
    </nav>
  );
}

export default function MitraLayout() {
  const navigate = useNavigate();
  const session = getMitraSession();
  const profile = session ? getMitraProfile(session.email) : null;
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

  const displayName = profile?.nama || session?.nama || "Mitra";

  return (
    <div className="min-h-screen bg-[var(--gray-0)]">
      <header className="sticky top-0 z-40 border-b border-[var(--gray-10)] bg-[var(--surface-default)]">
        <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4" ref={ref}>
          <Link to="/" className="flex items-center">
            <LogoKemitraanPendidikan withWordmark={false} className="h-[24px] w-[137px]" />
          </Link>

          <div>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--surface-subdued)]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-50)] text-sm font-semibold text-[var(--primary)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:block">
                {displayName}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[var(--text-subdued)] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-[var(--border-light)] bg-white py-1 shadow-lg">
                  <Link
                    to="/mitra/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-default)] hover:bg-[var(--surface-subdued)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/mitra/profil"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-default)] hover:bg-[var(--surface-subdued)]"
                  >
                    <UserRound className="h-4 w-4" />
                    Profil
                  </Link>
                  <div className="my-1 border-t border-[var(--border-light)]" />
                  <button
                    onClick={() => {
                      clearMitraSession();
                      setOpen(false);
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--red-70)] hover:bg-[var(--red-0)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumb />
        <Outlet />
      </main>
    </div>
  );
}
