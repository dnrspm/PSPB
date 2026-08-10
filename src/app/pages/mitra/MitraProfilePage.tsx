import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Info,
  ShieldCheck,
  Upload,
  X,
  AlertTriangle,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import {
  BADAN_HUKUM_OPTIONS,
  DOKUMEN_VALIDASI_JENIS,
  MAX_DOKUMEN_SIZE,
  addMitraDokumen,
  getMitraProfile,
  getMitraSession,
  removeMitraDokumen,
  updateMitraProfile,
  verifikasiStatusLabel,
} from "../../lib/mitra";
import type { VerifikasiStatus } from "../../types/mitra";

const VERIFIKASI_STYLE: Record<
  VerifikasiStatus,
  { bg: string; text: string; icon: ReactNode }
> = {
  "belum-lengkap": {
    bg: "bg-[#FFDFA3]",
    text: "text-[#92400E]",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  "menunggu-verifikasi": {
    bg: "bg-[#EDE9FE]",
    text: "text-[#7C3AED]",
    icon: <Clock3 className="h-4 w-4" />,
  },
  terverifikasi: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#35825A]",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  ditolak: {
    bg: "bg-[#FFE9EA]",
    text: "text-[#C82236]",
    icon: <X className="h-4 w-4" />,
  },
};

function formatBytes(bytes: number) {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export default function MitraProfilePage() {
  const navigate = useNavigate();
  const session = getMitraSession();
  const [profile, setProfile] = useState(() =>
    session ? getMitraProfile(session.email) : null
  );
  const [editMode, setEditMode] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState(() => ({
    nama: profile?.nama || "",
    nomorTelepon: profile?.nomorTelepon || "",
    jabatan: profile?.jabatan || "",
    password: profile?.password || "",
    konfirmasiPassword: profile?.password || "",
    namaPerusahaan: profile?.namaPerusahaan || "",
    badanHukum: profile?.badanHukum || "",
    badanHukumLainnya: profile?.badanHukumLainnya || "",
    statusMitra: (profile?.statusMitra || "lama") as "baru" | "lama",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Dokumen upload state
  const [docType, setDocType] = useState<string>(DOKUMEN_VALIDASI_JENIS[0]);
  const [customType, setCustomType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!session || !profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-light)] bg-white p-12 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-[var(--text-subdued)]" />
        <p className="text-sm text-[var(--text-subdued)]">
          Anda belum masuk sebagai Mitra.
        </p>
        <button
          onClick={() => navigate("/mitra/login")}
          className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Masuk sebagai Mitra
        </button>
      </div>
    );
  }

  const verifStyle = VERIFIKASI_STYLE[profile.verifikasiStatus];
  const dokumenLengkap =
    profile.verifikasiStatus === "terverifikasi" ||
    profile.verifikasiStatus === "menunggu-verifikasi";

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSaveMsg("");
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.nama.trim()) errs.nama = "Nama wajib diisi.";
    if (!/^[0-9]+$/.test(form.nomorTelepon.trim())) errs.nomorTelepon = "Nomor telepon hanya boleh berisi angka.";
    if (!form.jabatan.trim()) errs.jabatan = "Jabatan wajib diisi.";
    if (form.password.length < 8) errs.password = "Kata sandi minimal 8 karakter.";
    if (form.konfirmasiPassword !== form.password) errs.konfirmasiPassword = "Konfirmasi kata sandi tidak sama.";
    if (!form.namaPerusahaan.trim()) errs.namaPerusahaan = "Nama perusahaan wajib diisi.";
    if (!form.badanHukum) errs.badanHukum = "Pilih bentuk badan hukum.";
    if (form.badanHukum === "Lainnya" && !form.badanHukumLainnya.trim()) errs.badanHukum = "Isi bentuk badan hukum.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const updated = updateMitraProfile(session.email, {
      nama: form.nama.trim(),
      nomorTelepon: form.nomorTelepon.trim(),
      jabatan: form.jabatan.trim(),
      password: form.password,
      namaPerusahaan: form.namaPerusahaan.trim(),
      badanHukum:
        form.badanHukum === "Lainnya" ? form.badanHukumLainnya.trim() : form.badanHukum,
      statusMitra: form.statusMitra,
    });
    if (updated) {
      setProfile(updated);
      setSaveError("");
      setSaveMsg("Data profil berhasil disimpan.");
      setEditMode(false);
    } else {
      setSaveError("Gagal menyimpan data profil.");
    }
  };

  const handleDocFileChange = (file: File | null) => {
    setDocFile(file);
    setDocError("");
  };

  const handleUpload = () => {
    const jenis = docType === "Lainnya" ? customType.trim() : docType;
    if (!jenis) {
      setDocError("Pilih atau isi jenis dokumen.");
      return;
    }
    if (!docFile) {
      setDocError("Pilih berkas dokumen terlebih dahulu.");
      return;
    }
    if (!docFile.name.toLowerCase().endsWith(".pdf")) {
      setDocError("Dokumen harus berformat PDF.");
      return;
    }
    if (docFile.size > MAX_DOKUMEN_SIZE) {
      setDocError("Ukuran dokumen maksimal 10 MB.");
      return;
    }
    if (profile.dokumen.some((d) => d.jenis.toLowerCase() === jenis.toLowerCase())) {
      setDocError("Jenis dokumen ini sudah pernah diunggah.");
      return;
    }
    setUploading(true);
    setDocError("");
    setTimeout(() => {
      const updated = addMitraDokumen(session.email, {
        jenis,
        fileName: docFile.name,
        fileSize: docFile.size,
      });
      setUploading(false);
      if (updated) {
        setProfile(updated);
        setDocFile(null);
        setCustomType("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSaveMsg("Dokumen berhasil diunggah. Status verifikasi diperbarui.");
      } else {
        setDocError("Gagal menyimpan metadata dokumen. Coba lagi.");
      }
    }, 500);
  };

  const handleRemoveDoc = (id: string) => {
    const updated = removeMitraDokumen(session.email, id);
    if (updated) {
      setProfile(updated);
      setSaveMsg("Dokumen berhasil dihapus.");
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--primary-200)] disabled:bg-[var(--surface-subdued)] disabled:text-[var(--text-subdued)] ${
      hasError
        ? "border-[var(--red-60)]"
        : "border-[var(--border-light)] focus:border-[var(--primary)]"
    }`;

  const errorText = (msg?: string) =>
    msg ? <p className="mt-1 text-sm text-[var(--red-70)]">{msg}</p> : null;

  return (
    <div className="space-y-6">
      {/* Status Verifikasi */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${verifStyle.bg}`}>
        <div className={`mt-0.5 ${verifStyle.text}`}>{verifStyle.icon}</div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-default)]">Status Verifikasi Organisasi</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${verifStyle.bg} ${verifStyle.text}`}>
              {verifikasiStatusLabel(profile.verifikasiStatus)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-subdued)]">
            {profile.verifikasiStatus === "terverifikasi" &&
              "Organisasi Anda telah terverifikasi dan dapat mengajukan kontribusi."}
            {profile.verifikasiStatus === "menunggu-verifikasi" &&
              "Dokumen Anda sedang dalam proses verifikasi oleh tim pelaksana PSPB."}
            {profile.verifikasiStatus === "belum-lengkap" &&
              "Lengkapi dokumen validasi organisasi agar dapat diverifikasi oleh tim pelaksana PSPB."}
            {profile.verifikasiStatus === "ditolak" &&
              "Dokumen Anda ditolak. Silakan periksa kembali dan unggah ulang dokumen yang valid."}
          </p>
        </div>
      </div>

      {(saveMsg || saveError) && (
        <div className={`rounded-lg px-4 py-3 text-sm ${saveError ? "bg-[var(--red-0)] text-[var(--red-70)]" : "bg-[#D1FAE5] text-[#35825A]"}`}>
          {saveError || saveMsg}
        </div>
      )}

      {/* Data Narahubung */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-default)]">Data Narahubung</h2>
          {!editMode && (
            <button
              onClick={() => {
                setEditMode(true);
                setSaveMsg("");
                setSaveError("");
              }}
              className="rounded-md border border-[var(--border-light)] px-3 py-1.5 text-sm font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--surface-subdued)]"
            >
              Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Nama</label>
            <input
              type="text"
              value={form.nama}
              disabled={!editMode}
              onChange={(e) => setField("nama", e.target.value)}
              className={inputClass(!!errors.nama)}
            />
            {errorText(errors.nama)}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Email Kantor</label>
            <input type="text" value={profile.email} disabled className={inputClass(false)} />
            <p className="mt-1 text-xs text-[var(--text-subdued)]">
              Email digunakan sebagai identitas akun dan tidak dapat diubah.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Nomor Telepon</label>
            <input
              type="tel"
              value={form.nomorTelepon}
              disabled={!editMode}
              onChange={(e) => setField("nomorTelepon", e.target.value.replace(/[^0-9]/g, ""))}
              className={inputClass(!!errors.nomorTelepon)}
            />
            {errorText(errors.nomorTelepon)}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Jabatan dan Posisi</label>
            <input
              type="text"
              value={form.jabatan}
              disabled={!editMode}
              onChange={(e) => setField("jabatan", e.target.value)}
              className={inputClass(!!errors.jabatan)}
            />
            {errorText(errors.jabatan)}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                disabled={!editMode}
                onChange={(e) => setField("password", e.target.value)}
                className={`${inputClass(!!errors.password)} pr-10`}
              />
              {editMode && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-[var(--text-default)]"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            {errorText(errors.password)}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Konfirmasi Kata Sandi</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.konfirmasiPassword}
              disabled={!editMode}
              onChange={(e) => setField("konfirmasiPassword", e.target.value)}
              className={inputClass(!!errors.konfirmasiPassword)}
            />
            {errorText(errors.konfirmasiPassword)}
          </div>
        </div>
        {editMode && (
          <div className="flex justify-end gap-2 border-t border-[var(--border-light)] px-5 py-3">
            <button
              onClick={() => {
                setForm({
                  nama: profile.nama,
                  nomorTelepon: profile.nomorTelepon,
                  jabatan: profile.jabatan,
                  password: profile.password,
                  konfirmasiPassword: profile.password,
                  namaPerusahaan: profile.namaPerusahaan,
                  badanHukum: profile.badanHukum,
                  badanHukumLainnya: profile.badanHukumLainnya || "",
                  statusMitra: profile.statusMitra,
                });
                setErrors({});
                setEditMode(false);
              }}
              className="rounded-md border border-[var(--border-light)] px-4 py-2 text-sm font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--surface-subdued)]"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Simpan
            </button>
          </div>
        )}
      </section>

      {/* Informasi Perusahaan */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
        <div className="border-b border-[var(--border-light)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-default)]">Informasi Perusahaan</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Nama Perusahaan</label>
            <input
              type="text"
              value={form.namaPerusahaan}
              disabled={!editMode}
              onChange={(e) => setField("namaPerusahaan", e.target.value)}
              className={inputClass(!!errors.namaPerusahaan)}
            />
            {errorText(errors.namaPerusahaan)}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Bentuk Badan Hukum</label>
            <select
              value={form.badanHukum}
              disabled={!editMode}
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
                disabled={!editMode}
                onChange={(e) => setField("badanHukumLainnya", e.target.value)}
                placeholder="Tulis bentuk badan hukum"
                className={`mt-2 ${inputClass(!!errors.badanHukum)}`}
              />
            )}
            {errorText(errors.badanHukum)}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Status Mitra</label>
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
                    name="statusMitra-profil"
                    checked={form.statusMitra === opt.value}
                    disabled={!editMode}
                    onChange={() => setField("statusMitra", opt.value)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-default)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dokumen Validasi */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
        <div className="border-b border-[var(--border-light)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-default)]">Dokumen Validasi Organisasi</h2>
        </div>
        <div className="space-y-5 p-5">
          {/* Company Profile */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">Company Profile</label>
            {profile.companyProfile ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-light)] bg-[var(--surface-subdued)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-[var(--text-subdued)]" />
                  <span className="truncate text-sm font-medium text-[var(--text-default)]">
                    {profile.companyProfile.fileName}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-subdued)]">
                    {formatBytes(profile.companyProfile.fileSize)}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-medium text-[var(--green-60)]">Terverifikasi</span>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-subdued)]">Belum ada company profile.</p>
            )}
          </div>

          {/* Daftar dokumen yang sudah diunggah */}
          {profile.dokumen.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-default)]">
                Dokumen Terunggah
              </label>
              <div className="space-y-2">
                {profile.dokumen.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-light)] bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-default)]">{doc.fileName}</p>
                        <p className="text-xs text-[var(--text-subdued)]">
                          {doc.jenis} • {new Date(doc.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          {doc.fileSize ? ` • ${formatBytes(doc.fileSize)}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="shrink-0 rounded p-1.5 text-[var(--text-subdued)] transition-colors hover:bg-[var(--red-0)] hover:text-[var(--red-70)]"
                      aria-label="Hapus dokumen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload dokumen baru */}
          <div className="rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--surface-subdued)] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-default)]">
              <Upload className="h-4 w-4 text-[var(--primary)]" />
              Unggah Dokumen Validasi
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  setDocError("");
                }}
                className="rounded-md border border-[var(--border-light)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              >
                {DOKUMEN_VALIDASI_JENIS.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
                <option value="Lainnya">Lainnya</option>
              </select>
              {docType === "Lainnya" && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => {
                    setCustomType(e.target.value);
                    setDocError("");
                  }}
                  placeholder="Jenis dokumen lain"
                  className="rounded-md border border-[var(--border-light)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleDocFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center gap-2 sm:col-span-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-md border border-[var(--border-light)] bg-white px-3 py-2 text-sm text-[var(--text-subdued)] transition-colors hover:bg-[var(--surface-neutral-default)]"
                >
                  {docFile ? docFile.name : "Pilih berkas PDF"}
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:bg-[var(--border-light)] disabled:text-[var(--text-subdued)]"
                >
                  <Plus className="h-4 w-4" />
                  {uploading ? "Mengunggah..." : "Unggah"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--text-subdued)]">
              Format PDF, maksimum 10 MB. Jenis dokumen yang sama tidak dapat diunggah ulang. Dokumen dapat diganti sebelum diverifikasi.
            </p>
            {docError && <p className="mt-1 text-sm text-[var(--red-70)]">{docError}</p>}
          </div>

          {!dokumenLengkap && (
            <div className="flex items-start gap-2 rounded-md bg-[var(--primary-50)] px-3 py-2 text-sm text-[var(--primary)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Setelah dokumen validasi diunggah, status verifikasi organisasi Anda berubah menjadi{" "}
                <strong>Menunggu Verifikasi</strong> dan akan diproses oleh tim pelaksana PSPB.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Status per Kontribusi */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-default)]">Status per Kontribusi</h2>
        </div>
        <div className="p-5">
          <p className="flex items-center gap-2 text-sm text-[var(--text-subdued)]">
            <ClipboardList className="h-4 w-4 text-[var(--primary)]" />
            Informasi status kontribusi bersifat read-only dan diperbarui oleh tim internal PSPB.
          </p>
        </div>
      </section>
    </div>
  );
}
