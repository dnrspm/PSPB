import { useState } from "react";
import { X, Upload, Calendar } from "lucide-react";
import type { Contribution, WorkflowAction, WorkflowState, UserRole } from "../../types/contribution";
import { ACTION_LABELS, WORKFLOW_STATE_LABELS, INTERNAL_TEAM } from "../../lib/workflow";
import { updateContribution } from "../../data/mockWorkspace";

interface ActionModalProps {
  action: WorkflowAction;
  contribution: Contribution;
  currentUser: { name: string; role: UserRole };
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
  type: "select-pic" | "textarea" | "text" | "file" | "checkbox" | "select-progress" | "select" | "multi-email" | "checkboxes" | "tags" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaults?: string[];
}

const MODAL_CONFIGS: Partial<Record<WorkflowAction, ModalConfig>> = {
  "lanjutkan-kontribusi": {
    title: "Lanjutkan Kontribusi",
    toState: "audiensi-menunggu-jadwal",
    fields: [
      { key: "unitKerja", label: "Unit Kerja", type: "tags", required: true, defaults: ["INA Digital Edu"], placeholder: "Tulis nama unit kerja..." },
      { key: "jenisKerjasama", label: "Jenis Kerjasama", type: "select", required: true, options: [
        { value: "dalam-negeri", label: "Dalam Negeri" },
        { value: "luar-negeri", label: "Luar Negeri" },
      ]},
      { key: "picEmail", label: "Email PIC", type: "multi-email", required: true, placeholder: "pic1@pspb.go.id, pic2@pspb.go.id" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan untuk kontribusi ini..." },
    ],
  },
  "tidak-dilanjutkan": {
    title: "Tidak Dilanjutkan",
    toState: "tidak-dilanjutkan",
    fields: [
      { key: "notes", label: "Keterangan", type: "textarea", required: true, placeholder: "Jelaskan alasan penghentian..." },
    ],
  },
  "jadwalkan-audiensi": {
    title: "Jadwalkan Audiensi",
    toState: "audiensi-terjadwal",
    fields: [
      { key: "satuanKerja", label: "Satuan Kerja & Biro Hukum", type: "select", required: true, options: [
        { value: "pusat-dir", label: "Pusat / Direktorat / Eselon II" },
        { value: "biro-hukum", label: "Biro Hukum" },
        { value: "keduanya", label: "Pusat / Direktorat / Eselon II & Biro Hukum" },
      ]},
      { key: "tanggal", label: "Tanggal Audiensi", type: "date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "file", label: "Surat Undangan & Dokumen", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan penjadwalan..." },
    ],
  },
  "audiensi-terlaksana": {
    title: "Audiensi Terlaksana",
    toState: "audiensi-konfirmasi-lanjut-pks",
    fields: [
      { key: "file", label: "Notulen & Dokumen Audiensi", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Ringkasan hasil audiensi..." },
    ],
  },
  "setuju-hasil-audiensi": {
    title: "Setuju Hasil Audiensi",
    toState: "perjanjian-draft-pks",
    fields: [
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan persetujuan hasil audiensi..." },
    ],
  },
  "audiensi-ulang": {
    title: "Audiensi Ulang",
    toState: "audiensi-menunggu-jadwal",
    fields: [
      { key: "notes", label: "Keterangan", type: "textarea", required: true, placeholder: "Alasan audiensi ulang..." },
    ],
  },
  "ajukan-perjanjian": {
    title: "Ajukan Perjanjian ke Biro Hukum",
    toState: "perjanjian-pembahasan-pks",
    fields: [
      { key: "picEmail", label: "Email PIC Biro Hukum", type: "text", required: true, placeholder: "pic.hukum@pspb.go.id" },
      { key: "file", label: "Draft PKS", type: "file", required: true },
      { key: "fileRencana", label: "Rencana Kerja Sama", type: "file", required: true },
      { key: "fileLainnya", label: "Dokumen Lainnya", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan pengajuan PKS..." },
    ],
  },
  "lanjutkan-pembahasan": {
    title: "Lanjutkan Pembahasan",
    toState: "perjanjian-finalisasi-pks",
    fields: [
      { key: "tanggal", label: "Tanggal Pembahasan", type: "date", required: true },
      { key: "file", label: "Surat Undangan & Dokumen", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan pembahasan..." },
    ],
  },
  "perjanjian-disetujui": {
    title: "Perjanjian Telah Disetujui",
    toState: "pelaksanaan-persiapan",
    fields: [
      { key: "file", label: "PKS Final", type: "file", required: true },
      { key: "fileRencana", label: "Rencana Kerja Final", type: "file", required: true },
      { key: "fileLainnya", label: "Dokumen Lainnya", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan finalisasi..." },
    ],
  },
  "lanjut-pelaksanaan": {
    title: "Lanjut Pelaksanaan",
    toState: "pelaksanaan-dalam-proses",
    fields: [
      { key: "jumlahMurid", label: "Jumlah Murid Terdampak", type: "text", required: true, placeholder: "Contoh: 500" },
      { key: "jumlahGuru", label: "Jumlah Guru Terdampak", type: "text", required: true, placeholder: "Contoh: 50" },
      { key: "satuanPendidikan", label: "Satuan Pendidikan Terdampak", type: "text", required: true, placeholder: "Contoh: 10 sekolah" },
      { key: "kabupatenKota", label: "Kabupaten/Kota", type: "text", required: true, placeholder: "Contoh: Bandung, Cimahi" },
      { key: "file", label: "Dokumen Pendukung", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan pelaksanaan..." },
    ],
  },
  "update-progress": {
    title: "Update Progress",
    fields: [
      { key: "progress", label: "Progress Pelaksanaan", type: "select-progress", required: true },
      { key: "file", label: "Foto / Dokumen Pendukung", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", required: true, placeholder: "Deskripsi progress terkini..." },
    ],
  },
  "terlaksana": {
    title: "Terlaksana",
    toState: "pemantauan-terlaksana",
    fields: [
      { key: "file", label: "Upload BAST", type: "file", required: true },
      { key: "fileFoto", label: "Upload Foto", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Ringkasan hasil pelaksanaan..." },
    ],
  },
  "dalam-evaluasi": {
    title: "Dalam Evaluasi",
    toState: "pelaksanaan-dalam-evaluasi",
    fields: [
      { key: "notes", label: "Keterangan", type: "textarea", required: true, placeholder: "Alasan evaluasi..." },
    ],
  },
  "ajukan-addendum": {
    title: "Ajukan Addendum PKS",
    toState: "pelaksanaan-penyesuaian-pks",
    fields: [
      { key: "file", label: "Draft Addendum PKS", type: "file", required: true },
      { key: "fileRencana", label: "Rencana Kerja Sama", type: "file", required: true },
      { key: "fileLainnya", label: "Dokumen Lainnya", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan addendum..." },
    ],
  },
  "pemantauan-selesai": {
    title: "Pemantauan Selesai",
    toState: "selesai",
    fields: [
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan pemantauan..." },
    ],
  },
  "pemantauan-pemanfaatan": {
    title: "Pemantauan Pemanfaatan (Opsional)",
    toState: "pemantauan-pemanfaatan",
    fields: [
      { key: "notes", label: "Keterangan (link form)", type: "textarea", placeholder: "Masukkan link form pemantauan..." },
    ],
  },
  "pemantauan-pemanfaatan-selesai": {
    title: "Pemantauan Pemanfaatan Selesai",
    toState: "selesai",
    fields: [
      { key: "file", label: "Upload Report", type: "file", required: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan hasil pemantauan..." },
    ],
  },
};

export function ActionModal({ action, contribution, currentUser, onClose, onSuccess }: ActionModalProps) {
  const config = MODAL_CONFIGS[action];
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    if (config) {
      for (const field of config.fields) {
        if (field.defaults) {
          initial[field.key] = field.defaults.join(", ");
        }
      }
    }
    return initial;
  });
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!config) return null;

  const set = (key: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggleCheckbox = (key: string, optionValue: string) => {
    setValues((prev) => {
      const current = (prev[key] as string) || "";
      const items = current ? current.split(", ").filter(Boolean) : [];
      const idx = items.indexOf(optionValue);
      if (idx >= 0) items.splice(idx, 1);
      else items.push(optionValue);
      return { ...prev, [key]: items.join(", ") };
    });
  };

  const addTag = (key: string, defaults: string[] = []) => {
    const input = (tagInputs[key] || "").trim();
    if (!input) return;
    setValues((prev) => {
      const current = (prev[key] as string) || "";
      const items = current ? current.split(", ").filter(Boolean) : [];
      if (!items.includes(input)) items.push(input);
      return { ...prev, [key]: items.join(", ") };
    });
    setTagInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeTag = (key: string, value: string, defaults: string[] = []) => {
    if (defaults.includes(value)) return;
    setValues((prev) => {
      const current = (prev[key] as string) || "";
      const items = current ? current.split(", ").filter(Boolean) : [];
      const idx = items.indexOf(value);
      if (idx >= 0) items.splice(idx, 1);
      return { ...prev, [key]: items.join(", ") };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.required) {
        const val = values[field.key];
        const isTags = field.type === "tags";
        const tagsVal = isTags ? (val as string || "").split(", ").filter(Boolean) : [];
        if (isTags ? tagsVal.length === 0 : (!val || val === "" || val === false)) {
          newErrors[field.key] =
            field.type === "checkbox" || field.type === "checkboxes"
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
      const fieldLabels: Record<string, string> = {};
      for (const f of config.fields) fieldLabels[f.key] = f.label;
      const fields: Record<string, string> = {};
      for (const f of config.fields) {
        if (f.key === "notes") continue;
        const val = values[f.key];
        if (val === undefined || val === false || val === "") continue;
        fields[f.label] = String(val);
      }
      const updated: Contribution = {
        ...contribution,
        lastUpdate: now,
        aktivitas: [
          ...contribution.aktivitas,
          {
            id: `a${Date.now()}`,
            timestamp: now,
            actor: currentUser.name,
            actorRole: currentUser.role,
            action: ACTION_LABELS[action],
            notes: values.notes as string | undefined,
            fields: Object.keys(fields).length > 0 ? fields : undefined,
            fromState: contribution.workflowStatus,
            toState: config.toState ? contribution.workflowStatus : undefined,
          },
        ],
      };

      if (config.toState) updated.workflowStatus = config.toState;

      if (config.toState === "pelaksanaan-dalam-proses" || action === "update-progress") {
        if (!updated.pelaksanaan) {
          updated.pelaksanaan = { progress: 0, dokumentasi: [] };
        }
        if (action === "update-progress" && updated.pelaksanaan) {
          updated.pelaksanaan = {
            ...updated.pelaksanaan,
            progress: parseInt(values.progress as string) || updated.pelaksanaan.progress,
            latestUpdate: values.notes as string,
          };
        }
        if (config.toState === "pelaksanaan-dalam-proses" && !updated.pelaksanaan.startDate) {
          updated.pelaksanaan = { ...updated.pelaksanaan!, startDate: now };
        }
        if (config.toState === "pemantauan-terlaksana" && updated.pelaksanaan) {
          updated.pelaksanaan = { ...updated.pelaksanaan, completionDate: now };
        }
        if (config.toState === "selesai" && updated.pelaksanaan) {
          updated.pelaksanaan = { ...updated.pelaksanaan, completionDate: now };
        }
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

              {field.type === "date" && (
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={(values[field.key] as string) || ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 pl-8 pr-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              )}

              {field.type === "select" && field.options && (
                <select
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Pilih...</option>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
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

              {field.type === "tags" && (() => {
                const current = (values[field.key] as string) || "";
                const items = current ? current.split(", ").filter(Boolean) : [];
                const def = field.defaults || [];
                return (
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {items.map((item) => {
                        const isDefault = def.includes(item);
                        return (
                          <span
                            key={item}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm ${
                              isDefault
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {item}
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => removeTag(field.key, item, def)}
                                className="text-gray-400 hover:text-red-500 leading-none"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInputs[field.key] || ""}
                        onChange={(e) => setTagInputs((p) => ({ ...p, [field.key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(field.key, def); } }}
                        placeholder={field.placeholder || "Tambah unit kerja..."}
                        className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => addTag(field.key, def)}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                );
              })()}

              {field.type === "multi-email" && (
                <div>
                  <textarea
                    rows={3}
                    value={(values[field.key] as string) || ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder || "pic1@pspb.go.id, pic2@pspb.go.id"}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">Pisahkan setiap email dengan koma</p>
                </div>
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
