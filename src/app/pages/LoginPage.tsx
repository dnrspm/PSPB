import { useState } from "react";
import { MOCK_USERS, setSession } from "../lib/auth";
import { ROLE_LABELS } from "../lib/workflow";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = MOCK_USERS.find((u) => u.id === selectedUserId);
    if (!user) {
      setError("Pilih akun untuk masuk");
      return;
    }
    setSession(user);
    onLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <h1 className="text-sm font-semibold text-gray-800">PSPB Workspace</h1>
          <p className="mt-1 text-center text-sm text-gray-400">
            Dashboard Manajemen Operasional Internal
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Masuk sebagai
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setError("");
              }}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            >
              <option value="">Pilih akun...</option>
              {MOCK_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {ROLE_LABELS[u.role]}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <button
            onClick={handleLogin}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Masuk ke Workspace
          </button>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
          <p className="font-medium text-gray-600 mb-1">Akun tersedia:</p>
          <ul className="space-y-0.5">
            <li>• Biro Perencanaan — akses penuh</li>
            <li>• Pusat/Direktorat/Eselon II — review &amp; pelaksanaan</li>
            <li>• Biro Hukum — review hukum &amp; finalisasi PKS</li>
            <li>• Pusdatin — lihat saja</li>
            <li>• Bidang Kemitraan — lihat saja</li>
            <li>• Sekretaris Jenderal — lihat saja</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
