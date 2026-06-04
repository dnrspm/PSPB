import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Users, DollarSign, Phone, Mail, FileText, Download } from "lucide-react";
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

type Tab = "info" | "timeline" | "dokumen" | "distribusi";

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
    ...(c.distribusi ? [{ key: "distribusi" as Tab, label: "Distribusi" }] : []),
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <button
          onClick={() => navigate("/workspace")}
          className="mb-2 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Dasbor Operasional
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[24px] font-semibold text-black">{c.namaMitra}</h1>
              <StatusBadge state={c.workflowStatus} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span>{c.program}</span>
              <span>·</span>
              <span>{c.paketBantuan}</span>
              <span>·</span>
              <span>PIC: <strong className="text-gray-600">{c.pic ?? "Belum ditugaskan"}</strong></span>
              <span>·</span>
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
          {activeTab === "distribusi" && c.distribusi && <DistribusiTab contribution={c} />}
        </div>
      </div>
    </div>
  );
}

function InfoTab({ contribution: c }: { contribution: Contribution }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
        <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Mitra</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-sm text-gray-400">Instansi</dt>
            <dd className="font-medium text-gray-900">{c.instansi}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Narahubung</dt>
            <dd className="text-gray-700">{c.narahubung}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-700">{c.kontak}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-700">{c.email}</span>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
        <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Informasi Bantuan</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-sm text-gray-400">Program</dt>
            <dd className="font-medium text-gray-900">{c.program}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Paket Bantuan</dt>
            <dd className="text-gray-700">{c.paketBantuan}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-700">{c.wilayah}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-700">{c.targetPenerima}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{c.nilaiKontribusi}</span>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4 lg:col-span-2">
        <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Sekolah Penerima</h3>
        <div className="flex flex-wrap gap-2">
          {c.sekolah.map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {s}
            </span>
          ))}
        </div>
      </div>

      {(c.reviewNotes || c.legalNotes || c.audiensiResult) && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-600">Catatan Tinjauan</h3>
          <div className="space-y-2 text-sm">
            {c.reviewNotes && (
              <div>
                <span className="text-sm font-medium text-amber-700">Tinjauan Substansi: </span>
                <span className="text-sm text-amber-900">{c.reviewNotes}</span>
              </div>
            )}
            {c.legalNotes && (
              <div>
                <span className="text-sm font-medium text-amber-700">Catatan Legal: </span>
                <span className="text-sm text-amber-900">{c.legalNotes}</span>
              </div>
            )}
            {c.audiensiResult && (
              <div>
                <span className="text-sm font-medium text-amber-700">Hasil Audiensi: </span>
                <span className="text-sm text-amber-900">{c.audiensiResult}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DokumenTab({ contribution: c }: { contribution: Contribution }) {
  const docTypeLabel: Record<string, string> = {
    proposal: "Proposal", "pks-draft": "Draf PKS", "pks-final": "PKS Final",
    bast: "BAST", distribusi: "Dokumentasi Distribusi", notulen: "Notulen",
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
            <button className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-400 hover:text-blue-600">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function AktivitasTab({ contribution: c }: { contribution: Contribution }) {
  const activities = [...c.aktivitas].reverse();
  return (
    <div className="max-w-2xl">
      <WorkflowTimeline contribution={{ ...c, aktivitas: activities.reverse() }} />
    </div>
  );
}

function DistribusiTab({ contribution: c }: { contribution: Contribution }) {
  const d = c.distribusi!;
  const statusLabel: Record<string, string> = {
    persiapan: "Persiapan", "in-progress": "Berlangsung",
    "on-hold": "Ditunda", adendum: "Adendum", completed: "Selesai",
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Status Distribusi</h3>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-sm font-medium text-teal-700">
            {statusLabel[d.status]}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Kemajuan</span>
            <span>{d.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${d.progressPercent}%` }}
            />
          </div>
        </div>
        {d.latestUpdate && (
          <p className="mt-3 text-sm text-gray-600">{d.latestUpdate}</p>
        )}
        {d.holdReason && (
          <div className="mt-3 rounded-md bg-red-50 p-2.5 text-sm text-red-700">
            <strong>Alasan penundaan: </strong>{d.holdReason}
          </div>
        )}
      </div>

      {d.dokumentasi.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm p-4">
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Dokumentasi Distribusi</h3>
          <div className="space-y-2">
            {d.dokumentasi.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="flex-1 text-gray-700">{doc.name}</span>
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
