import { useState } from "react";
import { X, Upload, Calendar, Download, FileText } from "lucide-react";
import type { Contribution, Document, WorkflowAction, WorkflowState, UserRole } from "../../types/contribution";
import { ACTION_LABELS, WORKFLOW_STATE_LABELS, INTERNAL_TEAM, PROGRAM_UNIT_KERJA_DEFAULTS, SUB_TYPE_UNIT_KERJA_MAP, UNIT_KERJA_OPTIONS } from "../../lib/workflow";
import { updateContribution } from "../../data/mockWorkspace";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../../data/regionData";

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
  type: "select-pic" | "textarea" | "text" | "file" | "checkbox" | "select-progress" | "select" | "multi-email" | "checkboxes" | "tags" | "date" | "unit-kerja-email" | "download-template" | "section-header";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaults?: string[];
  readonlyUnitKerja?: boolean;
  multiple?: boolean;
  inline?: boolean;
}

function parseUnitKerjaFromActivity(aktivitas: Contribution["aktivitas"]): Array<{ unitKerja: string; emails: string[] }> {
  for (let i = aktivitas.length - 1; i >= 0; i--) {
    const fields = aktivitas[i].fields;
    if (!fields) continue;
    const raw = fields["Unit Kerja dan PIC"];
    if (!raw) continue;
    const result: Array<{ unitKerja: string; emails: string[] }> = [];
    const regex = /([^(]+)\(([^)]*)\)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const unitKerja = match[1].replace(/^[\s,|]+|[\s,|]+$/g, "").trim();
      const emails = match[2].split(",").map(e => e.trim()).filter(Boolean);
      if (unitKerja) result.push({ unitKerja, emails });
    }
    return result;
  }
  return [];
}

