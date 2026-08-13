import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Inbox,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { getMitraContributions, getMitraProfile, getMitraSession } from "../../lib/mitra";
import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../../lib/workflow";
import type { WorkflowState } from "../../types/contribution";
import { Button } from "../../components/Button";
import emptyStateIllustration from "../../../assets/illustration-empty-state.svg";

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

  const kontribusiMasuk = contributions.filter(
    (c) => c.workflowStatus === "kontribusi-masuk"
  ).length;
  const kontribusiSelesai = contributions.filter(
    (c) => c.workflowStatus === "selesai"
  ).length;
  const kontribusiProses = contributions.filter(
    (c) =>
      c.workflowStatus !== "kontribusi-masuk" &&
      c.workflowStatus !== "selesai" &&
      c.workflowStatus !== "tidak-dilanjutkan"
  ).length;

  const statCards = [
    {
      label: "Kontribusi Masuk",
      value: kontribusiMasuk,
      icon: <Inbox className="h-5 w-5" />,
      iconColor: "text-[var(--red-60)]",
    },
    {
      label: "Proses",
      value: kontribusiProses,
      icon: <Loader2 className="h-5 w-5" />,
      iconColor: "text-[var(--yellow-40)]",
    },
    {
      label: "Selesai",
      value: kontribusiSelesai,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconColor: "text-[var(--green-60)]",
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
        <Button
          color="blue"
          size="md"
          className="shrink-0 text-sm"
          icon={ClipboardList}
          onClick={() => navigate("/kontribusi")}
        >
          Ajukan Kontribusi
        </Button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius-card)] border border-[var(--gray-10)] bg-white p-5"
          >
            <div className="flex items-center gap-2 text-[var(--text-subdued)]">
              <span className={card.iconColor}>{card.icon}</span>
              <p className="text-sm">{card.label}</p>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-default)]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabel Kontribusi */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gray-10)] bg-white">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <img
              src={emptyStateIllustration}
              alt=""
              aria-hidden
              className="mb-4 h-28 w-28"
            />
            <p className="text-lg font-semibold text-[var(--text-default)]">
              Belum Terdapat Pengajuan Kontribusi
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-[var(--text-subdued)]">
              Silakan ajukan kontribusi melalui menu Kontribusi untuk mulai
              berpartisipasi dalam program bantuan PSPB.
            </p>
            <div className="mt-5">
              <Button color="blue" size="md" onClick={() => navigate("/kontribusi")}>
                Ajukan Kontribusi
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-[var(--gray-10)] bg-[var(--gray-0)]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-subdued)]">
                    Program
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-subdued)]">
                    Paket Dukungan
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-subdued)] md:table-cell">
                    Tanggal Pengajuan
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-subdued)]">
                    Status
                  </th>
                  <th className="w-10 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-10)]">
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
