import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Info,
  KeyRound,
} from "lucide-react";
import { loginMitra, getMitraSession } from "../../lib/mitra";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

function DemoAccountList() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-[var(--surface-subdued)] p-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 font-medium text-[var(--text-subdued)]"
      >
        <Info className="h-4 w-4 text-[var(--primary)]" />
        Akun demo tersedia
        <span className="ml-auto text-xs text-[var(--text-subdued)]">{open ? "Tutup" : "Lihat"}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1 text-xs text-[var(--text-subdued)]">
          <li>reza.firmansyah@telkom.co.id</li>
          <li>sri.wahyuni@ypn.or.id</li>
          <li>hendra.kusuma@bri.co.id</li>
          <li>aditya.putra@gojek.com</li>
          <li>dll. (lihat data kontribusi mock)</li>
          <li className="mt-1 font-medium text-[var(--text-default)]">
            Semua kata sandi demo: <code className="rounded bg-white px-1 py-0.5">Mitra@123</code>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function MitraLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [showLupa, setShowLupa] = useState(false);

  const isLocked = Date.now() < lockUntil;
  const lockRemaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));

  // Jika sudah login, arahkan langsung ke journey kontribusi (US01)
  useEffect(() => {
    if (getMitraSession()) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || "/mitra/dashboard", { replace: true });
    }
  }, [location.state, navigate]);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = "Email wajib diisi.";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Masukkan format email yang valid.";
    }
    if (!password) {
      errs.password = "Kata sandi wajib diisi.";
    }
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!validate()) return;

    setLoading(true);
    setError("");
    // Simulasi latensi layanan autentikasi
    setTimeout(() => {
      const result = loginMitra(email, password);
      setLoading(false);
      if (!result.ok) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLockUntil(Date.now() + LOCK_SECONDS * 1000);
          setFailedAttempts(0);
          setError(
            `Terlalu banyak percobaan login gagal. Coba lagi dalam ${LOCK_SECONDS} detik.`
          );
        } else {
          setError(result.error || "Gagal masuk. Silakan coba lagi.");
        }
        return;
      }
      const from = (location.state as { from?: string; program?: number } | null)?.from;
      const program = (location.state as { program?: number } | null)?.program;
      const target = from || "/mitra/dashboard";
      navigate(
        program !== undefined
          ? `${target}${target.includes("?") ? "&" : "?"}program=${program}`
          : target,
        { replace: true }
      );
    }, 600);
  };

  // Jika sudah login, redirect lewat useEffect di atas
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-subdued)]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-subdued)] transition-colors hover:text-[var(--text-default)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
        <Link to="/mitra/registrasi" className="text-sm font-medium text-[var(--primary)] hover:underline">
          Daftar sebagai Mitra
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-[var(--border-light)] bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-[var(--text-default)]">
                Masuk Akun Mitra
              </h1>
              <p className="mt-1 text-center text-sm text-[var(--text-subdued)]">
                Masuk untuk melanjutkan proses kontribusi pada platform PSPB.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="mitra-email" className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                  Email Kantor
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subdued)]" />
                  <input
                    id="mitra-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldError((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="nama@perusahaan.co.id"
                    className={`w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--primary-200)] ${
                      fieldError.email ? "border-[var(--red-60)]" : "border-[var(--border-light)] focus:border-[var(--primary)]"
                    }`}
                  />
                </div>
                {fieldError.email && <p className="mt-1 text-sm text-[var(--red-70)]">{fieldError.email}</p>}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="mitra-password" className="block text-sm font-medium text-[var(--text-default)]">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLupa((s) => !s)}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subdued)]" />
                  <input
                    id="mitra-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldError((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Masukkan kata sandi"
                    className={`w-full rounded-md border bg-white py-2 pl-9 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--primary-200)] ${
                      fieldError.password ? "border-[var(--red-60)]" : "border-[var(--border-light)] focus:border-[var(--primary)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-[var(--text-default)]"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldError.password && <p className="mt-1 text-sm text-[var(--red-70)]">{fieldError.password}</p>}
              </div>

              {error && (
                <p className="rounded-md bg-[var(--red-0)] px-3 py-2 text-sm text-[var(--red-70)]">
                  {error}
                  {isLocked && ` (${lockRemaining} detik)`}
                </p>
              )}

              {showLupa && (
                <div className="flex items-start gap-2 rounded-md bg-[var(--primary-50)] px-3 py-2 text-sm text-[var(--primary)]">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Layanan reset kata sandi otomatis belum tersedia. Hubungi tim PSPB untuk
                    membantu pemulihan akun Anda.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full rounded-md bg-[var(--primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--border-light)] disabled:text-[var(--text-subdued)]"
              >
                {isLocked
                  ? `Terkunci (${lockRemaining}s)`
                  : loading
                    ? "Memproses..."
                    : "Masuk"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--text-subdued)]">
              Belum punya akun?{" "}
              <Link to="/mitra/registrasi" className="font-medium text-[var(--primary)] hover:underline">
                Daftar sebagai Mitra
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <DemoAccountList />
          </div>
        </div>
      </div>
    </div>
  );
}