const MODAL_CONFIGS: Partial<Record<WorkflowAction, ModalConfig>> = {
  "lanjutkan-kontribusi": {
    title: "Lanjutkan Kontribusi",
    toState: "verifikasi-dan-validasi",
    fields: [
      { key: "emailPIC", label: "Email PIC Biro Kerjasama", type: "text", required: true, placeholder: "pic@birokerjasama.go.id" },
      { key: "jenisKerjasama", label: "Jenis Kerjasama", type: "select", required: true, options: [
        { value: "dalam-negeri", label: "Dalam Negeri" },
        { value: "luar-negeri", label: "Luar Negeri" },
      ]},
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan untuk kontribusi ini..." },
    ],
  },
  "lanjutkan-audiensi": {
    title: "Lanjutkan Audiensi",
    toState: "audiensi-menunggu-jadwal",
    fields: [
      { key: "unitKerjaEmail", label: "Unit Kerja dan PIC", type: "unit-kerja-email", required: true },
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
      { key: "unitKerjaEmail", label: "Email Satuan Kerja", type: "unit-kerja-email", required: true, readonlyUnitKerja: true },
      { key: "tanggal", label: "Tanggal Audiensi", type: "date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "file", label: "Surat Undangan & Dokumen", type: "file", required: true, multiple: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan penjadwalan..." },
    ],
  },
  "audiensi-terlaksana": {
    title: "Audiensi Terlaksana",
    toState: "audiensi-konfirmasi-lanjut-pks",
    fields: [
      { key: "file", label: "Notulen & Dokumen Audiensi", type: "file", required: true, multiple: true },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Ringkasan hasil audiensi..." },
    ],
  },
  "setuju-hasil-audiensi": {
    title: "Setuju Hasil Audiensi",
    toState: "perjanjian-draft-pks",
    fields: [
      { key: "template", label: "Unduh Template Rencana Kerjasama", type: "download-template" },
      { key: "fileRencana", label: "Upload Rencana Kerja Sama", type: "file", required: true },
      { key: "fileLainnya", label: "Upload Dokumen Lainnya", type: "file", multiple: true },
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
      { key: "templatePKS", label: "Download Template PKS", type: "download-template" },
      { key: "templateSuratKuasa", label: "Download Template Surat Kuasa", type: "download-template" },
      { key: "file", label: "Draft PKS", type: "file", required: true },
      { key: "fileSuratKuasa", label: "Upload Surat Kuasa", type: "file", required: true },
      { key: "fileLainnya", label: "Dokumen Lainnya", type: "file", multiple: true },
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
      { key: "file", label: "Upload Draf Final PKS yang siap ditandatangani", type: "file", required: true },
      { key: "fileRencana", label: "Upload rencana kerja final yang siap ditandatangani", type: "file", required: true },
      { key: "fileLainnya", label: "Dokumen Lainnya", type: "file" },
      { key: "notes", label: "Keterangan", type: "textarea", placeholder: "Catatan finalisasi..." },
    ],
  },
  "lanjut-pelaksanaan": {
    title: "Lanjut Pelaksanaan",
    toState: "pelaksanaan-dalam-proses",
    fields: [

      { key: "siswa", label: "Siswa", type: "text", required: true, placeholder: "Contoh: 500", inline: true },
      { key: "guru", label: "Guru", type: "text", required: true, placeholder: "Contoh: 50", inline: true },
      { key: "satuanPendidikan", label: "Satuan Pendidikan Terdampak", type: "text", required: true, placeholder: "Nama sekolah" },
      { key: "provinsi", label: "Provinsi", type: "select", required: true, options: PROVINSI_OPTIONS, inline: true },
      { key: "kabupaten", label: "Kota/Kabupaten", type: "select", required: true, inline: true },
      { key: "kelurahan", label: "Kelurahan", type: "text", placeholder: "Nama kelurahan", inline: true },
      { key: "kecamatan", label: "Kecamatan", type: "text", placeholder: "Nama kecamatan", inline: true },
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

const FILE_DOC_TYPE: Record<string, (action: WorkflowAction) => string> = {
  file: (action) => {
    switch (action) {
      case "audiensi-terlaksana": return "notulen";
      case "ajukan-perjanjian": return "pks-draft";
      case "perjanjian-disetujui": return "pks-final";
      case "terlaksana": return "bast";
      case "ajukan-addendum": return "adendum";
      case "update-progress": return "dokumentasi";
      default: return "lainnya";
    }
  },
  fileRencana: () => "rencana-kerja-final",
  fileLainnya: () => "lainnya",
  fileFoto: () => "dokumentasi",
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
  const [unitKerjaEmailPairs, setUnitKerjaEmailPairs] = useState<Array<{ unitKerja: string; emails: string[] }>>(() => {
    if (!config) return [];
    const field = config.fields.find(f => f.type === "unit-kerja-email");
    if (!field) return [];

    if (action === "jadwalkan-audiensi") {
      const result: Array<{ unitKerja: string; emails: string[] }> = [];
      const fromActivity = parseUnitKerjaFromActivity(contribution.aktivitas);
      if (fromActivity.length > 0) {
        result.push(...fromActivity.map(p => ({ unitKerja: p.unitKerja, emails: [""] })));
      } else if (contribution.unitKerja) {
        result.push({ unitKerja: contribution.unitKerja, emails: [""] });
      }
      result.push({ unitKerja: "Biro Hukum", emails: [""] });
      return result;
    }

    let defaultUnitKerja = PROGRAM_UNIT_KERJA_DEFAULTS[contribution.program];
    if (!defaultUnitKerja && contribution.program === "Kebutuhan Pendidikan Lainnya" && contribution.paketBantuan) {
      defaultUnitKerja = SUB_TYPE_UNIT_KERJA_MAP[contribution.paketBantuan] || "";
    }
    defaultUnitKerja = defaultUnitKerja || (field?.defaults?.[0]) || "";
    return field ? [{ unitKerja: defaultUnitKerja, emails: [""] }] : [];
  });

  const addUnitKerjaEmailPair = () => {
    setUnitKerjaEmailPairs(prev => [...prev, { unitKerja: "", emails: [""] }]);
  };

  const updateUnitKerja = (index: number, value: string) => {
    setUnitKerjaEmailPairs(prev => prev.map((pair, i) =>
      i === index ? { ...pair, unitKerja: value } : pair
    ));
  };

  const updateEmail = (pairIndex: number, emailIndex: number, value: string) => {
    setUnitKerjaEmailPairs(prev => prev.map((pair, i) =>
      i === pairIndex ? { ...pair, emails: pair.emails.map((e, j) => j === emailIndex ? value : e) } : pair
    ));
  };

  const addEmailToPair = (pairIndex: number) => {
    setUnitKerjaEmailPairs(prev => prev.map((pair, i) =>
      i === pairIndex ? { ...pair, emails: [...pair.emails, ""] } : pair
    ));
  };

  const removeEmailFromPair = (pairIndex: number, emailIndex: number) => {
    setUnitKerjaEmailPairs(prev => prev.map((pair, i) =>
      i === pairIndex ? { ...pair, emails: pair.emails.filter((_, j) => j !== emailIndex) } : pair
    ));
  };

  const removeUnitKerjaEmailPair = (index: number) => {
    setUnitKerjaEmailPairs(prev => prev.filter((_, i) => i !== index));
  };

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
        if (field.type === "unit-kerja-email") {
          const hasEmpty = unitKerjaEmailPairs.some(p => !p.unitKerja.trim() || p.emails.some(e => !e.trim()));
          if (hasEmpty || unitKerjaEmailPairs.length === 0) {
            newErrors[field.key] = "Setiap unit kerja harus memiliki email PIC";
          }
          continue;
        }
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
        if (f.type === "unit-kerja-email") {
          const formatted = unitKerjaEmailPairs
            .filter(p => p.unitKerja.trim() && p.emails.some(e => e.trim()))
            .map(p => `${p.unitKerja} (${p.emails.filter(e => e.trim()).join(", ")})`)
            .join(" || ");
          if (formatted) fields[f.label] = formatted;
          continue;
        }
        const val = values[f.key];
        if (val === undefined || val === false || val === "") continue;
        fields[f.label] = String(val);
      }
      const newDocs = config.fields
        .filter(f => f.type === "file" && values[f.key])
        .flatMap(f => {
          const docType = FILE_DOC_TYPE[f.key]?.(action) || "lainnya";
          if (f.multiple) {
            const fnames = (values[f.key] as string).split(", ").filter(Boolean);
            return fnames.map(name => ({
              id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name,
              type: docType as Document["type"],
              uploadedAt: now,
              uploadedBy: currentUser.name,
            }));
          }
          return [{
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `${f.label}_${now.toISOString().slice(0, 10)}.pdf`,
            type: docType as Document["type"],
            uploadedAt: now,
            uploadedBy: currentUser.name,
          }];
        });

      const newDocIds = newDocs.map(d => d.id);

      const updated: Contribution = {
        ...contribution,
        lastUpdate: now,
        dokumen: [...contribution.dokumen, ...newDocs],
        aktivitas: [
          ...contribution.aktivitas,
          {
            id: `a${Date.now()}`,
            timestamp: now,
            actor: currentUser.name,
            actorRole: currentUser.role,
            action: ACTION_LABELS[action],
            notes: values.notes as string | undefined,
            fields: {
              ...fields,
              ...(newDocIds.length > 0 ? { _docIds: newDocIds.join(",") } : {}),
            },
            fromState: contribution.workflowStatus,
            toState: config.toState ? contribution.workflowStatus : undefined,
          },
        ],
      };

      if (config.toState) updated.workflowStatus = config.toState;

      if (action === "lanjutkan-kontribusi" && values.emailPIC) {
        updated.pic = values.emailPIC as string;
      }

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
      <div className="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl max-h-[85vh]">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-5 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">{config.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-5 flex-1 min-h-0">
          {(() => {
            const renderedFields: React.ReactNode[] = [];
            for (let i = 0; i < config.fields.length; i++) {
              const field = config.fields[i];
              const nextField = config.fields[i + 1];
              const isDownloadPair = field.type === "download-template" && nextField?.type === "download-template";

              if (isDownloadPair) {
                renderedFields.push(
                  <div key={field.key} className="-mx-4 px-4 py-3 bg-gray-50 border-b border-gray-200 -mt-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = "#";
                            link.download = "Template_Rencana_Kerjasama.docx";
                            link.click();
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 truncate"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          {field.label.replace("Download", "Unduh")}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = "#";
                            link.download = "Template_Surat_Kuasa.docx";
                            link.click();
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 truncate"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          {nextField.label.replace("Download", "Unduh")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
                i++;
                continue;
              }

              if (field.inline && nextField?.inline) {
                const pairKey = field.key + "-" + nextField.key;
                const renderInline = (f: FieldConfig) => {
                  const selectOptions = f.key === "kabupaten"
                    ? (KABUPATEN_BY_PROVINSI[values.provinsi as string] || [])
                    : f.options || [];
                  const isSelectDisabled = f.key === "kabupaten" && !values.provinsi;
                  return (
                    <div key={f.key} className="min-w-0">
                      <label className="mb-1 block text-sm font-medium text-gray-600">
                        {f.label}
                        {f.required && <span className="ml-0.5 text-red-400">*</span>}
                      </label>
                      {f.type === "text" && (
                        <input
                          type="text"
                          value={(values[f.key] as string) || ""}
                          onChange={(e) => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                        />
                      )}
                      {f.type === "select" && (
                        <select
                          value={(values[f.key] as string) || ""}
                          onChange={(e) => {
                            set(f.key, e.target.value);
                            if (f.key === "provinsi") set("kabupaten", "");
                          }}
                          disabled={isSelectDisabled}
                          className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${values[f.key] ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        >
                          <option value="" disabled>
                            {isSelectDisabled ? "Pilih provinsi terlebih dahulu" : "Pilih..."}
                          </option>
                          {selectOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                      {errors[f.key] && (
                        <p className="mt-0.5 text-sm text-red-500">{errors[f.key]}</p>
                      )}
                    </div>
                  );
                };
                renderedFields.push(
                  <div key={pairKey} className="grid grid-cols-2 gap-x-4">
                    {renderInline(field)}
                    {renderInline(nextField)}
                  </div>
                );
                i++;
                continue;
              }

              renderedFields.push(
                <div key={field.key}>
                  {field.type !== "download-template" && field.type !== "section-header" && (
                    <label className="mb-1 block text-sm font-medium text-gray-600">
                      {field.label}
                      {field.required && <span className="ml-0.5 text-red-400">*</span>}
                    </label>
                  )}

                  {field.type === "download-template" && (
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = "#";
                        link.download = "Template_Rencana_Kerjasama.docx";
                        link.click();
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 truncate"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      {field.label.replace("Download", "Unduh")}
                    </button>
                  )}

                  {field.type === "section-header" && (
                    <div className="-mx-4 px-4 py-2 bg-gray-50 border-y border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">{field.label}</h4>
                    </div>
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      rows={3}
                      value={(values[field.key] as string) || ""}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-gray-400"
                    />
                  )}

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={(values[field.key] as string) || ""}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
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
                      className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${values[field.key] ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900`}
                    >
                      <option value="" disabled>Pilih...</option>
                      {field.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}

                  {field.type === "select-pic" && (
                    <select
                      value={(values[field.key] as string) || ""}
                      onChange={(e) => set(field.key, e.target.value)}
                      className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${values[field.key] ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900`}
                    >
                      <option value="" disabled>Pilih PIC...</option>
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
                      className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${values[field.key] ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900`}
                    >
                      <option value="" disabled>Pilih progress...</option>
                      {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                        <option key={p} value={String(p)}>{p}%</option>
                      ))}
                    </select>
                  )}

                   {field.type === "file" && !field.multiple && (
                     <div className={`flex items-center gap-2 rounded-md border border-dashed border-gray-200 ${values[field.key] ? 'bg-gray-50' : 'bg-white'} px-3 py-2.5`}>
                       <FileText className="h-3.5 w-3.5 text-gray-400" />
                       <span className="text-sm text-gray-400">
                         {values[field.key] ? (
                           <span className="text-sm text-gray-900">{values[field.key] as string}</span>
                         ) : (
                           "Format file PDF ukuran max 200kb"
                         )}
                       </span>
                       <button
                         onClick={() => set(field.key, `${field.label}_${Date.now()}.pdf`)}
                         className="ml-auto rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                       >
                         {values[field.key] ? "Ganti" : "Tambah Dokumen"}
                       </button>
                     </div>
                   )}

                  {field.type === "file" && field.multiple && (
                    <div className="space-y-2">
                      {(values[field.key] as string || "").split(", ").filter(Boolean).length > 0 && (
                        <div className="space-y-1.5">
                          {(values[field.key] as string || "").split(", ").filter(Boolean).map((fname, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="flex-1 truncate text-sm text-gray-900">{fname}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = (values[field.key] as string || "").split(", ").filter(Boolean);
                                  list.splice(i, 1);
                                  set(field.key, list.join(", "));
                                }}
                                className="ml-auto text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white px-3 py-2.5">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-400">Format file PDF ukuran max 200kb</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            const existing = (values[field.key] as string || "").split(", ").filter(Boolean);
                            for (const file of files) {
                              existing.push(file.name);
                            }
                            set(field.key, existing.join(", "));
                            e.target.value = "";
                          }}
                          className="hidden"
                          id={`file-input-${field.key}`}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-input-${field.key}`)?.click()}
                          className="ml-auto rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Tambah Dokumen
                        </button>
                      </div>
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
                            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
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

                  {field.type === "unit-kerja-email" && (
                    <div className="space-y-3">
                      {unitKerjaEmailPairs.map((pair, pairIndex) => {
                        const isDefault = pairIndex === 0;
                        const showText = isDefault || field.readonlyUnitKerja;
                        const usedUnitKerja = unitKerjaEmailPairs
                          .filter((_, i) => i !== pairIndex)
                          .map(p => p.unitKerja)
                          .filter(Boolean);
                        return (
                          <div key={pairIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <div className="mb-3">
                                  <p className="mb-1 text-xs font-medium text-gray-500">Unit Kerja</p>
                                  {showText ? (
                                    <p className="text-sm font-medium text-gray-700 uppercase">{pair.unitKerja}</p>
                                  ) : (
                                    <select
                                      value={pair.unitKerja}
                                      onChange={(e) => updateUnitKerja(pairIndex, e.target.value)}
                                      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 ${pair.unitKerja ? 'text-gray-900' : 'text-gray-400'} [&_option]:text-gray-900`}
                                    >
                                      <option value="" disabled>Pilih Unit Kerja...</option>
                                      {UNIT_KERJA_OPTIONS
                                        .filter(opt => !usedUnitKerja.includes(opt))
                                        .map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">{field.readonlyUnitKerja ? "Email Satuan Kerja" : "Email Sekretariat Unit Utama"}</p>
                                  <div className="space-y-1.5">
                                    {pair.emails.map((email, emailIndex) => (
                                      <div key={emailIndex} className="flex items-center gap-1.5">
                                        <input
                                          type="email"
                                          value={email}
                                          onChange={(e) => updateEmail(pairIndex, emailIndex, e.target.value)}
                                          placeholder={`Email PIC ${emailIndex + 1}`}
                                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                                        />
                                        {pair.emails.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeEmailFromPair(pairIndex, emailIndex)}
                                            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addEmailToPair(pairIndex)}
                                    className="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Tambah Email
                                  </button>
                                </div>
                              </div>
                              {unitKerjaEmailPairs.length > 1 && !isDefault && !field.readonlyUnitKerja && (
                                <button
                                  type="button"
                                  onClick={() => removeUnitKerjaEmailPair(pairIndex)}
                                  className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {!field.readonlyUnitKerja && (
                        <button
                          type="button"
                          onClick={addUnitKerjaEmailPair}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Tambah Unit Kerja
                        </button>
                      )}
                    </div>
                  )}

                  {field.type === "multi-email" && (
                    <div>
                      <textarea
                        rows={3}
                        value={(values[field.key] as string) || ""}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder || "pic1@pspb.go.id, pic2@pspb.go.id"}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-400">Pisahkan setiap email dengan koma</p>
                    </div>
                  )}

                  {errors[field.key] && (
                    <p className="mt-0.5 text-sm text-red-500">{errors[field.key]}</p>
                  )}
                </div>
              );
            }
            return renderedFields;
          })()}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 shrink-0">
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
