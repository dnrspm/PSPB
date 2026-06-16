import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ExternalLink, FileText, Download, Eye, Building2, Package, Route, Users } from "lucide-react";
import { getContributionById } from "../data/mockWorkspace";
import { StatusBadge } from "../components/workspace/StatusBadge";
import { WorkflowTimeline } from "../components/detail/WorkflowTimeline";
import { ActionModal } from "../components/modals/ActionModal";
import { getAvailableActions, ACTION_LABELS, WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../lib/workflow";
import type { SessionUser } from "../lib/auth";
import type { Contribution, Document, WorkflowAction, WorkflowState } from "../types/contribution";

interface ContributionDetailPageProps {
  currentUser: SessionUser;
}

type Tab = "info" | "timeline" | "pelaksanaan";

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
    ...(c.workflowStatus.startsWith("pelaksanaan-") ? [{ key: "pelaksanaan" as Tab, label: "Pelaksanaan" }] : []),
  ];

  return (
    <div className="h-full flex flex-col bg-white">
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
              <span>Diperbarui: <strong>{formatDate(c.lastUpdate)}</strong></span>
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
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafafa]">
        <div className="p-6">
            {activeTab === "info" && (
              <div className="flex gap-6">
                <div className="flex-1 max-w-4xl">
                  <InfoTab contribution={c} />
                </div>
                <div className="w-80 shrink-0">
                  <WorkflowStepsSidebar contribution={c} />
                </div>
              </div>
            )}
            {activeTab === "timeline" && (
              <div className="max-w-2xl rounded-lg border border-gray-100 bg-white shadow-sm p-4">
                <WorkflowTimeline contribution={c} />
              </div>
            )}
            {activeTab === "pelaksanaan" && <PelaksanaanTab contribution={c} />}
          </div>
        </div>
      </div>
  );
}

/* ────────────── Informasi Tab ────────────── */

function parseUnitKerjaPIC(aktivitas: Contribution["aktivitas"], fieldKey: string = "Unit Kerja dan PIC"): Array<{ unitKerja: string; emails: string[] }> {
  for (let i = aktivitas.length - 1; i >= 0; i--) {
    const fields = aktivitas[i].fields;
    if (!fields) continue;
    const raw = fields[fieldKey];
    if (!raw) continue;
    const result: Array<{ unitKerja: string; emails: string[] }> = [];
    const regex = /([^(]+)\(([^)]*)\)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const unitKerja = match[1].replace(/^[\s,|]+|[\s,|]+$/g, "");
      const emails = match[2].split(",").map(e => e.trim()).filter(Boolean);
      if (unitKerja) result.push({ unitKerja, emails });
    }
    return result;
  }
  return [];
}

