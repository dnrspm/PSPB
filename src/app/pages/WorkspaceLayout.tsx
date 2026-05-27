import { useState, useCallback } from "react";
import { Outlet, Navigate, useNavigate } from "react-router";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { getSession } from "../lib/auth";
import { resetContributions } from "../data/mockWorkspace";
import type { SessionUser } from "../lib/auth";

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const [user] = useState<SessionUser | null>(getSession);
  const [resetKey, setResetKey] = useState(0);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => navigate("/login");

  const handleReset = useCallback(() => {
    resetContributions();
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onLogout={handleLogout} onReset={handleReset} />
        <main className="flex-1 overflow-hidden">
          <Outlet key={resetKey} context={{ currentUser: user }} />
        </main>
      </div>
    </div>
  );
}
