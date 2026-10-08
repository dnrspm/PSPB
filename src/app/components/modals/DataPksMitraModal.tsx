import { Fragment, useState } from "react";
import { Check, Info, Pencil, X } from "lucide-react";
import type { Contribution } from "../../types/contribution";
import { updateContribution } from "../../data/mockWorkspace";
import { BADAN_HUKUM_OPTIONS } from "../../lib/mitra";

interface DataPksMitraModalProps {
  contribution: Contribution;
  actorName: string;
  onClose: () => void;
}

const AKSI = "Isi Data PKS Mitra";
const KEY_PENYALUR = "Menggunakan lembaga penyalur?";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
  prefill?: (c: Contribution) => string;
  dependsOnPenyalur?: boolean;
}

interface SectionDef {
  title: string;
  stepLabel: string;
  fields: FieldDef[];
}

const join = (parts: (string | undefined | null)[]) =>
  parts.filter((p) => p && String(p).trim()).join(" - ");

const SECTIONS: SectionDef[] = [
  {
    title: "Identitas Mitra",
    stepLabel: "Identitas",
    fields: [
      {
        key: "Nama badan usaha/organisasi/lembaga",
        label: "Nama badan usaha/organisasi/lembaga",
        required: true,
        prefill: (c) => c.instansi || c.namaMitra,
      },
      {
        key: "Bentuk/status badan hukum",
        label: "Bentuk/status badan hukum",
        type: "select",
        options: BADAN_HUKUM_OPTIONS as unknown as string[],
        required: true,
        prefill: (c) => c.badanHukum || "",
      },
      {
        key: "No. & tanggal akta pendirian/perubahan",
        label: "No. & tanggal akta pendirian/perubahan",
        placeholder: "Contoh: Akta No. 123 tanggal 1 Januari 2020",
      },
      {
        key: "NIB/NPWP atau legalitas lainnya",
        label: "NIB/NPWP atau legalitas lainnya",
      },
      {
        key: "Alamat kedudukan",
        label: "Alamat kedudukan",
      },
      {
        key: "Website/email resmi",
        label: "Website/email resmi",
        prefill: (c) => c.email || "",
      },
      {
        key: "Nama & jabatan penandatangan PKS",
        label: "Nama & jabatan penandatangan PKS",
        prefill: (c) => join([c.narahubung, c.jabatan]),
      },
      {
        key: "Dasar kewenangan penandatangan",
        label: "Dasar kewenangan penandatangan",
        placeholder: "AD/ART, akta, surat kuasa, atau dokumen lainnya",
      },
    ],
  },
  {
    title: "Profil Kontribusi PSPB",
    stepLabel: "Kontribusi",
    fields: [
      {
        key: "Jenis Menu Paket Dukungan PSPB",
        label: "Jenis Menu Paket Dukungan PSPB",
        prefill: (c) => join([c.program, c.paketBantuan]),
      },
      {
        key: "Deskripsi singkat bantuan",
        label: "Deskripsi singkat bantuan",
        type: "textarea",
        full: true,
        prefill: (c) => c.infoTambahan || "",
      },
      {
        key: "Target penerima/wilayah sasaran",
        label: "Target penerima/wilayah sasaran",
        prefill: (c) => join([c.targetPenerima, c.wilayah]),
      },
      {
        key: "Periode atau jadwal pelaksanaan",
        label: "Periode atau jadwal pelaksanaan",
      },
    ],
  },
  {
    title: "Data Korespondensi",
    stepLabel: "Korespondensi",
    fields: [
      {
        key: "Nama institusi",
        label: "Nama institusi",
        prefill: (c) => c.instansi || c.namaMitra,
      },
      {
        key: "Nama PIC",
        label: "Nama PIC",
        prefill: (c) => c.narahubung || "",
      },
      {
        key: "Jabatan",
        label: "Jabatan",
        prefill: (c) => c.jabatan || "",
      },
      {
        key: "Alamat",
        label: "Alamat",
      },
      {
        key: "Nomor telepon",
        label: "Nomor telepon",
        prefill: (c) => c.kontak || "",
      },
      {
        key: "Email resmi",
        label: "Email resmi",
        prefill: (c) => c.email || "",
      },
      {
        key: "Email PIC",
        label: "Email PIC",
        prefill: (c) => (c.pic && c.pic.includes("@") ? c.pic : ""),
      },
    ],
  },
  {
    title: "Mekanisme Penyaluran",
    stepLabel: "Penyaluran",
    fields: [
      {
        key: "Disalurkan langsung oleh Mitra?",
        label: "Disalurkan langsung oleh Mitra?",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
      },
      {
        key: KEY_PENYALUR,
        label: "Menggunakan lembaga penyalur?",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
      },
      {
        key: "Nama lembaga penyalur",
        label: "Nama lembaga penyalur",
        dependsOnPenyalur: true,
      },
      {
        key: "Profil & legalitas penyalur",
        label: "Profil & legalitas penyalur",
        type: "textarea",
        full: true,
        dependsOnPenyalur: true,
      },
      {
        key: "PIC penyaluran",
        label: "PIC penyaluran",
        dependsOnPenyalur: true,
      },
    ],
  },
];