function InfoTab({ contribution: c }: { contribution: Contribution }) {
  const isSchoolProgram = c.program === "Infrastruktur Digital" || c.program === "Revitalisasi Sekolah";
  const isPlatformGtk = c.program === "Pengembangan Platform Digital" || c.program === "Pendampingan Pelatihan GTK";
  const isBahanAjar = c.program === "Bahan Ajar Digital";
  const isLainnya = c.program === "Kebutuhan Pendidikan Lainnya";
  const unitKerjaPIC = useMemo(() => {
    const parsed1 = parseUnitKerjaPIC(c.aktivitas, "Unit Kerja dan PIC");
    const parsed2 = parseUnitKerjaPIC(c.aktivitas, "Email Satuan Kerja");
    const allKeys = new Set<string>();
    parsed1.forEach(p => allKeys.add(p.unitKerja.toUpperCase()));
    parsed2.forEach(p => allKeys.add(p.unitKerja.toUpperCase()));
    return Array.from(allKeys).map(key => {
      const from1 = parsed1.find(p => p.unitKerja.toUpperCase() === key);
      const from2 = parsed2.find(p => p.unitKerja.toUpperCase() === key);
      return {
        unitKerja: from1?.unitKerja || from2?.unitKerja || key,
        emailsSekretariat: from1?.emails || [],
        emailsSatuanKerja: from2?.emails || [],
      };
    });
  }, [c.aktivitas]);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Informasi Mitra */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Informasi Mitra</h3>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-5">
          <div className="sm:col-span-2">
            <dt className="text-gray-400">Nama Instansi</dt>
            <dd className="text-gray-900">{c.instansi}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Badan Hukum</dt>
            <dd className="text-gray-900">{c.badanHukum || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Status Mitra (Lama/Baru)</dt>
            <dd className="text-gray-900">{c.statusMitra || "-"}</dd>
          </div>
        </dl>

        <hr className="mb-5 border-gray-100" />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-400">Nama Narahubung</dt>
            <dd className="text-gray-900">{c.narahubung}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Jabatan &amp; Posisi</dt>
            <dd className="text-gray-900">{c.jabatan || "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Nomor Telepon</dt>
            <dd className="text-gray-900">{c.kontak}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Email</dt>
            <dd className="text-gray-900">{c.email}</dd>
          </div>
        </dl>
      </div>

      {/* Informasi Bantuan – Sekolah (Infrastruktur Digital & Revitalisasi Sekolah) */}
      {isSchoolProgram && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-5">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-900">{c.targetPenerima}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-900">{c.wilayah}</dd>
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
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-900">{c.targetPenerima}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-900">{c.wilayah}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Topik</dt>
              <dd className="text-gray-900">{c.topik || "-"}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-900">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Informasi Bantuan – Bahan Ajar Digital */}
      {isBahanAjar && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-900">{c.targetPenerima}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-900">{c.wilayah}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Untuk Siapa</dt>
              <dd className="text-gray-900">{c.untukSiapa || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Jenjang Sekolah</dt>
              <dd className="text-gray-900">{c.jenjangSekolah || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Topik / Materi</dt>
              <dd className="text-gray-900">{c.topikMateri || "-"}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-900">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Informasi Bantuan – Beragam Dukungan Pendidikan */}
      {isLainnya && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Pilihan Kontribusi/Topik</dt>
              <dd className="text-gray-900">{c.jenisDukungan || "-"}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Target Penerima</dt>
                <dd className="text-gray-900">{c.targetPenerima}</dd>
            </div>
            <div>
                <dt className="text-gray-400">Wilayah</dt>
                <dd className="text-gray-900">{c.wilayah}</dd>
            </div>
            {c.infoTambahan && (
              <div className="sm:col-span-2">
                <dt className="text-gray-400">Informasi Tambahan</dt>
                <dd className="text-gray-900">{c.infoTambahan}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Unit Kerja dan PIC */}
      {unitKerjaPIC.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Users className="h-4 w-4" /> Unit Kerja dan PIC</h3>
          <div className="space-y-4">
            {unitKerjaPIC.map((item, i) => (
              <div key={i}>
                {i > 0 && <hr className="mb-4 border-gray-100" />}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-400">Unit Kerja</dt>
                    <dd className="mt-0.5 font-medium text-gray-900 text-sm">{item.unitKerja}</dd>
                  </div>
                  {item.emailsSekretariat.length > 0 && (
                    <div>
                      <dt className="text-gray-400">Sekretariat Unit Utama</dt>
                      <dd className="mt-0.5 text-gray-900 text-sm">
                        {item.emailsSekretariat.map((email, j) => (
                          <span key={j} className="text-sm">{email}{j < item.emailsSekretariat.length - 1 && <br />}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {item.emailsSatuanKerja.length > 0 && (
                    <div>
                      <dt className="text-gray-400">Satuan Kerja</dt>
                      <dd className="mt-0.5 text-gray-900 text-sm">
                        {item.emailsSatuanKerja.map((email, j) => (
                          <span key={j} className="text-sm">{email}{j < item.emailsSatuanKerja.length - 1 && <br />}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>
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

/* ────────────── Workflow Steps Sidebar ────────────── */

const HAPPY_FLOW: WorkflowState[] = [
  "kontribusi-masuk",
  "audiensi-menunggu-jadwal",
  "audiensi-terjadwal",
  "audiensi-konfirmasi-lanjut-pks",
  "perjanjian-draft-pks",
  "perjanjian-pembahasan-pks",
  "perjanjian-finalisasi-pks",
  "pelaksanaan-persiapan",
  "pelaksanaan-dalam-proses",
  "pemantauan-terlaksana",
  "selesai",
];

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function WorkflowStepsSidebar({ contribution: c }: { contribution: Contribution }) {
  const currentIndex = HAPPY_FLOW.indexOf(c.workflowStatus as WorkflowState);
  const isTerminal = c.workflowStatus === "selesai" || c.workflowStatus === "tidak-dilanjutkan";

  const getStepInfo = (state: WorkflowState, isCurrent: boolean) => {
    const toEntry = c.aktivitas.find(a => a.toState === state);
    const fromEntry = c.aktivitas.find(a => a.fromState === state);
    const date = toEntry?.timestamp || fromEntry?.timestamp || (isCurrent ? c.lastUpdate : undefined);
    let dokumenTerkait: Document[] = [];
    if (state === "kontribusi-masuk") {
      dokumenTerkait = c.dokumen.filter(d => d.type === "proposal");
    } else if (state === "perjanjian-finalisasi-pks" && !isCurrent) {
      const fromEntry = c.aktivitas.find(a => a.fromState === state);
      if (fromEntry?.fields?._docIds) {
        const ids = fromEntry.fields._docIds.split(",");
        dokumenTerkait = c.dokumen.filter(d => ids.includes(d.id));
      }
    }
    return { date, dokumenTerkait };
  };

  return (
    <div className="sticky top-0 rounded-lg border border-gray-100 bg-white shadow-sm p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Route className="h-4 w-4" /> Alur Status</h3>
      <div className="relative">
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />

        <div className="space-y-0">
          {HAPPY_FLOW.map((state, i) => {
            const isCurrent = c.workflowStatus === state;
            const isPast = currentIndex >= 0 && i < currentIndex;
            const isFuture = currentIndex >= 0 && i > currentIndex;
            const info = getStepInfo(state, isCurrent);

            return (
              <div key={state} className="relative flex items-start gap-3 pb-4 last:pb-0">
                <div className="relative z-10 mt-0.5 shrink-0">
                  {isCurrent ? (
                    <span className="flex h-[18px] w-[18px] items-center justify-center">
                      <span className="absolute h-[18px] w-[18px] animate-ping rounded-full bg-blue-400 opacity-40" />
                      <span className="relative h-[18px] w-[18px] rounded-full border-2 border-blue-600 bg-white" />
                    </span>
                  ) : isPast ? (
                    <div className="h-[18px] w-[18px] rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isTerminal && i > currentIndex ? (
                    <div className="h-[18px] w-[18px] rounded-full bg-gray-200" />
                  ) : (
                    <div className="h-[18px] w-[18px] rounded-full border-2 border-gray-200 bg-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-sm leading-tight whitespace-nowrap ${
                    isCurrent
                      ? "font-semibold text-blue-700"
                      : isPast
                        ? "font-medium text-gray-600"
                        : "text-gray-400"
                  }`}>
                    {WORKFLOW_STATE_LABELS[state]}
                  </p>
                  {(isPast || isCurrent) && info.date && (
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(info.date)}</p>
                  )}
                  {(isPast || isCurrent) && info.dokumenTerkait.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {info.dokumenTerkait.map(doc => (
                        <a
                          key={doc.id}
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-500 hover:text-blue-700 hover:underline truncate max-w-56"
                        >
                          {doc.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
