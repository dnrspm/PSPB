import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, FileText, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import {
  BADAN_HUKUM_OPTIONS,
  MAX_DOKUMEN_SIZE,
  getMitraProfile,
  getMitraSession,
  removeMitraDokumen,
  updateMitraProfile,
} from "../../lib/mitra";
import type { MitraDokumen } from "../../types/mitra";
import { Button } from "../../components/Button";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--gray-10)] bg-white p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[var(--text-default)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--text-subdued)]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ReadField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-[var(--text-subdued)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--text-default)]">{value || "-"}</p>
    </div>
  );
}

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

  // Ganti berkas dokumen: menyimpan target yang sedang diganti
  const [replaceTarget, setReplaceTarget] = useState<
    { kind: "company" } | { kind: "dokumen"; id: string } | null
  >(null);
  const [docError, setDocError] = useState("");
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!session || !profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--gray-10)] bg-white p-12 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-[var(--text-subdued)]" />
        <p className="text-sm text-[var(--text-subdued)]">
          Anda belum masuk sebagai Mitra.
        </p>
        <div className="mt-4">
          <Button color="blue" size="md" onClick={() => navigate("/mitra/login")}>
            Masuk sebagai Mitra
          </Button>
        </div>
      </div>
    );
  }

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

  const startReplace = (target: { kind: "company" } | { kind: "dokumen"; id: string }) => {
    setReplaceTarget(target);
    setDocError("");
    docInputRef.current?.click();
  };

  const handleReplaceFile = (file: File | null) => {
    const target = replaceTarget;
    setReplaceTarget(null);
    if (docInputRef.current) docInputRef.current.value = "";
    if (!file || !target) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setDocError("Dokumen harus berformat PDF.");
      return;
    }
    if (file.size > MAX_DOKUMEN_SIZE) {
      setDocError("Ukuran dokumen maksimal 10 MB.");
      return;
    }

    const berkas = {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };
    const updated =
      target.kind === "company"
        ? updateMitraProfile(session.email, {
            companyProfile: {
              id: profile.companyProfile?.id || `cp-${Date.now()}`,
              jenis: "Company Profile",
              ...berkas,
            },
          })
        : updateMitraProfile(session.email, {
            dokumen: profile.dokumen.map((d: MitraDokumen) =>
              d.id === target.id ? { ...d, ...berkas } : d
            ),
          });

    if (updated) {
      setProfile(updated);
      setDocError("");
      setSaveError("");
      setSaveMsg("Dokumen berhasil diganti.");
    } else {
      setDocError("Gagal mengganti dokumen. Coba lagi.");
    }
  };

  const handleDeleteCompanyProfile = () => {
    const updated = updateMitraProfile(session.email, { companyProfile: undefined });
    if (updated) {
      setProfile(updated);
      setSaveError("");
      setSaveMsg("Dokumen berhasil dihapus.");
    }
  };

  const handleDeleteDokumen = (id: string) => {
    const updated = removeMitraDokumen(session.email, id);
    if (updated) {
      setProfile(updated);
      setSaveError("");
      setSaveMsg("Dokumen berhasil dihapus.");
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-11 w-full rounded-[var(--radius-button)] border bg-white px-3.5 text-sm outline-none transition-colors focus:ring-4 focus:ring-[var(--primary-200)]/40 disabled:bg-[var(--gray-0)] disabled:text-[var(--text-subdued)] ${
      hasError
        ? "border-[var(--red-60)]"
        : "border-[var(--gray-10)] hover:border-[var(--gray-20)] focus:border-[var(--primary)]"
    }`;

  const errorText = (msg?: string) =>
    msg ? <p className="mt-1 text-sm text-[var(--red-70)]">{msg}</p> : null;

  const fieldLabel = "mb-1.5 block text-sm font-medium text-[var(--text-default)]";

  const handleCancel = () => {
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
    setSaveMsg("");
    setSaveError("");
    setDocError("");
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-default)]">Profil Mitra</h1>
          <p className="mt-1 text-sm text-[var(--text-subdued)]">
            Data narahubung dan organisasi yang digunakan pada setiap pengajuan kontribusi.
          </p>
        </div>
        {editMode ? (
          <div className="flex shrink-0 gap-2">
            <Button color="white" size="md" className="h-10 text-sm" onClick={handleCancel}>
              Batal
            </Button>
            <Button color="blue" size="md" className="h-10 text-sm" onClick={handleSave}>
              Simpan Perubahan
            </Button>
          </div>
        ) : (
          <Button
            color="white"
            size="md"
            className="h-10 shrink-0 text-sm"
            onClick={() => {
              setEditMode(true);
              setSaveMsg("");
              setSaveError("");
            }}
          >
            Edit Profil
          </Button>
        )}
      </div>

      {(saveMsg || saveError) && (
        <div
          className={`rounded-[var(--radius-button)] px-4 py-3 text-sm ${
            saveError
              ? "bg-[var(--red-0)] text-[var(--red-70)]"
              : "bg-[var(--green-0)] text-[var(--green-70)]"
          }`}
        >
          {saveError || saveMsg}
        </div>
      )}

      {/* Data Narahubung */}
      <Section title="Data Narahubung">
        {editMode ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Nama</label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setField("nama", e.target.value)}
                className={inputClass(!!errors.nama)}
              />
              {errorText(errors.nama)}
            </div>
            <div>
              <label className={fieldLabel}>Email Kantor</label>
              <input type="text" value={profile.email} disabled className={inputClass(false)} />
              <p className="mt-1.5 text-xs text-[var(--text-subdued)]">
                Email digunakan sebagai identitas akun dan tidak dapat diubah.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Nomor Telepon</label>
              <input
                type="tel"
                value={form.nomorTelepon}
                onChange={(e) => setField("nomorTelepon", e.target.value.replace(/[^0-9]/g, ""))}
                className={inputClass(!!errors.nomorTelepon)}
              />
              {errorText(errors.nomorTelepon)}
            </div>
            <div>
              <label className={fieldLabel}>Jabatan dan Posisi</label>
              <input
                type="text"
                value={form.jabatan}
                onChange={(e) => setField("jabatan", e.target.value)}
                className={inputClass(!!errors.jabatan)}
              />
              {errorText(errors.jabatan)}
            </div>
            <div>
              <label className={fieldLabel}>Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
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
              <label className={fieldLabel}>Konfirmasi Kata Sandi</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.konfirmasiPassword}
                onChange={(e) => setField("konfirmasiPassword", e.target.value)}
                className={inputClass(!!errors.konfirmasiPassword)}
              />
              {errorText(errors.konfirmasiPassword)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <ReadField label="Nama" value={profile.nama} />
            <ReadField label="Email Kantor" value={profile.email} />
            <ReadField label="Nomor Telepon" value={profile.nomorTelepon} />
            <ReadField label="Jabatan dan Posisi" value={profile.jabatan} />
            <ReadField label="Kata Sandi" value={"•".repeat(8)} />
          </div>
        )}
      </Section>

      {/* Informasi Perusahaan */}
      <Section title="Informasi Perusahaan">
        {editMode ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Nama Perusahaan</label>
              <input
                type="text"
                value={form.namaPerusahaan}
                onChange={(e) => setField("namaPerusahaan", e.target.value)}
                className={inputClass(!!errors.namaPerusahaan)}
              />
              {errorText(errors.namaPerusahaan)}
            </div>
            <div>
              <label className={fieldLabel}>Bentuk Badan Hukum</label>
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
              <label className={fieldLabel}>Status Mitra</label>
              <div className="flex gap-5">
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
                      onChange={() => setField("statusMitra", opt.value)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--text-default)]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <ReadField label="Nama Perusahaan" value={profile.namaPerusahaan} />
            <ReadField label="Bentuk Badan Hukum" value={profile.badanHukum} />
            <ReadField
              label="Status Mitra"
              value={profile.statusMitra === "baru" ? "Baru" : "Lama"}
            />
          </div>
        )}
      </Section>

      {/* Dokumen Pendukung */}
      <Section
        title="Dokumen Pendukung"
        description="Dokumen organisasi yang menjadi lampiran pada pengajuan kontribusi. Format PDF, maksimum 10 MB."
      >
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleReplaceFile(e.target.files?.[0] || null)}
        />

        <div className="space-y-2">
          {profile.companyProfile ? (
            <DocRow
              nama={profile.companyProfile.fileName}
              keterangan={`Company Profile${
                profile.companyProfile.fileSize
                  ? ` • ${formatBytes(profile.companyProfile.fileSize)}`
                  : ""
              }`}
              editable={editMode}
              onGanti={() => startReplace({ kind: "company" })}
              onHapus={handleDeleteCompanyProfile}
            />
          ) : (
            <p className="text-sm text-[var(--text-subdued)]">Belum ada company profile.</p>
          )}

          {profile.dokumen.map((doc: MitraDokumen) => (
            <DocRow
              key={doc.id}
              nama={doc.fileName}
              keterangan={`${doc.jenis} • ${new Date(doc.uploadedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}${doc.fileSize ? ` • ${formatBytes(doc.fileSize)}` : ""}`}
              editable={editMode}
              onGanti={() => startReplace({ kind: "dokumen", id: doc.id })}
              onHapus={() => handleDeleteDokumen(doc.id)}
            />
          ))}
        </div>

        {docError && <p className="mt-2 text-sm text-[var(--red-70)]">{docError}</p>}
      </Section>
    </div>
  );
}

function DocRow({
  nama,
  keterangan,
  editable,
  onGanti,
  onHapus,
}: {
  nama: string;
  keterangan: string;
  /** Aksi ganti/hapus hanya tersedia saat mode edit profil */
  editable: boolean;
  onGanti: () => void;
  onHapus: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-[var(--gray-10)] px-4 py-3">
      <FileText className="h-5 w-5 shrink-0 text-[var(--primary)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-default)]">{nama}</p>
        <p className="mt-0.5 text-xs text-[var(--text-subdued)]">{keterangan}</p>
      </div>
      {editable && (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onGanti}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--gray-10)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--gray-0)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Ganti
        </button>
        <button
          type="button"
          onClick={onHapus}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--red-10)] px-2.5 py-1.5 text-xs font-medium text-[var(--red-70)] transition-colors hover:bg-[var(--red-0)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>
      )}
    </div>
  );
}
