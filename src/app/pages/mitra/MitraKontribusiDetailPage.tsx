import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink, FileText, Info, Package, Upload } from "lucide-react";
import { getMitraContributionById, getMitraSession } from "../../lib/mitra";
import { useContributionsSync } from "../../lib/useContributions";
import { getContributionById, updateContribution } from "../../data/mockWorkspace";
import { StatusBadge } from "../../components/workspace/StatusBadge";
import { WorkflowStepsSidebar, formatDate } from "../../components/detail/WorkflowStepsSidebar";
import { DataPksMitraModal } from "../../components/modals/DataPksMitraModal";
import type { Contribution, Document } from "../../types/contribution";

export default function MitraKontribusiDetailPage() {
  const navigate = useNavigate();
  useContributionsSync();
  const { id } = useParams<{ id: string }>();
  const session = getMitraSession();
  // Dipakai untuk merender ulang setelah dokumen diunggah/dihapus
  const [dokumenVersion, setDokumenVersion] = useState(0);
  const [showPksForm, setShowPksForm] = useState(false);
  const contribution =
    session && id ? getMitraContributionById(session.email, id) : null;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-12 text-center">
        <p className="text-sm text-gray-500">Anda belum masuk sebagai Mitra.</p>
        <button
          onClick={() => navigate("/mitra/login")}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Masuk sebagai Mitra
        </button>
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-6 py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="text-base font-semibold text-gray-800">
          Data Tidak Tersedia
        </h2>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Detail kontribusi yang Anda cari tidak ditemukan atau bukan milik organisasi Anda.
        </p>
        <button
          onClick={() => navigate("/mitra/dashboard")}
          className="mt-6 inline-flex items-center gap-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const c = contribution;
  const pksFilled = c.aktivitas.some((a) => a.action === "Isi Data PKS Mitra");

  return (
    <div>
      {/* Konten */}
      <div className="pr-0">
        {c.workflowStatus === "perjanjian-draft-pks" && !pksFilled && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 sm:flex-row sm:items-start">
            <Info className="mt-0.5 hidden h-5 w-5 shrink-0 text-blue-600 sm:block" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">
                Lengkapi Data PKS Mitra
              </p>
              <p className="mt-0.5 text-xs text-blue-700">
                Mohon isi data PKS untuk melanjutkan proses penyusunan Perjanjian Kerja Sama (PKS).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPksForm(true)}
              className="shrink-0 self-start rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 sm:self-center"
            >
              Isi Data PKS Mitra
            </button>
          </div>
        )}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header Summary — selebar kolom kiri agar alur status sejajar di atas */}
            <div className="rounded-lg border border-gray-100 bg-white shadow-sm px-6 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] font-semibold text-black">{c.program}</h1>
                <StatusBadge state={c.workflowStatus} />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Diperbarui:{" "}
                <span className="font-medium text-gray-500">
                  {formatDate(c.lastUpdate)}
                </span>
              </p>
            </div>

            <InformasiBantuan c={c} />
            {["perjanjian-draft-pks", "perjanjian-pembahasan-pks", "perjanjian-finalisasi-pks", "pelaksanaan-persiapan", "pelaksanaan-dalam-proses", "selesai"].includes(c.workflowStatus) && (
              <DokumenPKSSection c={c} />
            )}
            <DokumenSection
              key={dokumenVersion}
              c={c}
              onDokumenChange={() => setDokumenVersion((v) => v + 1)}
            />
          </div>
          <div className="w-84 shrink-0">
            <WorkflowStepsSidebar contribution={c} readOnly />
          </div>
        </div>
      </div>
      {showPksForm && (
        <DataPksMitraModal
          contribution={c}
          actorName={session.nama}
          onClose={() => setShowPksForm(false)}
        />
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  actions,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          {icon} {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Dl({ fields }: { fields: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-gray-400">{label}</dt>
          <dd className="text-gray-900">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function InformasiBantuan({ c }: { c: Contribution }) {
  const isSchoolProgram = c.program === "Infrastruktur Digital" || c.program === "Revitalisasi Sekolah";
  const isPlatformGtk = c.program === "Pengembangan Platform Digital" || c.program === "Pendampingan Pelatihan GTK";
  const isBahanAjar = c.program === "Bahan Ajar Digital";
  const isLainnya = c.program === "Kebutuhan Pendidikan Lainnya";

  return (
    <SectionCard icon={<Package className="h-4 w-4" />} title="Informasi Bantuan">
      {isSchoolProgram ? (
        <Dl
          fields={[
            ["Paket Dukungan", `${c.program}: ${c.paketBantuan}`],
            ["Nilai Kontribusi", c.nilaiKontribusi],
            ["Jumlah Penerima", (c.jumlahPenerima || 0).toLocaleString("id-ID")],
            ["Wilayah", c.wilayah],
            ["Informasi Tambahan", c.infoTambahan],
          ]}
        />
      ) : isPlatformGtk ? (
        <Dl
          fields={[
            ["Paket Dukungan", `${c.program}: ${c.paketBantuan}`],
            ["Topik", c.topik || c.topikMateri],
            ["Informasi Tambahan", c.infoTambahan],
          ]}
        />
      ) : isBahanAjar ? (
        <Dl
          fields={[
            ["Paket Dukungan", `${c.program}: ${c.paketBantuan}`],
            ["Untuk Siapa", c.untukSiapa],
            ["Jenjang Sekolah", c.jenjangSekolah],
            ["Topik / Materi", c.topikMateri],
            ["Informasi Tambahan", c.infoTambahan],
          ]}
        />
      ) : isLainnya ? (
        <Dl
          fields={[
            ["Paket Dukungan", c.program],
            ["Pilihan Kontribusi/Topik", c.jenisDukungan || c.paketBantuan],
            ["Informasi Tambahan", c.infoTambahan],
          ]}
        />
      ) : (
        <Dl
          fields={[
            ["Paket Dukungan", c.paketBantuan],
            ["Nilai Kontribusi", c.nilaiKontribusi],
            ["Jumlah Penerima", (c.jumlahPenerima || 0).toLocaleString("id-ID")],
            ["Target Penerima", c.targetPenerima],
            ["Wilayah", c.wilayah],
            ["Topik / Materi", c.topikMateri || c.topik],
            ["Informasi Tambahan", c.infoTambahan],
          ]}
        />
      )}

      {isSchoolProgram && c.sekolahDetail && c.sekolahDetail.length > 0 && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Nama Satuan Pendidikan</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">NPSN</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Lokasi</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Link Lokasi</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Pilihan Kontribusi</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Estimasi Dana</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {c.sekolahDetail.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600">{s.npsn}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-40">{s.lokasi}</td>
                    <td className="px-3 py-2">
                      {s.linkLokasi ? (
                        <a
                          href={s.linkLokasi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Lihat <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{s.kontribusi || "-"}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{s.estimasiDana || "-"}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-40">{s.catatan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function DokumenPKSSection({ c }: { c: Contribution }) {
  const draftLog =
    [...c.aktivitas].reverse().find((a) => a.action === "Setuju Hasil Audiensi") ||
    c.aktivitas[c.aktivitas.length - 1];
  const generatedAt = new Date(draftLog ? draftLog.timestamp : c.lastUpdate);
  const tanggal = generatedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const waktu = generatedAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const namaDokumen = `Draf PKS ${c.paketBantuan} (Biro KS).pdf`;
  const pksLog = [...c.aktivitas]
    .reverse()
    .find((a) => a.action === "Isi Data PKS Mitra");
  const pksFilled = !!pksLog;
  const mitraAt = pksLog ? new Date(pksLog.timestamp) : null;
  const mitraTanggal = mitraAt?.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mitraWaktu = mitraAt?.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const namaDokumenMitra = `Draf PKS ${c.paketBantuan} (Mitra).pdf`;
  const isPembahasan = c.workflowStatus === "perjanjian-pembahasan-pks";
  const isFinalisasi = c.workflowStatus === "perjanjian-finalisasi-pks";
  const isPelaksanaanPersiapan = c.workflowStatus === "pelaksanaan-persiapan";
  const isDalamProses = c.workflowStatus === "pelaksanaan-dalam-proses";
  const isSelesai = c.workflowStatus === "selesai";
  const isAfterBiroHukum = [
    "perjanjian-pembahasan-pks",
    "perjanjian-finalisasi-pks",
    "pelaksanaan-persiapan",
    "pelaksanaan-dalam-proses",
    "selesai",
  ].includes(c.workflowStatus);
  const biroHukumLog = [...c.aktivitas]
    .reverse()
    .find((a) => a.action === "Ajukan Perjanjian");
  const biroHukumAt = new Date(biroHukumLog ? biroHukumLog.timestamp : c.lastUpdate);
  const biroHukumTanggal = biroHukumAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const biroHukumWaktu = biroHukumAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const namaDokumenBiroHukum = `Draf PKS ${c.paketBantuan} (Biro Hukum).pdf`;
  const signLog = [...c.aktivitas]
    .reverse()
    .find((a) => a.action === "Perjanjian Telah Disetujui");
  const signAt = new Date(signLog ? signLog.timestamp : c.lastUpdate);
  const signTanggal = signAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const signWaktu = signAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const namaDokumenTtd = "PKS yang menunggu ditandatangani.pdf";
  const signedLog = [...c.aktivitas]
    .reverse()
    .find((a) => a.action === "Lanjut Pelaksanaan");
  const signedAt = new Date(signedLog ? signedLog.timestamp : c.lastUpdate);
  const signedTanggal = signedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const signedWaktu = signedAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const namaDokumenSigned = "PKS yang sudah ditandatangani.pdf";

  return (
    <SectionCard
      icon={<FileText className="h-4 w-4" />}
      title="Dokumen PKS"
      actions={
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isDalamProses || isSelesai
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {isPelaksanaanPersiapan
            ? "Menunggu Ditandatangani"
            : isDalamProses || isSelesai
            ? "Sudah Ditandatangani"
            : isPembahasan
            ? "Menunggu Pembahasan"
            : isFinalisasi
            ? "Menunggu Finalisasi"
            : pksFilled
            ? "Menunggu draft dari Biro Hukum"
            : "Menunggu data mitra"}
        </span>
      }
    >
      <div className="divide-y divide-gray-100">
        <div className="flex items-start gap-3 py-2">
          <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-900 text-sm truncate block">{namaDokumen}</span>
            <p className="text-xs text-gray-400 mt-0.5">
              Digenerate oleh Biro Kerjasama · {tanggal} pukul {waktu}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "#";
                link.download = namaDokumen;
                link.click();
              }}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Lihat
            </button>
          </div>
        </div>
        {pksLog && (
          <div className="flex items-start gap-3 py-2">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 text-sm truncate block">{namaDokumenMitra}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Digenerate oleh {pksLog.actor} · {mitraTanggal} pukul {mitraWaktu}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = namaDokumenMitra;
                  link.click();
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Lihat
              </button>
            </div>
          </div>
        )}
        {isAfterBiroHukum && (
          <div className="flex items-start gap-3 py-2">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 text-sm truncate block">{namaDokumenBiroHukum}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Digenerate oleh Biro Hukum · {biroHukumTanggal} pukul {biroHukumWaktu}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = namaDokumenBiroHukum;
                  link.click();
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Lihat
              </button>
            </div>
          </div>
        )}
        {(isPelaksanaanPersiapan || isDalamProses || isSelesai) && (
          <div className="flex items-start gap-3 py-2">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 text-sm truncate block">{namaDokumenTtd}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Digenerate oleh {signLog ? signLog.actor : "Biro Kerjasama"} · {signTanggal} pukul {signWaktu}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = namaDokumenTtd;
                  link.click();
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Lihat
              </button>
            </div>
          </div>
        )}
        {(isDalamProses || isSelesai) && (
          <div className="flex items-start gap-3 py-2">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 text-sm truncate block">{namaDokumenSigned}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Digenerate oleh {signedLog ? signedLog.actor : "Biro Kerjasama"} · {signedTanggal} pukul {signedWaktu}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = namaDokumenSigned;
                  link.click();
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Lihat
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function DokumenSection({
  c,
  onDokumenChange,
}: {
  c: Contribution;
  onDokumenChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputId = `mitra-dokumen-upload-${c.id}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newDocs: Document[] = Array.from(files).map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: file.name,
      type: "lainnya" as Document["type"],
      uploadedAt: new Date(),
      uploadedBy: c.narahubung || c.namaMitra,
    }));

    const updated = getContributionById(c.id);
    if (updated) {
      updated.dokumen = [...updated.dokumen, ...newDocs];
      updateContribution(updated);
    }
    setUploading(false);
    onDokumenChange();

    if (e.target) e.target.value = "";
  };

  const handleDelete = (docId: string) => {
    const updated = getContributionById(c.id);
    if (updated) {
      updated.dokumen = updated.dokumen.filter((d) => d.id !== docId);
      updateContribution(updated);
      onDokumenChange();
    }
  };

  const dokumenPendukung = c.dokumen.filter(
    (d) => d.type !== "pks-draft" && d.type !== "pks-final"
  );

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Dokumen Pendukung Lainnya
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Mengunggah..." : "Upload Dokumen"}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {dokumenPendukung.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 py-2">
              <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 text-sm truncate block">{doc.name}</span>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.uploadedAt)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <a
                  href={doc.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Lihat
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}

        {dokumenPendukung.length === 0 && (
          <p className="py-2 text-sm text-gray-400">Belum ada dokumen pendukung.</p>
        )}
      </div>
    </div>
  );
}
