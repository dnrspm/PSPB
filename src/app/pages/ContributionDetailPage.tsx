import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ExternalLink, MapPin, Users, DollarSign, Phone, Mail, FileText, Download, Eye } from "lucide-react";
import { getContributionById } from "../data/mockWorkspace";
import { StatusBadge } from "../components/workspace/StatusBadge";
import { WorkflowTimeline } from "../components/detail/WorkflowTimeline";
import { ActionModal } from "../components/modals/ActionModal";
import { getAvailableActions, ACTION_LABELS } from "../lib/workflow";
import type { SessionUser } from "../lib/auth";
import type { Contribution, WorkflowAction } from "../types/contribution";

interface ContributionDetailPageProps {
  currentUser: SessionUser;
}

type Tab = "info" | "timeline" | "dokumen" | "pelaksanaan";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function ContributionDetailPage({ currentUser }: ContributionDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [, forceRefresh] = useState(0);
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);

  const contribution = id ? getContributionById(id) : undefined;

  const handleActionComplete = useCallback(() => {
    forceRefresh((n) => n + 1);
  }, []);

  if (!contribution) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <p className="text-gray-500">Kontribusi tidak ditemukan.</p>
          <button onClick={() => navigate("/workspace")} className="mt-3 text-sm text-blue-600 hover:underline">
            Kembali ke Dasbor Operasional
          </button>
        </div>
      </div>
    );
  }

  const c = getContributionById(id!)!;

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Informasi" },
    { key: "timeline", label: "Riwayat Alur Kerja" },
    { key: "dokumen", label: "Dokumen" },
    ...(c.workflowStatus.startsWith("pelaksanaan-") ? [{ key: "pelaksanaan" as Tab, label: "Pelaksanaan" }] : []),
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      {/* Header Summary */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <button
          onClick={() => navigate("/workspace")}
          className="mb-2 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Dasbor Operasional
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[24px] font-semibold text-black">{c.namaMitra}</h1>
              <StatusBadge state={c.workflowStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
              <span>{c.program}: <strong>{c.paketBantuan}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Unit Kerja: <strong>{c.unitKerja || "-"}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Diperbarui: {formatDate(c.lastUpdate)}</span>
            </div>
          </div>

          {/* Action buttons */}
          {(() => {
            const actions = getAvailableActions(c.workflowStatus, currentUser.role).filter(a => a !== "view-detail");
            if (actions.length === 0) return null;
            return (
              <div className="flex items-center gap-2">
                {actions.map((action, i) => (
                  <button
                    key={action}
                    onClick={() => setActiveAction(action)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      i === 0
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {activeAction && (
          <ActionModal
            action={activeAction}
            contribution={c}
            currentUser={currentUser}
            onClose={() => setActiveAction(null)}
            onSuccess={() => { handleActionComplete(); setActiveAction(null); }}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 bg-white px-6">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && <InfoTab contribution={c} />}
          {activeTab === "timeline" && (
            <div className="max-w-2xl rounded-lg border border-gray-100 bg-white shadow-sm p-4">
              <WorkflowTimeline contribution={c} />
            </div>
          )}
          {activeTab === "dokumen" && <DokumenTab contribution={c} />}
          {activeTab === "pelaksanaan" && <PelaksanaanTab contribution={c} />}
        </div>
      </div>
    </div>
  );
}

/* ────────────── Informasi Tab ────────────── */

function InfoTab({ contribution: c }: { contribution: Contribution }) {
  const isSchoolProgram = c.program === "Infrastruktur Digital" || c.program === "Revitalisasi Sekolah";
  const isPlatformGtk = c.program === "Pengembangan Platform Digital" || c.program === "Pendampingan Pelatihan GTK";
  const isBahanAjar = c.program === "Bahan Ajar Digital";
  const isLainnya = c.program === "Kebutuhan Pendidikan Lainnya";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Informasi Mitra */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Mitra</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-400">Badan Hukum</dt>
            <dd className="font-medium text-gray-900">{c.badanHukum || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Status Mitra</dt>
            <dd className="font-medium text-gray-900">{c.statusMitra || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Nama Instansi</dt>
            <dd className="font-medium text-gray-900">{c.instansi}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Nama Narahubung</dt>
            <dd className="text-gray-700">{c.narahubung}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div>
              <dt className="text-gray-400">Nomor Telepon Narahubung</dt>
              <dd className="text-gray-700">{c.kontak}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div>
              <dt className="text-gray-400">Email Narahubung</dt>
              <dd className="text-gray-700">{c.email}</dd>
            </div>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-400">Jabatan &amp; Posisi</dt>
            <dd className="font-medium text-gray-900">{c.jabatan || "-"}</dd>
          </div>
        </dl>
      </div>

      {/* Informasi Bantuan – Sekolah (Infrastruktur Digital & Revitalisasi Sekolah) */}
      {isSchoolProgram && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-5">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="font-medium text-gray-900">{c.paketBantuan}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-700">{c.targetPenerima}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-700">{c.wilayah}</dd>
              </div>
            </div>
          </dl>

          {(c.sekolahDetail && c.sekolahDetail.length > 0) && (
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
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Catatan Satuan Pendidikan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {c.sekolahDetail.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                      <td className="px-3 py-2 text-gray-600">{s.npsn}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-40">{s.lokasi}</td>
                      <td className="px-3 py-2">
                        <a
                          href={s.linkLokasi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Lihat <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{s.kontribusi}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{s.estimasiDana}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-40">{s.catatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Informasi Bantuan – Platform Digital / Pelatihan GTK */}
      {isPlatformGtk && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="font-medium text-gray-900">{c.paketBantuan}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-700">{c.targetPenerima}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-700">{c.wilayah}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-400">Topik</dt>
              <dd className="font-medium text-gray-900">{c.topik || "-"}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-700">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Informasi Bantuan – Bahan Ajar Digital */}
      {isBahanAjar && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="font-medium text-gray-900">{c.paketBantuan}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-700">{c.targetPenerima}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-700">{c.wilayah}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-400">Untuk Siapa</dt>
              <dd className="font-medium text-gray-900">{c.untukSiapa || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Jenjang Sekolah</dt>
              <dd className="font-medium text-gray-900">{c.jenjangSekolah || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Topik / Materi</dt>
              <dd className="text-gray-700">{c.topikMateri || "-"}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-700">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Informasi Bantuan – Beragam Dukungan Pendidikan */}
      {isLainnya && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="font-medium text-gray-900">{c.paketBantuan}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-700">{c.targetPenerima}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-700">{c.wilayah}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-400">Jenis Dukungan</dt>
              <dd className="font-medium text-gray-900">{c.jenisDukungan || "-"}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-700">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

/* ────────────── Dokumen Tab ────────────── */

function DokumenTab({ contribution: c }: { contribution: Contribution }) {
  const docTypeLabel: Record<string, string> = {
    proposal: "Proposal", "pks-draft": "Draf PKS", "pks-final": "PKS Final",
    bast: "BAST", dokumentasi: "Dokumentasi", notulen: "Notulen",
    adendum: "Adendum", lainnya: "Lainnya",
  };

  return (
    <div className="max-w-2xl space-y-2">
      {c.dokumen.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada dokumen.</p>
      ) : (
        c.dokumen.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white shadow-sm p-3">
            <FileText className="h-5 w-5 shrink-0 text-blue-500" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium text-gray-900">{doc.name}</div>
              <div className="text-sm text-gray-400">
                {docTypeLabel[doc.type] ?? doc.type} · Diunggah oleh {doc.uploadedBy} · {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-400 hover:text-blue-600">
                <Eye className="h-4 w-4" />
              </button>
              <button className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-400 hover:text-blue-600">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ────────────── Pelaksanaan Tab ────────────── */

function PelaksanaanTab({ contribution: c }: { contribution: Contribution }) {
  const p = c.pelaksanaan;

  if (!p) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-400">Belum ada data pelaksanaan.</p>
          <p className="mt-1 text-sm text-gray-400">Gunakan tombol aksi untuk memulai pelaksanaan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Status Pelaksanaan</h3>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-sm font-medium text-teal-700">
            {p.progress}%
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Kemajuan</span>
            <span>{p.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${p.progress}%` }}
            />
          </div>
        </div>
        {p.latestUpdate && (
          <p className="mt-3 text-sm text-gray-600">{p.latestUpdate}</p>
        )}
      </div>

      {p.dokumentasi.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Dokumentasi Pelaksanaan</h3>
          <div className="space-y-2">
            {p.dokumentasi.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="flex-1 text-gray-700">{doc.name}</span>
                <button className="rounded border border-gray-200 p-1 text-gray-400 hover:text-blue-600">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button className="rounded border border-gray-200 p-1 text-gray-400 hover:text-blue-600">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
