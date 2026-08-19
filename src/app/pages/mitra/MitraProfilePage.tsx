import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, FileText, ShieldCheck, Trash2, Upload } from "lucide-react";
import {
  MAX_DOKUMEN_SIZE,
  addMitraDokumen,
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
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--gray-10)] bg-white p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-default)]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--text-subdued)]">{description}</p>
          )}
        </div>
        {action}
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
  const [docMsg, setDocMsg] = useState("");
  const [docError, setDocError] = useState("");

  // Unggahan hanya tersimpan di sesi ini, sehingga pratinjau memakai object URL
  // yang dipetakan ke id dokumen (dokumen contoh tidak memiliki berkas asli).
  const previewUrls = useRef(new Map<string, string>());
  const uploadInputRef = useRef<HTMLInputElement>(null);
  // Target unggahan: company profile atau dokumen pendukung
  const uploadTarget = useRef<"company" | "dokumen">("dokumen");

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

  const startUpload = (target: "company" | "dokumen") => {
    uploadTarget.current = target;
    setDocError("");
    setDocMsg("");
    uploadInputRef.current?.click();
  };

  const handleUploadFile = (file: File | null) => {
    const target = uploadTarget.current;
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setDocError("Dokumen harus berformat PDF.");
      return;
    }
    if (file.size > MAX_DOKUMEN_SIZE) {
      setDocError("Ukuran dokumen maksimal 10 MB.");
      return;
    }

    if (target === "company") {
      const id = profile.companyProfile?.id || `cp-${Date.now()}`;
      const updated = updateMitraProfile(session.email, {
        companyProfile: {
          id,
          jenis: "Company Profile",
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
      });
      if (!updated) {
        setDocError("Gagal mengunggah dokumen. Coba lagi.");
        return;
      }
      previewUrls.current.set(id, URL.createObjectURL(file));
      setProfile(updated);
      setDocError("");
      setDocMsg("Company profile berhasil diunggah.");
      return;
    }

    const before = profile.dokumen.map((d) => d.id);
    const updated = addMitraDokumen(session.email, {
      jenis: file.name.replace(/\.pdf$/i, ""),
      fileName: file.name,
      fileSize: file.size,
    });
    if (!updated) {
      setDocError("Dokumen dengan nama yang sama sudah diunggah.");
      return;
    }
    const added = updated.dokumen.find((d) => !before.includes(d.id));
    if (added) previewUrls.current.set(added.id, URL.createObjectURL(file));
    setProfile(updated);
    setDocError("");
    setDocMsg("Dokumen berhasil diunggah.");
  };

  const handleView = (doc: MitraDokumen) => {
    const url = previewUrls.current.get(doc.id);
    if (!url) {
      setDocMsg("");
      setDocError(
        `Pratinjau "${doc.fileName}" belum tersedia. Unggah ulang berkas untuk melihat isinya.`
      );
      return;
    }
    setDocError("");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const revokePreview = (id: string) => {
    const url = previewUrls.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(id);
    }
  };

  const handleDeleteCompanyProfile = () => {
    const id = profile.companyProfile?.id;
    const updated = updateMitraProfile(session.email, { companyProfile: undefined });
    if (updated) {
      if (id) revokePreview(id);
      setProfile(updated);
      setDocError("");
      setDocMsg("Company profile berhasil dihapus.");
    } else {
      setDocError("Gagal menghapus dokumen. Coba lagi.");
    }
  };

  const handleDeleteDokumen = (id: string) => {
    const updated = removeMitraDokumen(session.email, id);
    if (updated) {
      revokePreview(id);
      setProfile(updated);
      setDocError("");
      setDocMsg("Dokumen berhasil dihapus.");
    } else {
      setDocError("Gagal menghapus dokumen. Coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-default)]">Profil Mitra</h1>
        <p className="mt-1 text-sm text-[var(--text-subdued)]">
          Data narahubung dan organisasi yang digunakan pada setiap pengajuan kontribusi.
        </p>
      </div>

      {/* Data Narahubung */}
      <Section title="Data Narahubung">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <ReadField label="Nama" value={profile.nama} />
          <ReadField label="Email Kantor" value={profile.email} />
          <ReadField label="Nomor Telepon" value={profile.nomorTelepon} />
          <ReadField label="Jabatan dan Posisi" value={profile.jabatan} />
          <ReadField label="Kata Sandi" value={"•".repeat(8)} />
        </div>
      </Section>

      {/* Informasi Perusahaan */}
      <Section title="Informasi Perusahaan">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <ReadField label="Nama Perusahaan" value={profile.namaPerusahaan} />
          <ReadField label="Bentuk Badan Hukum" value={profile.badanHukum} />
          <ReadField
            label="Status Mitra"
            value={profile.statusMitra === "baru" ? "Baru" : "Lama"}
          />
        </div>
      </Section>

      {/* Dokumen Pendukung */}
      <Section
        title="Dokumen Pendukung"
        description="Dokumen organisasi yang menjadi lampiran pada pengajuan kontribusi. Format PDF, maksimum 10 MB."
        action={
          <Button
            color="white"
            size="md"
            className="h-10 shrink-0 text-sm"
            onClick={() => startUpload("dokumen")}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Unggah Dokumen
          </Button>
        }
      >
        <input
          ref={uploadInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleUploadFile(e.target.files?.[0] || null)}
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
              onLihat={() => handleView(profile.companyProfile as MitraDokumen)}
              onHapus={handleDeleteCompanyProfile}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-button)] border border-dashed border-[var(--gray-20)] px-4 py-3">
              <p className="text-sm text-[var(--text-subdued)]">Belum ada company profile.</p>
              <button
                type="button"
                onClick={() => startUpload("company")}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--gray-10)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--gray-0)]"
              >
                <Upload className="h-3.5 w-3.5" />
                Unggah Company Profile
              </button>
            </div>
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
              onLihat={() => handleView(doc)}
              onHapus={() => handleDeleteDokumen(doc.id)}
            />
          ))}

          {profile.dokumen.length === 0 && (
            <p className="text-sm text-[var(--text-subdued)]">
              Belum ada dokumen pendukung yang diunggah.
            </p>
          )}
        </div>

        {docError && <p className="mt-3 text-sm text-[var(--red-70)]">{docError}</p>}
        {!docError && docMsg && (
          <p className="mt-3 text-sm text-[var(--green-70)]">{docMsg}</p>
        )}
      </Section>
    </div>
  );
}

function DocRow({
  nama,
  keterangan,
  onLihat,
  onHapus,
}: {
  nama: string;
  keterangan: string;
  onLihat: () => void;
  onHapus: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-[var(--gray-10)] px-4 py-3">
      <FileText className="h-5 w-5 shrink-0 text-[var(--primary)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-default)]">{nama}</p>
        <p className="mt-0.5 text-xs text-[var(--text-subdued)]">{keterangan}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onLihat}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--gray-10)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-default)] transition-colors hover:bg-[var(--gray-0)]"
        >
          <Eye className="h-3.5 w-3.5" />
          Lihat
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
    </div>
  );
}