const STEP_LABELS = [...SECTIONS.map((s) => s.stepLabel), "Review"];
const REVIEW_STEP = SECTIONS.length;

function buildInitial(c: Contribution): Record<string, string> {
  const saved =
    [...c.aktivitas].reverse().find((a) => a.action === AKSI)?.fields ?? {};
  const base: Record<string, string> = {};
  for (const section of SECTIONS) {
    for (const f of section.fields) {
      base[f.key] = f.prefill ? f.prefill(c) : "";
    }
  }
  return { ...base, ...saved };
}

export function DataPksMitraModal({
  contribution,
  actorName,
  onClose,
}: DataPksMitraModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitial(contribution)
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const penyalurDisabled = values[KEY_PENYALUR] !== "Ya";
  const isReview = step === REVIEW_STEP;

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handleNext = () => {
    const nextErrors: Record<string, boolean> = {};
    for (const f of SECTIONS[step].fields) {
      if (f.required && !(values[f.key] ?? "").trim()) nextErrors[f.key] = true;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(REVIEW_STEP, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, boolean> = {};
    for (const section of SECTIONS) {
      for (const f of section.fields) {
        if (!f.required) continue;
        if (!(values[f.key] ?? "").trim()) nextErrors[f.key] = true;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const fields: Record<string, string> = {};
      for (const section of SECTIONS) {
        for (const f of section.fields) {
          if (f.dependsOnPenyalur && penyalurDisabled) continue;
          const value = (values[f.key] ?? "").trim();
          if (value) fields[f.key] = value;
        }
      }

      const now = new Date();
      const updated: Contribution = {
        ...contribution,
        lastUpdate: now,
        aktivitas: [
          ...contribution.aktivitas,
          {
            id: `pks${Date.now()}`,
            timestamp: now,
            actor: actorName,
            actorRole: "mitra",
            action: AKSI,
            notes: "Data PKS Mitra telah diisi",
            fields,
            fromState: contribution.workflowStatus,
          },
        ],
      };

      updateContribution(updated);
      setLoading(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[760px] max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-800">
            Isi Data PKS Mitra
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-y border-gray-100 bg-gray-50/60 px-6 py-3.5">
          {STEP_LABELS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <Fragment key={label}>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      done || active
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 bg-white text-gray-400"
                    } ${active ? "ring-4 ring-blue-100" : ""}`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-xs sm:block ${
                      active
                        ? "font-medium text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-px flex-1 rounded ${
                      done ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>

        <div
          key={step}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
        >
          {isReview ? (
            <div className="space-y-4">
              <p className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Dengan klik tombol simpan maka Anda akan mengenerate Draf PKS</span>
              </p>
              <p className="text-sm text-gray-500">
                Periksa kembali data berikut sebelum disimpan.
              </p>
              {SECTIONS.map((section, idx) => (
                <div
                  key={section.title}
                  className="overflow-hidden rounded-lg border border-gray-200/70"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {idx + 1}. {section.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStep(idx);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-5 p-4 sm:grid-cols-2">
                    {section.fields
                      .filter(
                        (f) => !(f.dependsOnPenyalur && penyalurDisabled)
                      )
                      .map((f) => (
                        <div key={f.key}>
                          <dt className="text-xs text-gray-400">{f.label}</dt>
                          <dd className="mt-0.5 text-sm break-words text-gray-800">
                            {(values[f.key] ?? "").trim() || "-"}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                {step + 1}. {SECTIONS[step].title}
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                {SECTIONS[step].fields.map((f) => {
                  const disabled = !!f.dependsOnPenyalur && penyalurDisabled;
                  const invalid = !!errors[f.key];
                  const inputClass =
                    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
                  return (
                    <div
                      key={f.key}
                      className={f.full ? "sm:col-span-2" : undefined}
                    >
                      <label className="mb-2 block whitespace-nowrap text-sm font-medium text-gray-600">
                        {f.label}
                        {f.required && (
                          <span className="ml-0.5 text-red-400">*</span>
                        )}
                      </label>
                      {f.type === "select" ? (
                        <select
                          value={values[f.key] ?? ""}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          disabled={disabled}
                          className={`${inputClass} bg-white ${
                            values[f.key] ? "text-gray-900" : "text-gray-400"
                          } [&_option]:text-gray-900`}
                        >
                          <option value="" disabled>
                            Pilih...
                          </option>
                          {f.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          value={values[f.key] ?? ""}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          disabled={disabled}
                          rows={3}
                          placeholder={f.placeholder}
                          className={`${inputClass} focus:ring-1 focus:ring-blue-100`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[f.key] ?? ""}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          disabled={disabled}
                          placeholder={f.placeholder}
                          className={inputClass}
                        />
                      )}
                      {invalid && (
                        <p className="mt-0.5 text-sm text-red-500">
                          Wajib diisi.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="rounded-md border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <div className="flex gap-2">
            {isReview ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Lanjut
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
