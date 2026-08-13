import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink, FileText, Package, Upload } from "lucide-react";
import { getMitraContributionById, getMitraSession } from "../../lib/mitra";
import { getContributionById, updateContribution } from "../../data/mockWorkspace";
import { StatusBadge } from "../../components/workspace/StatusBadge";
import { WorkflowStepsSidebar, formatDate } from "../../components/detail/WorkflowStepsSidebar";
import type { Contribution, Document } from "../../types/contribution";

export default function MitraKontribusiDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = getMitraSession();
  // Dipakai untuk merender ulang setelah dokumen diunggah/dihapus
  const [dokumenVersion, setDokumenVersion] = useState(0);
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

  return (
    <div>
      {/* Konten */}
      <div className="pr-0">
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
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
        {icon} {title}
      </h3>
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
        {/* Company Profile mitra — dokumen bawaan, tidak dapat dihapus */}
        <div className="flex items-start gap-3 py-2">
          <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-900 text-sm truncate block">
              Company Profile {c.namaMitra}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Company Profile</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <a
              href={c.companyProfile || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Lihat
            </a>
          </div>
        </div>

        {c.dokumen.map((doc) => (
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
      </div>
    </div>
  );
}
