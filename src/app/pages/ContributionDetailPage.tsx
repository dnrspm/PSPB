import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ExternalLink, FileText, Download, Eye, Building2, Package, Route, Users, Upload, X } from "lucide-react";
import { getContributionById, updateContribution } from "../data/mockWorkspace";
import { StatusBadge } from "../components/workspace/StatusBadge";
import { WorkflowTimeline } from "../components/detail/WorkflowTimeline";
import { ActionModal } from "../components/modals/ActionModal";
import { getAvailableActions, ACTION_LABELS, WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../lib/workflow";
import type { SessionUser } from "../lib/auth";
import type { Contribution, Document, WorkflowAction, WorkflowState } from "../types/contribution";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../data/regionData";

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

  const handleDokumenChange = useCallback(() => {
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
                  <InfoTab contribution={c} onDokumenChange={handleDokumenChange} />
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

function getLabelByValue(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label || value;
}

function findTargetPenerima(aktivitas: Contribution["aktivitas"]): Record<string, string> | null {
  for (let i = aktivitas.length - 1; i >= 0; i--) {
    const f = aktivitas[i].fields;
    if (f && f["Siswa"] && f["Guru"]) return f;
  }
  return null;
}

function InfoTab({ contribution: c, onDokumenChange }: { contribution: Contribution; onDokumenChange?: () => void }) {
  const isSchoolProgram = c.program === "Infrastruktur Digital" || c.program === "Revitalisasi Sekolah";
  const isPlatformGtk = c.program === "Pengembangan Platform Digital" || c.program === "Pendampingan Pelatihan GTK";
  const isBahanAjar = c.program === "Bahan Ajar Digital";
  const isLainnya = c.program === "Kebutuhan Pendidikan Lainnya";
  const targetPenerima = useMemo(() => findTargetPenerima(c.aktivitas), [c.aktivitas]);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Informasi Mitra</h3>
        </div>

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-5">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}: {c.paketBantuan}</dd>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Informasi Bantuan</h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Paket Dukungan</dt>
              <dd className="text-gray-900">{c.program}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Pilihan Kontribusi/Topik</dt>
              <dd className="text-gray-900">{c.jenisDukungan || "-"}</dd>
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

      {/* Target Penerima */}
      {targetPenerima && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Package className="h-4 w-4" /> Target Penerima</h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Siswa</dt>
              <dd className="text-gray-900">{targetPenerima["Siswa"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Guru</dt>
              <dd className="text-gray-900">{targetPenerima["Guru"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Satuan Pendidikan</dt>
              <dd className="text-gray-900">{targetPenerima["Satuan Pendidikan"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Wilayah</dt>
              <dd className="text-gray-900">
                {(() => {
                  const provLabel = getLabelByValue(PROVINSI_OPTIONS, targetPenerima["Provinsi"] || "");
                  const kabLabel = getLabelByValue(
                    KABUPATEN_BY_PROVINSI[targetPenerima["Provinsi"] || ""] || [],
                    targetPenerima["Kota/Kabupaten"] || ""
                  );
                  const parts: string[] = [];
                  if (kabLabel) parts.push(`Kab. ${kabLabel}`);
                  if (targetPenerima["Kecamatan"]) parts.push(`Kec. ${targetPenerima["Kecamatan"]}`);
                  if (targetPenerima["Kelurahan"]) parts.push(`Kel. ${targetPenerima["Kelurahan"]}`);
                  return parts.length > 0 ? `${provLabel}, ${parts.join(", ")}` : provLabel;
                })()}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Unit Kerja dan PIC */}
      {unitKerjaPIC.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Users className="h-4 w-4" /> Unit Kerja dan PIC</h3>
          </div>
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

      {/* Dokumen */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Dokumen
          </h3>
          <DocumentUpload contribution={c} onDokumenChange={onDokumenChange} />
        </div>

        <div className="divide-y divide-gray-100">
          <div className="flex items-start gap-3 py-2">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 text-sm truncate block">Company Profile {c.namaMitra}</span>
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
          {c.dokumen.filter(d => d.type !== "proposal").map(doc => (
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
                  onClick={() => {
                    const updated = getContributionById(c.id);
                    if (updated) {
                      updated.dokumen = updated.dokumen.filter(d => d.id !== doc.id);
                      updateContribution(updated);
                      onDokumenChange?.();
                    }
                  }}
                  className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ contribution: c, onDokumenChange }: { contribution: Contribution; onDokumenChange?: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newDocs: Document[] = Array.from(files).map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: file.name,
      type: "lainnya" as Document["type"],
      uploadedAt: new Date(),
      uploadedBy: "Admin",
    }));

    const updated = getContributionById(c.id);
    if (updated) {
      updated.dokumen = [...updated.dokumen, ...newDocs];
      updateContribution(updated);
    }
    setUploading(false);
    onDokumenChange?.();

    if (e.target) e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
        onChange={handleFileChange}
        className="hidden"
        id="dokumen-upload-input"
      />
      <button
        type="button"
        onClick={() => document.getElementById("dokumen-upload-input")?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Mengunggah..." : "Upload Dokumen"}
      </button>
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

function WorkflowStepsSidebar({ contribution: c }: { contribution: Contribution }) {
  const currentIndex = HAPPY_FLOW.indexOf(c.workflowStatus as WorkflowState);
  const isTerminal = c.workflowStatus === "selesai" || c.workflowStatus === "tidak-dilanjutkan";
  const [popupState, setPopupState] = useState<WorkflowState | null>(null);
  const maxReachedIdx = Math.max(
    ...c.aktivitas.flatMap(a => {
      const fromIdx = HAPPY_FLOW.indexOf(a.fromState as WorkflowState);
      const toIdx = HAPPY_FLOW.indexOf(a.toState as WorkflowState);
      return [fromIdx, toIdx];
    }).filter(idx => idx >= 0),
    -1
  );
  const rejectedState: WorkflowState | undefined = c.workflowStatus === "tidak-dilanjutkan"
    ? c.aktivitas.find(a => a.action === "Tidak Dilanjutkan")?.fromState
    : undefined;

  const getStepInfo = (state: WorkflowState) => {
    const currentIdx = HAPPY_FLOW.indexOf(c.workflowStatus as WorkflowState);
    const stateIdx = HAPPY_FLOW.indexOf(state);
    const allSorted = [...c.aktivitas].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const allLinkedDocIds = allSorted
      .filter(a => a.fromState === state || a.toState === state)
      .flatMap(a => a.fields?._docIds ? a.fields._docIds.split(",") : [])
      .filter(Boolean);
    const dokumenTerkait = c.dokumen.filter(d => allLinkedDocIds.includes(d.id));
    let latestVisitDocIds: string[];
    if (currentIdx >= 0 && stateIdx > currentIdx) {
      latestVisitDocIds = [];
    } else if (c.workflowStatus === state) {
      const latestReentryIndex = allSorted.findIndex(a => a.fromState !== state);
      const currentVisitEntries = latestReentryIndex === -1
        ? allSorted
        : allSorted.slice(0, latestReentryIndex);
      latestVisitDocIds = currentVisitEntries
        .filter(a => a.fromState === state)
        .flatMap(a => a.fields?._docIds ? a.fields._docIds.split(",") : [])
        .filter(Boolean);
    } else {
      const stateEntries = allSorted.filter(a => a.fromState === state || a.toState === state);
      latestVisitDocIds = stateEntries
        .find(a => a.fields?._docIds)?.fields?._docIds?.split(",").filter(Boolean) || [];
    }
    return { dokumenTerkait, latestVisitDocIds };
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
            const isPreviouslyVisited = currentIndex >= 0 && maxReachedIdx > currentIndex && i >= currentIndex && i <= maxReachedIdx;
            const rejectedIndex = rejectedState ? HAPPY_FLOW.indexOf(rejectedState) : -1;
            const isRejected = rejectedIndex >= 0 && i === rejectedIndex;
            const isPastRejected = rejectedIndex >= 0 && i < rejectedIndex;
            const info = getStepInfo(state);
            const popupOpen = popupState === state;

            return (
              <div key={state} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  <div className="relative z-10 mt-0.5 shrink-0">
                    {isRejected ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-red-500" />
                    ) : isCurrent ? (
                      <span className="flex h-[18px] w-[18px] items-center justify-center">
                        <span className="absolute h-[18px] w-[18px] animate-ping rounded-full bg-blue-400 opacity-40" />
                        <span className="relative h-[18px] w-[18px] rounded-full border-2 border-blue-600 bg-white" />
                      </span>
                    ) : isPast || isPastRejected ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isPreviouslyVisited ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-gray-200" />
                    ) : isTerminal && i > currentIndex && c.workflowStatus === "selesai" ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-gray-200" />
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full border-2 border-gray-200 bg-white" />
                    )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-sm leading-tight whitespace-nowrap ${
                    isRejected
                      ? "font-semibold text-red-600"
                      : isPreviouslyVisited && isCurrent
                        ? "font-semibold text-blue-700"
                        : isCurrent
                          ? "font-semibold text-blue-700"
                          : isPast || isPastRejected || isPreviouslyVisited
                            ? "font-medium text-gray-600"
                            : "text-gray-400"
                  }`}>
                    {WORKFLOW_STATE_LABELS[state]}
                  </p>
                  {info.dokumenTerkait.length > 0 && (
                    <button
                      onClick={() => setPopupState(popupOpen ? null : state)}
                      className="mt-1 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <FileText className="h-3 w-3" />
                      Dokumen ({info.dokumenTerkait.length})
                    </button>
                  )}
                </div>

                {popupOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPopupState(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto w-[520px] max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                              <FileText className="h-4 w-4" /> Dokumen
                            </h3>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {WORKFLOW_STATE_LABELS[state]}
                            </span>
                          </div>
                          <button onClick={() => setPopupState(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="px-5 py-3 max-h-80 overflow-y-auto space-y-2">
                          {(() => {
                            const groupedByType: Record<string, Document[]> = {};
                            info.dokumenTerkait.forEach(doc => {
                              const t = doc.type;
                              if (!groupedByType[t]) groupedByType[t] = [];
                              groupedByType[t].push(doc);
                            });
                            const latestDocIdSet = new Set(info.latestVisitDocIds);
                            return Object.values(groupedByType).flatMap(group => {
                              return group.map(doc => {
                                const isLatest = latestDocIdSet.has(doc.id);
                                return (
                                  <div
                                    key={doc.id}
                                    className={`flex items-start gap-3 p-3 rounded-md border ${
                                      isLatest ? "bg-white border-gray-200" : "bg-gray-100 border-gray-300"
                                    }`}
                                  >
                                    <FileText className={`h-5 w-5 shrink-0 mt-0.5 ${isLatest ? "text-blue-400" : "text-gray-400"}`} />
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-sm block ${isLatest ? "text-gray-900" : "text-gray-500"}`}>
                                        {doc.name}
                                      </span>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {formatDate(doc.uploadedAt)} • {new Date(doc.uploadedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • <span className={isLatest ? "text-green-700" : "text-gray-400"}>{isLatest ? "Berlaku" : "Tidak Berlaku"}</span>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                                      <a
                                        href={doc.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                      >
                                        Lihat
                                      </a>
                                      <a
                                        href={doc.url || "#"}
                                        download
                                        className="rounded-md border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800"
                                      >
                                        Unduh
                                      </a>
                                    </div>
                                  </div>
                                );
                              });
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
