import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ExternalLink, FileText, Building2, Package, Route, Users, Upload, X, Plus, Trash2, Pencil } from "lucide-react";
import { getContributionById, updateContribution } from "../data/mockWorkspace";
import { StatusBadge } from "../components/workspace/StatusBadge";
import { WorkflowStepsSidebar } from "../components/detail/WorkflowStepsSidebar";
import { ActionModal } from "../components/modals/ActionModal";
import { VervalModal } from "../components/modals/VervalModal";
import { getAvailableActions, ACTION_LABELS, WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS, UNIT_KERJA_OPTIONS } from "../lib/workflow";
import type { SessionUser } from "../lib/auth";
import type { Contribution, DampakPelaksanaan, Document, WorkflowAction, WorkflowState } from "../types/contribution";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../data/regionData";

interface ContributionDetailPageProps {
  currentUser: SessionUser;
}

type Tab = "info" | "pelaksanaan";

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
    // Tetap tampil setelah tahap pelaksanaan lewat, agar realisasi & timeline masih bisa dilihat
    ...(c.workflowStatus.startsWith("pelaksanaan-") || c.pelaksanaan ? [{ key: "pelaksanaan" as Tab, label: "Pelaksanaan" }] : []),
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
      {tabs.length > 1 && (
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
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafafa]">
          <div className="p-6">
            {activeTab === "info" && (
              <div className="flex gap-6">
                <div className="flex-1 max-w-4xl">
                  <InfoTab contribution={c} onDokumenChange={handleDokumenChange} currentUser={currentUser} />
                </div>
                <div className="w-84 shrink-0">
                  <WorkflowStepsSidebar contribution={c} />
                </div>
              </div>
            )}
            {activeTab === "pelaksanaan" && <PelaksanaanTab contribution={c} />}
          </div>
        </div>
    </div>
  );
}

/* ────────────── Verifikasi dan Validasi Block ────────────── */

