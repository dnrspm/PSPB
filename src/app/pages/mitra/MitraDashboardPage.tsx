import { useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  School,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  getMitraContributions,
  getMitraProfile,
  getMitraSession,
  verifikasiStatusLabel,
} from "../../lib/mitra";
import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../../lib/workflow";
import type { WorkflowState } from "../../types/contribution";
import type { VerifikasiStatus } from "../../types/mitra";

const VERIFIKASI_STYLE: Record<
  VerifikasiStatus,
  { bg: string; text: string; icon: ReactNode; message: string }
> = {
  "belum-lengkap": {
    bg: "bg-[#FFDFA3]",
    text: "text-[#92400E]",
    icon: <AlertTriangle className="h-4 w-4" />,
    message:
      "Lengkapi dokumen validasi organisasi agar dapat diverifikasi oleh tim pelaksana PSPB.",
  },
  "menunggu-verifikasi": {
    bg: "bg-[#EDE9FE]",
    text: "text-[#7C3AED]",
    icon: <Clock3 className="h-4 w-4" />,
    message:
      "Dokumen Anda sedang dalam proses verifikasi oleh tim pelaksana PSPB.",
  },
  terverifikasi: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#35825A]",
    icon: <CheckCircle2 className="h-4 w-4" />,
    message:
      "Organisasi Anda telah terverifikasi dan dapat mengajukan kontribusi.",
  },
  ditolak: {
    bg: "bg-[#FFE9EA]",
    text: "text-[#C82236]",
    icon: <X className="h-4 w-4" />,
    message:
      "Dokumen Anda ditolak. Silakan periksa kembali dan unggah ulang dokumen yang valid.",
  },
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MitraDashboardPage() {
  const navigate = useNavigate();
  const session = getMitraSession();
  const profile = session ? getMitraProfile(session.email) : null;
  const contributions = useMemo(
    () => (session ? getMitraContributions(session.email) : []),
    [session]
  );

  if (!session || !profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-light)] bg-white p-12 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-[var(--text-subdued)]" />
        <p className="text-sm text-[var(--text-subdued)]">
          Anda belum masuk sebagai Mitra.
        </p>
        <button
          onClick={() => navigate("/mitra/login")}
          className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Masuk sebagai Mitra
        </button>
      </div>
    );
  }

  const verifStyle = VERIFIKASI_STYLE[profile.verifikasiStatus];
  const totalPenerima = contributions.reduce(
    (sum, c) => sum + (c.jumlahPenerima || 0),
    0
  );
  const kontribusiSelesai = contributions.filter(
    (c) => c.workflowStatus === "selesai"
  ).length;
  const kontribusiProses = contributions.filter(
    (c) =>
      c.workflowStatus !== "selesai" && c.workflowStatus !== "tidak-dilanjutkan"
  ).length;

  const statCards = [
    {
      label: "Kontribusi Proses",
      value: kontribusiProses,
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      label: "Kontribusi Selesai",
      value: kontribusiSelesai,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "Jumlah Penerima Manfaat",
      value: totalPenerima,
      icon: <Users className="h-5 w-5" />,
    },
  ];
  const recent = [...contributions]
    .sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-default)]">
            Halo, {profile.nama}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-subdued)]">
            Pantau aktivitas kontribusi {profile.namaPerusahaan} di platform PSPB.
          </p>
        </div>
        <button
          onClick={() => navigate("/kontribusi")}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          <ClipboardList className="h-4 w-4" />
          Ajukan Kontribusi
        </button>
      </div>

      {/* Status Verifikasi */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${verifStyle.bg}`}>
        <div className={`mt-0.5 ${verifStyle.text}`}>{verifStyle.icon}</div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-default)]">
              Status Verifikasi Organisasi
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${verifStyle.bg} ${verifStyle.text}`}
            >
              {verifikasiStatusLabel(profile.verifikasiStatus)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-subdued)]">
            {verifStyle.message}
          </p>
        </div>
        <button
          onClick={() => navigate("/mitra/profil")}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline sm:inline-flex"
        >
          Kelola Profil
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-white p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-50)] text-[var(--primary)]">
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-subdued)]">{card.label}</p>
              <p className="truncate text-lg font-semibold text-[var(--text-default)]">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Kontribusi */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <School className="mb-3 h-10 w-10 text-[var(--text-subdued)]" />
            <p className="text-sm font-medium text-[var(--text-default)]">
              Belum Terdapat Pengajuan Kontribusi
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--text-subdued)]">
              Silakan ajukan kontribusi melalui menu Kontribusi untuk mulai
              berpartisipasi dalam program bantuan PSPB.
            </p>
            <button
              onClick={() => navigate("/kontribusi")}
              className="mt-5 rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Ajukan Kontribusi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[#F5F5F5]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#323232]">
                    Program
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#323232]">
                    Paket Dukungan
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#323232] md:table-cell">
                    Tanggal Pengajuan
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#323232]">
                    Status
                  </th>
                  <th className="w-10 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {recent.map((c) => {
                  const colors = WORKFLOW_STATE_COLORS[c.workflowStatus as WorkflowState];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/mitra/kontribusi/${c.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[var(--surface-subdued)]"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-[var(--text-default)]">
                          {c.program}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-sm text-[var(--text-default)]">
                        {c.paketBantuan}
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-subdued)] md:table-cell">
                        {formatDate(c.submissionDate)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {WORKFLOW_STATE_LABELS[c.workflowStatus as WorkflowState]}
                        </span>
                      </td>
                      <td className="w-10 px-5 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-subdued)]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
