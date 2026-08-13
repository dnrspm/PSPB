import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Upload,
  X,
} from "lucide-react";
import {
  BADAN_HUKUM_OPTIONS,
  MAX_DOKUMEN_SIZE,
  registerMitra,
} from "../../lib/mitra";

type FieldErrors = Partial<
  Record<
    | "nama"
    | "email"
    | "nomorTelepon"
    | "jabatan"
    | "password"
    | "konfirmasiPassword"
    | "namaPerusahaan"
    | "badanHukum"
    | "statusMitra"
    | "companyProfile",
    string
  >
>;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export default function MitraRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const contributionState = (location.state as { fromState?: unknown } | null)?.fromState;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    nomorTelepon: "",
    jabatan: "",
    password: "",
    konfirmasiPassword: "",
    namaPerusahaan: "",
    badanHukum: "",
    badanHukumLainnya: "",
    statusMitra: "" as "" | "baru" | "lama",
  });
  const [companyProfile, setCompanyProfile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFile = (file: File | null) => {
    setCompanyProfile(file);
    setErrors((prev) => ({ ...prev, companyProfile: undefined }));
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.nama.trim()) errs.nama = "Nama wajib diisi.";
    if (!form.email.trim()) {
      errs.email = "Email kantor wajib diisi.";
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = "Masukkan format email yang valid.";
    }
    if (!form.nomorTelepon.trim()) {
      errs.nomorTelepon = "Nomor telepon wajib diisi.";
    } else if (!/^[0-9]+$/.test(form.nomorTelepon.trim())) {
      errs.nomorTelepon = "Nomor telepon hanya boleh berisi angka.";
    }
    if (!form.jabatan.trim()) errs.jabatan = "Jabatan dan posisi wajib diisi.";
    if (!form.password) {
      errs.password = "Kata sandi wajib diisi.";
    } else if (form.password.length < 8) {
      errs.password = "Kata sandi minimal 8 karakter.";
    }
    if (!form.konfirmasiPassword) {
      errs.konfirmasiPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (form.konfirmasiPassword !== form.password) {
      errs.konfirmasiPassword = "Konfirmasi kata sandi tidak sama dengan kata sandi.";
    }
    if (!form.namaPerusahaan.trim()) errs.namaPerusahaan = "Nama perusahaan wajib diisi.";
    if (!form.badanHukum) errs.badanHukum = "Pilih bentuk badan hukum.";
    if (form.badanHukum === "Lainnya" && !form.badanHukumLainnya.trim()) {
      errs.badanHukum = "Isi bentuk badan hukum Anda.";
    }
    if (!form.statusMitra) errs.statusMitra = "Pilih status mitra.";
    if (!companyProfile) {
      errs.companyProfile = "Company Profile wajib diunggah.";
    } else if (!companyProfile.name.toLowerCase().endsWith(".pdf")) {
      errs.companyProfile = "Company Profile harus berformat PDF.";
    } else if (companyProfile.size > MAX_DOKUMEN_SIZE) {
      errs.companyProfile = "Ukuran Company Profile maksimal 10 MB.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    setTimeout(() => {
      const result = registerMitra({
        nama: form.nama.trim(),
        email: form.email.trim().toLowerCase(),
        nomorTelepon: form.nomorTelepon.trim(),
        jabatan: form.jabatan.trim(),
        password: form.password,
        namaPerusahaan: form.namaPerusahaan.trim(),
        badanHukum:
          form.badanHukum === "Lainnya"
            ? form.badanHukumLainnya.trim()
            : form.badanHukum,
        statusMitra: form.statusMitra as "baru" | "lama",
        companyProfile: companyProfile
          ? {
              id: "",
              jenis: "Company Profile",
              fileName: companyProfile.name,
              fileSize: companyProfile.size,
              uploadedAt: new Date().toISOString(),
            }
          : undefined,
      });
      setSubmitting(false);
      if (!result.ok) {
        setSubmitError(result.error || "Gagal membuat akun. Silakan coba lagi.");
        return;
      }
      setSuccess(true);
    }, 700);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-subdued)] p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border-light)] bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[var(--green-60)]" />
          <h1 className="text-lg font-semibold text-[var(--text-default)]">
            Akun Mitra Berhasil Dibuat
          </h1>
          <p className="mt-2 text-sm text-[var(--text-subdued)]">
            Anda telah masuk secara otomatis. Silakan lanjutkan proses kontribusi
            untuk satuan pendidikan.
          </p>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => navigate("/kontribusi", { state: contributionState })}
              className="w-full rounded-md bg-[var(--primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Lanjutkan Kontribusi
            </button>
            <button
              onClick={() => navigate("/mitra/profil")}
              className="w-full rounded-md border border-[var(--border-light)] py-2.5 text-sm font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--surface-subdued)]"
            >
              Lengkapi Dokumen di Profil Mitra
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--primary-200)] ${
      hasError
        ? "border-[var(--red-60)]"
        : "border-[var(--border-light)] focus:border-[var(--primary)]"
    }`;

  const errorText = (msg?: string) =>
    msg ? <p className="mt-1 text-sm text-[var(--red-70)]">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-[var(--surface-subdued)]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <Link
          to="/mitra/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-subdued)] transition-colors hover:text-[var(--text-default)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-16">
        <div className="rounded-xl border border-[var(--border-light)] bg-white shadow-sm">
          <div className="border-b border-[var(--border-light)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-default)]">
                  Registrasi Akun Mitra
                </h1>
                <p className="mt-1 text-sm text-[var(--text-subdued)]">
                  Daftarkan organisasi Anda untuk berpartisipasi dalam program kontribusi PSPB.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Segmen 1: Data Narahubung */}
            <section className="overflow-hidden rounded-lg border border-[var(--border-light)]">
              <div className="border-b border-[var(--border-light)] bg-[var(--surface-subdued)] px-5 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-default)]">Data Narahubung</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Nama <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setField("nama", e.target.value)}
                    placeholder="Ketik nama lengkap"
                    className={inputClass(!!errors.nama)}
                  />
                  {errorText(errors.nama)}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Nomor Telepon <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.nomorTelepon}
                    onChange={(e) => setField("nomorTelepon", e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Ketik nomor telepon"
                    className={inputClass(!!errors.nomorTelepon)}
                  />
                  {errorText(errors.nomorTelepon)}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Jabatan dan Posisi <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.jabatan}
                    onChange={(e) => setField("jabatan", e.target.value)}
                    placeholder="Ketik jabatan dan posisi"
                    className={inputClass(!!errors.jabatan)}
                  />
                  {errorText(errors.jabatan)}
                </div>
              </div>
            </section>

            {/* Segmen 2: Informasi Perusahaan */}
            <section className="overflow-hidden rounded-lg border border-[var(--border-light)]">
              <div className="border-b border-[var(--border-light)] bg-[var(--surface-subdued)] px-5 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-default)]">Informasi Perusahaan</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Nama Perusahaan <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.namaPerusahaan}
                    onChange={(e) => setField("namaPerusahaan", e.target.value)}
                    placeholder="Ketik nama perusahaan"
                    className={inputClass(!!errors.namaPerusahaan)}
                  />
                  {errorText(errors.namaPerusahaan)}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Bentuk Badan Hukum <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <select
                    value={form.badanHukum}
                    onChange={(e) => setField("badanHukum", e.target.value)}
                    className={inputClass(!!errors.badanHukum)}
                  >
                    <option value="">Pilih bentuk badan hukum</option>
                    {BADAN_HUKUM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {form.badanHukum === "Lainnya" && (
                    <input
                      type="text"
                      value={form.badanHukumLainnya}
                      onChange={(e) => setField("badanHukumLainnya", e.target.value)}
                      placeholder="Tulis bentuk badan hukum"
                      className={`mt-2 ${inputClass(!!errors.badanHukum)}`}
                    />
                  )}
                  {errorText(errors.badanHukum)}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Status Mitra <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <div className="flex gap-4">
                    {(
                      [
                        { value: "baru", label: "Baru" },
                        { value: "lama", label: "Lama" },
                      ] as const
                    ).map((opt) => (
                      <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="statusMitra"
                          value={opt.value}
                          checked={form.statusMitra === opt.value}
                          onChange={() => setField("statusMitra", opt.value)}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm text-[var(--text-default)]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errorText(errors.statusMitra)}
                </div>
              </div>
            </section>

            {/* Segmen 3: Akun Login */}
            <section className="overflow-hidden rounded-lg border border-[var(--border-light)]">
              <div className="border-b border-[var(--border-light)] bg-[var(--surface-subdued)] px-5 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-default)]">Akun Login</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex items-start gap-2 rounded-md bg-[var(--primary-50)] px-3 py-2 text-sm text-[var(--primary)]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Email dan kata sandi ini digunakan untuk masuk ke platform PSPB. Simpan
                      dengan baik dan jangan dibagikan kepada siapa pun.
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Email Kantor <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="nama@perusahaan.co.id"
                    className={inputClass(!!errors.email)}
                  />
                  {errorText(errors.email)}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Kata Sandi <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className={`${inputClass(!!errors.password)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-[var(--text-default)]"
                      aria-label="Tampilkan kata sandi"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errorText(errors.password)}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                    Konfirmasi Kata Sandi <span className="text-[var(--red-60)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKonfirmasi ? "text" : "password"}
                      value={form.konfirmasiPassword}
                      onChange={(e) => setField("konfirmasiPassword", e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className={`${inputClass(!!errors.konfirmasiPassword)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKonfirmasi((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-[var(--text-default)]"
                      aria-label="Tampilkan kata sandi"
                    >
                      {showKonfirmasi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errorText(errors.konfirmasiPassword)}
                </div>
              </div>
            </section>

            {/* Segmen 4: Dokumen Pendukung */}
            <section className="overflow-hidden rounded-lg border border-[var(--border-light)]">
              <div className="border-b border-[var(--border-light)] bg-[var(--surface-subdued)] px-5 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-default)]">Dokumen Pendukung</h2>
              </div>
              <div className="p-5">
                <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                  Company Profile <span className="text-[var(--red-60)]">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {!companyProfile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex w-full items-center justify-center gap-2 rounded-md border border-dashed bg-[var(--surface-subdued)] px-4 py-6 text-sm transition-colors hover:bg-[var(--surface-neutral-default)] ${
                      errors.companyProfile ? "border-[var(--red-60)]" : "border-[var(--border-light)]"
                    }`}
                  >
                    <Upload className="h-5 w-5 text-[var(--text-subdued)]" />
                    <span className="text-[var(--text-subdued)]">
                      Pilih berkas company profile
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-light)] bg-[var(--surface-subdued)] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-sm font-medium text-[var(--text-default)]">{companyProfile.name}</span>
                      <span className="text-xs text-[var(--text-subdued)]">{formatBytes(companyProfile.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFile(null)}
                      className="shrink-0 rounded p-1 text-[var(--text-subdued)] hover:bg-[var(--surface-neutral-default)]"
                      aria-label="Hapus berkas"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-[var(--text-subdued)]">
                  Format berkas: PDF. Ukuran maksimum 10 MB.
                </p>
                {errorText(errors.companyProfile)}
              </div>
            </section>

            {submitError && (
              <p className="rounded-md bg-[var(--red-0)] px-3 py-2 text-sm text-[var(--red-70)]">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-subdued)]">
                Dengan mendaftar, Anda menyetujui data organisasi Anda diproses sesuai
                ketentuan yang berlaku di platform PSPB.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="shrink-0 rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--border-light)] disabled:text-[var(--text-subdued)]"
              >
                {submitting ? "Mendaftarkan..." : "Daftar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