function VerifikasiBlock({ picEmails, contribution, currentUser, onRefresh }: {
  picEmails: string[];
  contribution: Contribution;
  currentUser: SessionUser;
  onRefresh: () => void;
}) {
  const [vervalOpen, setVervalOpen] = useState(false);
  const [viewVervalOpen, setViewVervalOpen] = useState(false);
  const vervalDone = contribution.aktivitas.some(a => a.action === "Verifikasi dan Validasi");
  const vervalLog = contribution.aktivitas.filter(a => a.action === "Verifikasi dan Validasi").pop();

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Verifikasi dan Validasi
        </h3>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm mb-4">
        <div>
          <dt className="text-gray-400">PIC Biro Kerjasama</dt>
          <dd className="mt-0.5 text-gray-900 text-sm">
            {picEmails.map((email, j) => (
              <span key={j} className="text-sm">{email}{j < picEmails.length - 1 && <br />}</span>
            ))}
          </dd>
        </div>
      </dl>

      <div className={`rounded-lg border p-4 ${vervalDone ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${vervalDone ? 'text-green-700' : 'text-yellow-700'}`}>
              {vervalDone ? 'Form verifikasi dan validasi sudah diisi' : 'Form verifikasi dan validasi belum diisi'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {vervalDone && vervalLog
                ? `Diperbaharui ${vervalLog.actor} pada ${(vervalLog.timestamp as Date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} pukul ${(vervalLog.timestamp as Date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                : 'Isi form verval sesuai hasil diskusi dengan calon mitra'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVervalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-opacity-80 ${
                vervalDone
                  ? 'border-green-300 bg-green-100 text-green-700 hover:bg-green-200'
                  : 'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {vervalDone ? 'Edit Verval' : 'Isi Form Verval'}
            </button>
          </div>
        </div>
      </div>

      {vervalOpen && (
        <VervalModal
          contribution={contribution}
          currentUser={currentUser}
          onClose={() => setVervalOpen(false)}
          onSuccess={onRefresh}
          initialFields={vervalLog?.fields}
        />
      )}
    </div>
  );
}


/* ────────────── Informasi Tab ────────────── */

function parseUnitKerjaPIC(aktivitas: Contribution["aktivitas"], fieldKey: string = "Unit Kerja dan PIC", defaultUnitKerja?: string): Array<{ unitKerja: string; emails: string[] }> {
  const result: Array<{ unitKerja: string; emails: string[] }> = [];
  for (let i = 0; i < aktivitas.length; i++) {
    const fields = aktivitas[i].fields;
    if (!fields) continue;
    const raw = fields[fieldKey];
    if (!raw) continue;
    const regex = /([^(]+)\(([^)]*)\)/g;
    let match;
    let parsed = false;
    while ((match = regex.exec(raw)) !== null) {
      parsed = true;
      const unitKerja = match[1].replace(/^[\s,|]+|[\s,|]+$/g, "").trim();
      if (!unitKerja) continue;
      const emails = match[2].split(",").map(e => e.trim()).filter(Boolean);
      const existing = result.find(r => r.unitKerja.toUpperCase() === unitKerja.toUpperCase());
      if (existing) {
        for (const e of emails) {
          if (!existing.emails.includes(e)) existing.emails.push(e);
        }
      } else {
        result.push({ unitKerja, emails });
      }
    }
    if (!parsed && defaultUnitKerja) {
      const existing = result.find(r => r.unitKerja.toUpperCase() === defaultUnitKerja.toUpperCase());
      if (existing) {
        if (!existing.emails.includes(raw)) existing.emails.push(raw);
      } else {
        result.push({ unitKerja: defaultUnitKerja, emails: [raw] });
      }
    }
  }
  return result;
}

function getLabelByValue(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label || value;
}

function findTargetPenerima(aktivitas: Contribution["aktivitas"]): Record<string, string> | null {
  for (let i = aktivitas.length - 1; i >= 0; i--) {
    const f = aktivitas[i].fields;
    if (f && (f["Siswa Terdampak"] || f["Siswa"]) && (f["Guru Terdampak"] || f["Guru"])) return f;
  }
  return null;
}

function InfoTab({ contribution: c, onDokumenChange, currentUser }: { contribution: Contribution; onDokumenChange?: () => void; currentUser: SessionUser }) {
  const [tambahPICOpen, setTambahPICOpen] = useState(false);
  const [picEditMode, setPicEditMode] = useState(false);
  const [editingPICEmail, setEditingPICEmail] = useState<{ unitKerja: string; type: "sekretariat" | "satuan-kerja"; email: string } | null>(null);
  const isSchoolProgram = c.program === "Infrastruktur Digital" || c.program === "Revitalisasi Sekolah";
  const isPlatformGtk = c.program === "Pengembangan Platform Digital" || c.program === "Pendampingan Pelatihan GTK";
  const isBahanAjar = c.program === "Bahan Ajar Digital";
  const isLainnya = c.program === "Kebutuhan Pendidikan Lainnya";
  const targetPenerima = useMemo(() => findTargetPenerima(c.aktivitas), [c.aktivitas]);
  const removedUnitKerjaSet = useMemo(() => {
    const removed = new Set<string>();
    for (const a of c.aktivitas) {
      const f = a.fields;
      if (f && typeof f._removedUnitKerja === "string") removed.add(f._removedUnitKerja.toUpperCase());
    }
    return removed;
  }, [c.aktivitas]);
  const removedPICEmails = useMemo(() => {
    const set = new Set<string>();
    for (const a of c.aktivitas) {
      const f = a.fields;
      if (f && typeof f._removePICEmail === "string") set.add(f._removePICEmail);
    }
    return set;
  }, [c.aktivitas]);
  const editedPICEmails = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of c.aktivitas) {
      const f = a.fields;
      if (f && typeof f._editPICEmail === "string") {
        const parts = f._editPICEmail.split("||");
        if (parts.length === 4) map.set(`${parts[0]}||${parts[1]}||${parts[2]}`, parts[3]);
      }
    }
    return map;
  }, [c.aktivitas]);
  const unitKerjaPIC = useMemo(() => {
    const parsed1 = parseUnitKerjaPIC(c.aktivitas, "Unit Kerja dan PIC");
    const parsed2 = parseUnitKerjaPIC(c.aktivitas, "Email Satuan Kerja");
    const allKeys = new Set<string>();
    parsed1.forEach(p => allKeys.add(p.unitKerja.toUpperCase()));
    parsed2.forEach(p => allKeys.add(p.unitKerja.toUpperCase()));
    return Array.from(allKeys).filter(key => !removedUnitKerjaSet.has(key)).map(key => {
      const from1 = parsed1.find(p => p.unitKerja.toUpperCase() === key);
      const from2 = parsed2.find(p => p.unitKerja.toUpperCase() === key);
      const uk = from1?.unitKerja || from2?.unitKerja || key;
      const filterEmails = (emails: string[], type: string): string[] =>
        emails.filter(e => {
          const key = `${uk}||${type}||${e}`;
          return !removedPICEmails.has(key) && !removedPICEmails.has(`${uk.toUpperCase()}||${type}||${e}`);
        }).map(e => {
          const mapped = editedPICEmails.get(`${uk}||${type}||${e}`) || editedPICEmails.get(`${uk.toUpperCase()}||${type}||${e}`);
          return mapped || e;
        });
      return {
        unitKerja: uk,
        emailsSekretariat: filterEmails(from1?.emails || [], "sekretariat"),
        emailsSatuanKerja: filterEmails(from2?.emails || [], "satuan-kerja"),
      };
    });
  }, [c.aktivitas, removedUnitKerjaSet, removedPICEmails, editedPICEmails]);
  const picBiroKerjasama = useMemo(() => {
    const parsed = parseUnitKerjaPIC(c.aktivitas, "Email PIC Biro Kerjasama", c.unitKerja || "Biro Perencanaan dan Kerjasama");
    return parsed.length > 0 ? parsed[0].emails : [];
  }, [c.aktivitas]);

  const handleRemovePIC = useCallback((unitKerja: string) => {
    if (!window.confirm(`Hapus PIC untuk unit kerja "${unitKerja}"?`)) return;
    const now = new Date();
    const updated: Contribution = {
      ...c,
      lastUpdate: now,
      aktivitas: [
        ...c.aktivitas,
        {
          id: `a${Date.now()}`,
          timestamp: now,
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: "Hapus PIC",
          fields: { _removedUnitKerja: unitKerja },
          fromState: c.workflowStatus,
        },
      ],
    };
    updateContribution(updated);
    onDokumenChange?.();
  }, [c, currentUser, onDokumenChange]);

  const handleRemoveEmail = useCallback((unitKerja: string, type: "sekretariat" | "satuan-kerja", email: string) => {
    if (!window.confirm(`Hapus email "${email}" dari ${unitKerja}?`)) return;
    const now = new Date();
    const updated: Contribution = {
      ...c,
      lastUpdate: now,
      aktivitas: [
        ...c.aktivitas,
        {
          id: `a${Date.now()}`,
          timestamp: now,
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: "Hapus Email PIC",
          fields: { _removePICEmail: `${unitKerja}||${type}||${email}` },
          fromState: c.workflowStatus,
        },
      ],
    };
    updateContribution(updated);
    onDokumenChange?.();
  }, [c, currentUser, onDokumenChange]);

  const handleEditPICEmailSubmit = useCallback((unitKerja: string, type: "sekretariat" | "satuan-kerja", oldEmail: string, newEmail: string) => {
    if (oldEmail === newEmail) return;
    const now = new Date();
    const updated: Contribution = {
      ...c,
      lastUpdate: now,
      aktivitas: [
        ...c.aktivitas,
        {
          id: `a${Date.now()}`,
          timestamp: now,
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: "Edit Email PIC",
          fields: { _editPICEmail: `${unitKerja}||${type}||${oldEmail}||${newEmail}` },
          fromState: c.workflowStatus,
        },
      ],
    };
    updateContribution(updated);
    onDokumenChange?.();
    setEditingPICEmail(null);
  }, [c, currentUser, onDokumenChange]);

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
              <dd className="text-gray-900">{targetPenerima["Siswa Terdampak"] || targetPenerima["Siswa"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Guru</dt>
              <dd className="text-gray-900">{targetPenerima["Guru Terdampak"] || targetPenerima["Guru"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Satuan Pendidikan</dt>
              <dd className="text-gray-900">{targetPenerima["Satuan Pendidikan"]}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Wilayah</dt>
              <dd className="text-gray-900">
                {(() => {
                  // Sejak PRD Tahapan Pelaksanaan, wilayah dicatat sebagai daftar kabupaten/kota
                  const multi = targetPenerima["Kabupaten/Kota yang Dibantu"];
                  if (multi) return multi;
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
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Users className="h-4 w-4" /> Unit Kerja dan PIC {picEditMode && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 normal-case">Mode Edit</span>}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPicEditMode(prev => !prev)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                {picEditMode ? "Simpan" : <><Pencil className="h-3.5 w-3.5" /> Edit PIC</>}
              </button>
              <button
                onClick={() => setTambahPICOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah PIC
              </button>
            </div>
          </div>
        <div className="space-y-4">
          <div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-400">Koordinasi Awal</dt>
                <dd className="mt-0.5 text-gray-900 text-sm">{c.narahubung} ({c.unitKerja || "-"})</dd>
              </div>
            </dl>
          </div>
          {unitKerjaPIC.length > 0 && <hr className="border-gray-100" />}
          {unitKerjaPIC.map((item, i) => (
              <div key={i}>
                {i > 0 && <hr className="mb-4 border-gray-100" />}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-400">Unit Kerja</dt>
                    <dd className="mt-0.5 font-medium text-gray-900 text-sm flex items-center gap-2">{item.unitKerja}
                      {picEditMode && (
                        <button
                          onClick={() => handleRemovePIC(item.unitKerja)}
                          className="shrink-0 rounded-md p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                          title="Hapus Semua PIC Unit Kerja"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </dd>
                  </div>
                  {item.emailsSekretariat.length > 0 && (
                    <div>
                      <dt className="text-gray-400">Sekretariat Unit Utama</dt>
                      <dd className="mt-0.5 text-gray-900 text-sm space-y-1">
                        {item.emailsSekretariat.map((email, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span className="text-sm">{email}</span>
                            {picEditMode && (
                              <>
                                <button
                                  onClick={() => setEditingPICEmail({ unitKerja: item.unitKerja, type: "sekretariat", email })}
                                  className="shrink-0 rounded-md p-0.5 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
                                  title="Edit Email"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleRemoveEmail(item.unitKerja, "sekretariat", email)}
                                  className="shrink-0 rounded-md p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                  title="Hapus Email"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {item.emailsSatuanKerja.length > 0 && (
                    <div>
                      <dt className="text-gray-400">Satuan Kerja</dt>
                      <dd className="mt-0.5 text-gray-900 text-sm space-y-1">
                        {item.emailsSatuanKerja.map((email, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span className="text-sm">{email}</span>
                            {picEditMode && (
                              <>
                                <button
                                  onClick={() => setEditingPICEmail({ unitKerja: item.unitKerja, type: "satuan-kerja", email })}
                                  className="shrink-0 rounded-md p-0.5 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
                                  title="Edit Email"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleRemoveEmail(item.unitKerja, "satuan-kerja", email)}
                                  className="shrink-0 rounded-md p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                  title="Hapus Email"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>

      {tambahPICOpen && <TambahPICModal contribution={c} currentUser={currentUser} onClose={() => setTambahPICOpen(false)} onSuccess={onDokumenChange || (() => {})} />}
      {editingPICEmail && (
        <EditPICEmailModal
          unitKerja={editingPICEmail.unitKerja}
          type={editingPICEmail.type}
          currentEmail={editingPICEmail.email}
          onSubmit={(newEmail) => handleEditPICEmailSubmit(editingPICEmail.unitKerja, editingPICEmail.type, editingPICEmail.email, newEmail)}
          onClose={() => setEditingPICEmail(null)}
        />
      )}

      {/* Verifikasi dan Validasi */}
      {picBiroKerjasama.length > 0 && (
        <VerifikasiBlock
          picEmails={picBiroKerjasama}
          contribution={c}
          currentUser={currentUser}
          onRefresh={onDokumenChange || (() => {})}
        />
      )}

      {/* Dokumen */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Dokumen Pendukung Lainnya
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
          {(() => {
            const actionDocIds = new Set(
              c.aktivitas.flatMap(a => a.fields?._docIds ? a.fields._docIds.split(",") : [])
            );
            return c.dokumen.filter(d => d.type !== "proposal" && !actionDocIds.has(d.id)).map(doc => (
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
          ));
        })()}
        </div>
      </div>
    </div>
  );
}

function TambahPICModal({ contribution: c, currentUser, onClose, onSuccess }: { contribution: Contribution; currentUser: SessionUser; onClose: () => void; onSuccess: () => void }) {
  const [unitKerja, setUnitKerja] = useState("");
  const [emailType, setEmailType] = useState<"sekretariat" | "satuan-kerja" | "">("");
  const [emails, setEmails] = useState([""]);
  const [loading, setLoading] = useState(false);

  const addEmail = () => setEmails(prev => [...prev, ""]);
  const updateEmail = (i: number, v: string) => setEmails(prev => prev.map((e, j) => j === i ? v : e));
  const removeEmail = (i: number) => setEmails(prev => prev.filter((_, j) => j !== i));

  const handleSubmit = () => {
    if (!unitKerja.trim() || !emailType || !emails.some(e => e.trim())) return;
    setLoading(true);

    setTimeout(() => {
      const now = new Date();
      const fieldKey = emailType === "sekretariat" ? "Unit Kerja dan PIC" : "Email Satuan Kerja";
      const formatted = `${unitKerja.trim()} (${emails.filter(e => e.trim()).join(", ")})`;

      const updated: Contribution = {
        ...c,
        lastUpdate: now,
        aktivitas: [
          ...c.aktivitas,
          {
            id: `a${Date.now()}`,
            timestamp: now,
            actor: currentUser.name,
            actorRole: currentUser.role,
            action: "Tambah PIC",
            fields: { [fieldKey]: formatted },
            fromState: c.workflowStatus,
          },
        ],
      };

      updateContribution(updated);
      setLoading(false);
      onSuccess();
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-5 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Tambah PIC</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-4 flex-1 min-h-0">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Unit Kerja <span className="ml-0.5 text-red-400">*</span></label>
            <select
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${unitKerja ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900`}
            >
              <option value="" disabled>Pilih Unit Kerja...</option>
              {UNIT_KERJA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Tipe Email <span className="ml-0.5 text-red-400">*</span></label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emailType"
                  checked={emailType === "sekretariat"}
                  onChange={() => setEmailType("sekretariat")}
                  className="h-4 w-4 rounded-full border-gray-300 accent-blue-600"
                />
                <span className="text-sm text-gray-600">Sekretariat Unit Utama</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emailType"
                  checked={emailType === "satuan-kerja"}
                  onChange={() => setEmailType("satuan-kerja")}
                  className="h-4 w-4 rounded-full border-gray-300 accent-blue-600"
                />
                <span className="text-sm text-gray-600">Satuan Kerja</span>
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Email PIC <span className="ml-0.5 text-red-400">*</span></label>
            <div className="space-y-1.5">
              {emails.map((email, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    placeholder={`Email PIC ${i + 1}`}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                  {emails.length > 1 && (
                    <button onClick={() => removeEmail(i)} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addEmail} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="h-3.5 w-3.5" /> Tambah Email
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 shrink-0">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPICEmailModal({ unitKerja, type, currentEmail, onSubmit, onClose }: { unitKerja: string; type: "sekretariat" | "satuan-kerja"; currentEmail: string; onSubmit: (newEmail: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState(currentEmail);
  const typeLabel = type === "sekretariat" ? "Sekretariat Unit Utama" : "Satuan Kerja";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-5 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Edit Email PIC</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-4 py-3 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded-md bg-gray-100 px-2 py-1">{unitKerja}</span>
            <span className="text-gray-300">/</span>
            <span className="rounded-md bg-gray-100 px-2 py-1">{typeLabel}</span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
              placeholder="pic@example.com"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 shrink-0">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50">Batal</button>
          <button
            onClick={() => onSubmit(email)}
            disabled={!email.trim() || email === currentEmail}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Simpan
          </button>
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
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Mengunggah..." : "Upload Dokumen"}
      </button>
    </div>
  );
}

/* ────────────── Pelaksanaan Tab ────────────── */

function formatTanggal(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function DampakGrid({ dampak }: { dampak: DampakPelaksanaan }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-gray-400">Siswa Terdampak</dt>
        <dd className="text-gray-900">{dampak.siswa.toLocaleString("id-ID")}</dd>
      </div>
      <div>
        <dt className="text-gray-400">Guru Terdampak</dt>
        <dd className="text-gray-900">{dampak.guru.toLocaleString("id-ID")}</dd>
      </div>
      <div>
        <dt className="text-gray-400">Satuan Pendidikan</dt>
        <dd className="text-gray-900">{dampak.satuanPendidikan.toLocaleString("id-ID")}</dd>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <dt className="text-gray-400">Kabupaten/Kota</dt>
        <dd className="text-gray-900">{dampak.wilayah || "-"}</dd>
      </div>
    </dl>
  );
}

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

  const timeline = [...(p.progressUpdates || [])].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  return (
    <div className="max-w-3xl space-y-4">
      {/* Ringkasan pelaksanaan */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Status Pelaksanaan</h3>
        <dl className="mb-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-400">Mulai Pelaksanaan</dt>
            <dd className="text-gray-900">{p.startDate ? formatTanggal(p.startDate) : "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Selesai Pelaksanaan</dt>
            <dd className="text-gray-900">{p.completionDate ? formatTanggal(p.completionDate) : "-"}</dd>
          </div>
        </dl>

        {p.targetDampak && (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Target Dampak</p>
            <DampakGrid dampak={p.targetDampak} />
          </div>
        )}

        {p.realisasiDampak && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">Realisasi Dampak Terkini</p>
            <DampakGrid dampak={p.realisasiDampak} />
          </div>
        )}
      </div>

      {/* Timeline penyaluran bantuan */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Timeline Penyaluran Bantuan</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-400">
            Belum ada update progress. Gunakan tombol aksi &quot;Update Progress&quot; untuk mencatat perkembangan penyaluran bantuan.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-gray-100" />
            <div className="space-y-5">
              {timeline.map((entry, i) => (
                <div key={entry.id} className="relative flex gap-3">
                  <div className="relative z-10 mt-1 shrink-0">
                    <div className={`h-4 w-4 rounded-full border-2 bg-white ${i === 0 ? "border-blue-600" : "border-gray-200"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{entry.judul}</p>
                      <span className="text-xs text-gray-400">{formatTanggal(entry.tanggal)}</span>
                    </div>
                    {entry.deskripsi && (
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{entry.deskripsi}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Dicatat oleh {entry.actor}</p>
                    {entry.realisasi && (
                      <div className="mt-2 rounded-md border border-green-100 bg-green-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">Realisasi Dampak</p>
                        <DampakGrid dampak={entry.realisasi} />
                      </div>
                    )}
                    {entry.dokumen.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {entry.dokumen.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                            <span className="flex-1 truncate text-gray-700">{doc.name}</span>
                            <a
                              href={doc.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                              Lihat
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
