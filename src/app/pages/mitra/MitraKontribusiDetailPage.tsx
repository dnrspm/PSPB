import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Building2, ExternalLink, FileText, Package, School } from "lucide-react";
import { getMitraContributionById, getMitraSession } from "../../lib/mitra";
import { StatusBadge } from "../../components/workspace/StatusBadge";
import { WorkflowTimeline } from "../../components/detail/WorkflowTimeline";
import { WorkflowStepsSidebar, formatDate } from "../../components/detail/WorkflowStepsSidebar";
import type { Contribution } from "../../types/contribution";

type Tab = "info" | "timeline";

export default function MitraKontribusiDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = getMitraSession();
  const contribution =
    session && id ? getMitraContributionById(session.email, id) : null;
  const [activeTab, setActiveTab] = useState<Tab>("info");

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
  const topikTitle =
    c.topik || c.topikMateri || c.jenisDukungan || c.paketBantuan || c.program;
  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Informasi" },
    { key: "timeline", label: "Riwayat Alur Kerja" },
  ];

  return (
    <div>
      {/* Header Summary */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-semibold text-black">{topikTitle}</h1>
              {c.paketBantuan && c.paketBantuan !== topikTitle && (
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {c.paketBantuan}
                </span>
              )}
              <StatusBadge state={c.workflowStatus} />
            </div>
            <p className="text-sm text-gray-400">
              Diperbarui:{" "}
              <span className="font-medium text-gray-500">
                {formatDate(c.lastUpdate)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 bg-white px-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6 pr-0">
        {activeTab === "info" && (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0 space-y-6">
              <InformasiMitra c={c} />
              <InformasiBantuan c={c} />
              <TargetPenerima c={c} />
              <DokumenSection c={c} />
            </div>
            <div className="w-84 shrink-0">
              <WorkflowStepsSidebar contribution={c} />
            </div>
          </div>
        )}
        {activeTab === "timeline" && (
          <div className="max-w-2xl rounded-lg border border-gray-100 bg-white shadow-sm p-4">
            <WorkflowTimeline contribution={c} />
          </div>
        )}
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

function InformasiMitra({ c }: { c: Contribution }) {
  return (
    <SectionCard icon={<Building2 className="h-4 w-4" />} title="Informasi Mitra">
      <Dl
        fields={[
          ["Nama Instansi", c.instansi || c.namaMitra],
          ["Badan Hukum", c.badanHukum],
          ["Status Mitra (Lama/Baru)", c.statusMitra],
        ]}
      />
      <hr className="my-5 border-gray-100" />
      <Dl
        fields={[
          ["Nama Narahubung", c.narahubung],
          ["Jabatan & Posisi", c.jabatan],
          ["Nomor Telepon", c.kontak],
          ["Email", c.email],
        ]}
      />
    </SectionCard>
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

function TargetPenerima({ c }: { c: Contribution }) {
  const hasData = !!(c.targetPenerima || c.wilayah || c.jumlahPenerima);
  if (!hasData) return null;

  return (
    <SectionCard icon={<School className="h-4 w-4" />} title="Target Penerima">
      <Dl
        fields={[
          ["Target Penerima", c.targetPenerima],
          ["Jumlah Penerima", c.jumlahPenerima ? (c.jumlahPenerima || 0).toLocaleString("id-ID") : ""],
          ["Wilayah", c.wilayah],
        ]}
      />
    </SectionCard>
  );
}

function DokumenSection({ c }: { c: Contribution }) {
  return (
    <SectionCard icon={<FileText className="h-4 w-4" />} title="Dokumen Pendukung Lainnya">
      {c.dokumen.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada dokumen.</p>
      ) : (
        <div className="divide-y divide-gray-100">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
