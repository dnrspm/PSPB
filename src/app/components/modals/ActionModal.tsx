import { useState } from "react";
import { X, Upload } from "lucide-react";
import type { Contribution, WorkflowAction, WorkflowState } from "../../types/contribution";
import { ACTION_LABELS, WORKFLOW_STATE_LABELS, INTERNAL_TEAM } from "../../lib/workflow";
import { updateContribution } from "../../data/mockWorkspace";

interface ActionModalProps {
  action: WorkflowAction;
  contribution: Contribution;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModalConfig {
  title: string;
  toState?: WorkflowState;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  type: "select-pic" | "textarea" | "text" | "file" | "checkbox" | "select-progress";
  required?: boolean;
  placeholder?: string;
}

const MODAL_CONFIGS: Partial<Record<WorkflowAction, ModalConfig>> = {
  "assign-pic": {
    title: "Assign PIC",
    fields: [
      { key: "pic", label: "Pilih PIC", type: "select-pic", required: true },
      { key: "notes", label: "Catatan (opsional)", type: "textarea", placeholder: "Tambah catatan..." },
    ],
  },
  "move-to-verifikasi": {
    title: "Pindah ke Verifikasi",
    toState: "verifikasi",
    fields: [
      { key: "notes", label: "Catatan Verifikasi", type: "textarea", placeholder: "Catatan untuk tahap verifikasi..." },
    ],
  },
  "approve-verification": {
    title: "Approve Verifikasi",
    toState: "audiensi",
    fields: [
      { key: "notes", label: "Catatan Verifikasi", type: "textarea", placeholder: "Catatan approval..." },
    ],
  },
  "request-revision": {
    title: "Request Revisi",
    fields: [
      { key: "notes", label: "Catatan Revisi", type: "textarea", required: true, placeholder: "Jelaskan revisi yang diperlukan..." },
    ],
  },
  "update-audiensi": {
    title: "Update Hasil Audiensi",
    fields: [
      { key: "audiensiResult", label: "Hasil Audiensi", type: "textarea", required: true, placeholder: "Ringkasan hasil audiensi..." },
      { key: "notes", label: "Catatan Tambahan", type: "textarea", placeholder: "Catatan tambahan..." },
    ],
  },
  "move-to-review-substansi": {
    title: "Pindah ke Review Substansi",
    toState: "review-substansi",
    fields: [
      { key: "notes", label: "Ringkasan Audiensi", type: "textarea", required: true, placeholder: "Ringkasan hasil audiensi untuk review substansi..." },
    ],
  },
  "approve-contribution": {
    title: "Approve Kontribusi",
    toState: "draft-pks",
    fields: [
      { key: "notes", label: "Catatan Approval", type: "textarea", placeholder: "Catatan approval substansi..." },
    ],
  },
  "reject-contribution": {
    title: "Reject Kontribusi",
    fields: [
      { key: "notes", label: "Alasan Penolakan", type: "textarea", required: true, placeholder: "Jelaskan alasan penolakan kontribusi..." },
    ],
  },
  "request-adjustment": {
    title: "Request Penyesuaian",
    fields: [
      { key: "notes", label: "Catatan Penyesuaian", type: "textarea", required: true, placeholder: "Jelaskan penyesuaian yang diperlukan..." },
    ],
  },
  "move-to-draft-pks": {
    title: "Buat Draft PKS",
    toState: "draft-pks",
    fields: [
      { key: "notes", label: "Catatan Persiapan PKS", type: "textarea", placeholder: "Catatan untuk persiapan PKS..." },
    ],
  },
  "upload-draft-pks": {
    title: "Upload Draft PKS",
    fields: [
      { key: "file", label: "File Draft PKS", type: "file", required: true },
      { key: "notes", label: "Catatan", type: "textarea", placeholder: "Catatan draft PKS..." },
    ],
  },
  "send-to-legal-review": {
    title: "Kirim ke Legal Review",
    toState: "legal-review",
    fields: [
      { key: "confirm", label: "Konfirmasi pengiriman ke Legal Review", type: "checkbox", required: true },
      { key: "notes", label: "Catatan", type: "textarea", placeholder: "Catatan untuk tim legal..." },
    ],
  },
  "upload-legal-revision": {
    title: "Upload Revisi PKS",
    fields: [
      { key: "file", label: "File PKS yang Direvisi", type: "file", required: true },
      { key: "notes", label: "Catatan Legal", type: "textarea", placeholder: "Catatan revisi legal..." },
    ],
  },
  "request-legal-revision": {
    title: "Request Revisi ke Draft PKS",
    toState: "draft-pks",
    fields: [
      { key: "notes", label: "Catatan Revisi", type: "textarea", required: true, placeholder: "Jelaskan poin-poin yang perlu direvisi..." },
    ],
  },
  "finalize-pks": {
    title: "Finalisasi PKS",
    toState: "final-pks",
    fields: [
      { key: "file", label: "File PKS Final", type: "file", required: true },
      { key: "notes", label: "Catatan Legal", type: "textarea", placeholder: "Catatan finalisasi..." },
      { key: "confirm", label: "Konfirmasi PKS sudah sesuai dan siap ditandatangani", type: "checkbox", required: true },
    ],
  },
  "move-to-distribusi": {
    title: "Mulai Persiapan Distribusi",
    toState: "distribusi-persiapan",
    fields: [
      { key: "notes", label: "Catatan Distribusi", type: "textarea", placeholder: "Catatan untuk persiapan distribusi..." },
    ],
  },
  "start-distribusi": {
    title: "Start Distribusi",
    toState: "distribusi-in-progress",
    fields: [
      { key: "notes", label: "Catatan Mulai", type: "textarea", placeholder: "Catatan memulai distribusi..." },
    ],
  },
  "update-distribusi": {
    title: "Update Distribusi",
    fields: [
      { key: "progress", label: "Persentase Progress", type: "select-progress", required: true },
      { key: "notes", label: "Update Terbaru", type: "textarea", required: true, placeholder: "Deskripsi progress terkini..." },
    ],
  },
  "upload-dokumentasi": {
    title: "Upload Dokumentasi Distribusi",
    fields: [
      { key: "file", label: "File Dokumentasi", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Keterangan dokumentasi..." },
    ],
  },
  "put-on-hold": {
    title: "Hold Distribusi",
    toState: "distribusi-on-hold",
    fields: [
      { key: "notes", label: "Alasan Hold", type: "textarea", required: true, placeholder: "Jelaskan alasan distribusi di-hold..." },
    ],
  },
  "resume-distribusi": {
    title: "Resume Distribusi",
    toState: "distribusi-in-progress",
    fields: [
      { key: "notes", label: "Catatan Resume", type: "textarea", required: true, placeholder: "Catatan melanjutkan distribusi..." },
    ],
  },
  "create-adendum": {
    title: "Buat Adendum",
    toState: "distribusi-adendum",
    fields: [
      { key: "file", label: "File Adendum", type: "file", required: true },
      { key: "notes", label: "Keterangan Adendum", type: "textarea", required: true, placeholder: "Jelaskan perubahan dalam adendum..." },
    ],
  },
  "upload-adendum": {
    title: "Upload Adendum",
    fields: [
      { key: "file", label: "File Adendum", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Keterangan adendum..." },
    ],
  },
  "mark-completed": {
    title: "Tandai Distribusi Selesai",
    toState: "distribusi-completed",
    fields: [
      { key: "file", label: "Bukti Penyelesaian (BAST/Foto)", type: "file", required: true },
      { key: "notes", label: "Catatan Penyelesaian", type: "textarea", placeholder: "Ringkasan hasil distribusi..." },
    ],
  },
  "mark-publish": {
    title: "Publikasikan Kontribusi",
    toState: "published",
    fields: [
      { key: "confirm", label: "Konfirmasi kontribusi ini siap dipublikasikan", type: "checkbox", required: true },
      { key: "notes", label: "Catatan Publikasi", type: "textarea", placeholder: "Catatan akhir publikasi..." },
    ],
  },
};

export function ActionModal({ action, contribution, onClose, onSuccess }: ActionModalProps) {
  const config = MODAL_CONFIGS[action];
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!config) return null;

  const set = (key: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.required) {
        const val = values[field.key];
        if (!val || val === "" || val === false) {
          newErrors[field.key] =
            field.type === "checkbox"
              ? "Harus dicentang untuk melanjutkan"
              : "Field ini wajib diisi";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);

    setTimeout(() => {
      const now = new Date();
      const updated: Contribution = {
        ...contribution,
        lastUpdate: now,
        aktivitas: [
          ...contribution.aktivitas,
          {
            id: `a${Date.now()}`,
            timestamp: now,
            actor: "Anda",
            actorRole: "partnership-operator",
            action: ACTION_LABELS[action],
            notes: values.notes as string | undefined,
            fromState: config.toState ? contribution.workflowStatus : undefined,
            toState: config.toState,
          },
        ],
      };

      if (config.toState) updated.workflowStatus = config.toState;
      if (action === "assign-pic") updated.pic = values.pic as string;
      if (action === "update-audiensi") {
        updated.audiensiResult = values.audiensiResult as string;
        updated.audiensiDate = now;
      }
      if (action === "update-distribusi" && updated.distribusi) {
        updated.distribusi = {
          ...updated.distribusi,
          progressPercent: parseInt(values.progress as string) || updated.distribusi.progressPercent,
          latestUpdate: values.notes as string,
        };
      }
      if (config.toState?.startsWith("distribusi") && updated.distribusi) {
        const distStatus = config.toState.replace("distribusi-", "") as "persiapan" | "in-progress" | "on-hold" | "adendum" | "completed";
        updated.distribusi = { ...updated.distribusi, status: distStatus };
        if (distStatus === "in-progress" && !updated.distribusi.startDate) {
          updated.distribusi.startDate = now;
        }
        if (distStatus === "completed") updated.distribusi.completionDate = now;
      }
      if (action === "put-on-hold" && updated.distribusi) {
        updated.distribusi = { ...updated.distribusi, holdReason: values.notes as string };
      }

      updateContribution(updated);
      setLoading(false);
      onSuccess();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{config.title}</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              {contribution.namaMitra} ·{" "}
              <span className="font-medium text-gray-500">{WORKFLOW_STATE_LABELS[contribution.workflowStatus]}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {config.toState && (
          <div className="mx-4 mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-600">
            Status akan berubah ke:{" "}
            <strong>{WORKFLOW_STATE_LABELS[config.toState]}</strong>
          </div>
        )}

        <div className="space-y-3 px-4 py-3">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-400">*</span>}
              </label>

              {field.type === "textarea" && (
                <textarea
                  rows={3}
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              )}

              {field.type === "text" && (
                <input
                  type="text"
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              )}

              {field.type === "select-pic" && (
                <select
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Pilih PIC...</option>
                  {INTERNAL_TEAM.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role.replace(/-/g, " ")})
                    </option>
                  ))}
                </select>
              )}

              {field.type === "select-progress" && (
                <select
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Pilih progress...</option>
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                    <option key={p} value={String(p)}>{p}%</option>
                  ))}
                </select>
              )}

              {field.type === "file" && (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5">
                  <Upload className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {values[field.key] ? (
                      <span className="text-blue-600 font-medium">{values[field.key] as string}</span>
                    ) : (
                      "Pilih file..."
                    )}
                  </span>
                  <button
                    onClick={() => set(field.key, `${field.label}_${Date.now()}.pdf`)}
                    className="ml-auto rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-gray-50"
                  >
                    Browse
                  </button>
                </div>
              )}

              {field.type === "checkbox" && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(values[field.key] as boolean) || false}
                    onChange={(e) => set(field.key, e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
                  />
                  <span className="text-sm text-gray-600">{field.label}</span>
                </label>
              )}

              {errors[field.key] && (
                <p className="mt-0.5 text-sm text-red-500">{errors[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
