import { Fragment, useMemo, useState } from "react";
import { Check, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Contribution } from "../../types/contribution";
import { updateContribution } from "../../data/mockWorkspace";
import { BADAN_HUKUM_OPTIONS } from "../../lib/mitra";
import { cardDetails } from "../../data/cardDetails";

interface DataPksMitraModalProps {
  contribution: Contribution;
  /** Semua program dalam satu pengajuan; bila ada, step Kontribusi menampilkan tiap program. */
  contributions?: Contribution[];
  actorName: string;
  onClose: () => void;
}

const AKSI = "Isi Data PKS Mitra";
const KEY_PENYALUR = "Menggunakan lembaga penyalur?";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "checkboxes" | "date" | "number";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
  prefill?: (c: Contribution) => string;
  dependsOnPenyalur?: boolean;
  /** Judul sub-bagian (dipakai saat satu seksi memuat banyak kontribusi). */
  group?: string;
  /** Sub-judul segmen di dalam satu step (mis. "Ruang Lingkup Pendukung"). */
  subheading?: string;
  /** Id entri paket dukungan (2a) tempat field ini berada. */
  entryId?: string;
}

/** Satu entri paket dukungan di 2a; `c` terisi untuk yang berasal dari pengajuan. */
interface PaketEntry {
  id: string;
  c?: Contribution;
}

interface SectionDef {
  title: string;
  stepLabel: string;
  /** Judul khusus pada step (mis. "Ruang Lingkup Utama (PSPB)"); default "{nomor}. {title}". */
  heading?: string;
  fields: FieldDef[];
}

const join = (parts: (string | undefined | null)[]) =>
  parts.filter((p) => p && String(p).trim()).join(" - ");

/** Alamat demo bila belum ada data alamat sesungguhnya di kontribusi. */
const prefillAlamat = (c: Contribution) =>
  c.wilayah ? `Kantor Pusat, ${c.wilayah}` : "Kantor Pusat";

/** Pilihan ruang lingkup lain yang disepakati para pihak. */
const RUANG_LINGKUP_LAIN = [
  "Pengembangan kurikulum, perangkat ajar, dan sumber belajar, termasuk inovasi dan pengembangan model pembelajaran.",
  "Peningkatan kompetensi dan pengembangan talenta peserta didik, pendidik, dan tenaga kependidikan, termasuk pelatihan, pemagangan, dan sertifikasi.",
  "Pertukaran, integrasi, dan pemanfaatan data dan/atau informasi, termasuk pengembangan dan pemanfaatan teknologi digital.",
  "Penyediaan dan pemanfaatan sumber daya pendidikan, termasuk sarana, prasarana, teknologi, dan fasilitas pendukung.",
  "Penguatan tata kelola dan kemitraan pendidikan, termasuk koordinasi, fasilitasi, pemantauan, evaluasi, dan pelaporan pelaksanaan kerja sama.",
  "Pelaksanaan kegiatan lain yang disepakati PARA PIHAK dalam rangka mendukung peningkatan mutu dan kualitas pendidikan dasar dan menengah sesuai dengan tugas, fungsi, dan kewenangan masing-masing pihak.",
];

/** Paket dukungan yang tersedia di platform. */
const PAKET_DUKUNGAN_OPTIONS = cardDetails.map((d) => d.title);

/** Placeholder deskripsi bantuan per jenis paket dukungan. */
const PAKET_DUKUNGAN_PLACEHOLDERS: Record<string, string> = {
  "Infrastruktur Digital":
    "Penyediaan sarana dan prasarana fisik untuk ekosistem pembelajaran digital, seperti penyediaan listrik, penyediaan internet satelit, dan sistem elektronik.",
  "Pengembangan Platform Digital":
    "Pengembangan fungsi di Rumah Pendidikan mulai dari tahap perencanaan, pembangunan, dan pemeliharaan sistem serta fitur digital yang mendukung layanan pembelajaran.",
  "Pendampingan Pelatihan GTK":
    "Penyediaan materi dan pelatihan yang bertujuan untuk meningkatkan kompetensi pendidik.",
  "Bahan Ajar Digital":
    "Penyediaan sumber materi belajar digital untuk mendukung proses belajar murid.",
  "Revitalisasi Sekolah":
    "Penyediaan sarana dasar seperti rehabilitasi ruang, pembangunan unit sekolah baru, pembangunan ruang tambahan, dan pengadaan peralatan.",
  "Kebutuhan Pendidikan Lainnya":
    "Berbagai kebutuhan pendidikan, seperti kegiatan pendidikan, publikasi dan komunikasi, beasiswa, dan lainnya.",
};

/** Placeholder pilihan ruang lingkup lainnya (sementara). */
const RUANG_LINGKUP_LAINNYA = [
  "Ruang lingkup lainnya 1 (placeholder)",
  "Ruang lingkup lainnya 2 (placeholder)",
  "Ruang lingkup lainnya 3 (placeholder)",
];

const BASE_SECTIONS: SectionDef[] = [
  {
    title: "Identitas Mitra",
    stepLabel: "Identitas",
    fields: [
      {
        key: "Nama badan usaha/organisasi/lembaga",
        label: "Nama badan usaha/organisasi/lembaga",
        group: "Data Lembaga",
        required: true,
        full: true,
        prefill: (c) => c.instansi || c.namaMitra,
      },
      {
        key: "Bentuk/status badan hukum",
        label: "Bentuk/status badan hukum",
        group: "Data Lembaga",
        type: "select",
        options: BADAN_HUKUM_OPTIONS as unknown as string[],
        required: true,
        prefill: (c) => c.badanHukum || "",
      },
      {
        key: "NIB/NPWP atau legalitas lainnya",
        label: "NIB/NPWP atau legalitas lainnya",
        group: "Data Lembaga",
      },
      {
        key: "Alamat kedudukan",
        label: "Alamat kedudukan",
        group: "Data Lembaga",
        required: true,
        full: true,
        prefill: prefillAlamat,
      },
      {
        key: "Website/email resmi",
        label: "Website/email resmi",
        group: "Data Lembaga",
        full: true,
        prefill: (c) => c.email || "",
      },
      {
        key: "Nama notaris akta pendirian",
        label: "Nama notaris",
        group: "Akta Pendirian",
        required: true,
        prefill: () => "Siti Rahmawati, S.H., M.Kn.",
      },
      {
        key: "No. akta pendirian",
        label: "Nomor akta",
        group: "Akta Pendirian",
        placeholder: "Contoh: 123",
        required: true,
        prefill: () => "12",
      },
      {
        key: "Tanggal akta pendirian",
        label: "Tanggal akta",
        group: "Akta Pendirian",
        type: "date",
        required: true,
        prefill: () => "2015-03-10",
      },
      {
        key: "No. SK pengesahan pendirian",
        label: "Nomor SK pengesahan Menteri Hukum",
        group: "Akta Pendirian",
        placeholder: "Contoh: AHU-0012345.AH.01.01.Tahun 2020",
        required: true,
        prefill: () => "AHU-0012345.AH.01.01.Tahun 2015",
      },
      {
        key: "Nama notaris akta perubahan",
        label: "Nama notaris",
        group: "Akta Perubahan Terakhir (jika ada)",
      },
      {
        key: "No. akta perubahan",
        label: "Nomor akta",
        group: "Akta Perubahan Terakhir (jika ada)",
      },
      {
        key: "Tanggal akta perubahan",
        label: "Tanggal akta",
        group: "Akta Perubahan Terakhir (jika ada)",
        type: "date",
      },
      {
        key: "Tanggal persetujuan perubahan",
        label: "Tanggal persetujuan Menteri Hukum",
        group: "Akta Perubahan Terakhir (jika ada)",
        type: "date",
      },
      {
        key: "No. SK persetujuan perubahan",
        label: "Nomor SK persetujuan Menteri Hukum",
        group: "Akta Perubahan Terakhir (jika ada)",
        placeholder: "Contoh: AHU-AH.01.03-0123456",
        full: true,
      },
      {
        key: "Nama penandatangan PKS",
        label: "Nama penandatangan PKS",
        group: "Penandatangan PKS",
        placeholder: "Ketik nama penandatangan",
        required: true,
        prefill: (c) => c.narahubung || "",
      },
      {
        key: "Jabatan penandatangan PKS",
        label: "Jabatan penandatangan PKS",
        group: "Penandatangan PKS",
        placeholder: "Ketik jabatan penandatangan",
        required: true,
        prefill: (c) => c.jabatan || "",
      },
      {
        key: "Dasar kewenangan penandatangan",
        label: "Dasar penunjukan (Surat Keputusan)",
        group: "Penandatangan PKS",
        placeholder: "Nomor dan tanggal Surat Keputusan penunjukan",
        required: true,
        full: true,
        prefill: (c) =>
          `SK Penunjukan ${c.jabatan || "Pejabat"} No. 001/SK-Internal/${new Date(c.submissionDate).getFullYear()}`,
      },
    ],
  },
  {
    title: "Ruang Lingkup",
    stepLabel: "Ruang Lingkup",
    heading: "Ruang Lingkup Utama (PSPB)",
    fields: [
      {
        key: "Jenis Menu Paket Dukungan PSPB",
        label: "Paket Dukungan PSPB",
        full: true,
        prefill: (c) => c.program || "",
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
        group: "Data Institusi",
        required: true,
        full: true,
        prefill: (c) => c.instansi || c.namaMitra,
      },
      {
        key: "Alamat",
        label: "Alamat",
        group: "Data Institusi",
        required: true,
        full: true,
        prefill: prefillAlamat,
      },
      {
        key: "Nomor telepon",
        label: "Nomor telepon",
        group: "Data Institusi",
        required: true,
        prefill: (c) => c.kontak || "",
      },
      {
        key: "Email resmi",
        label: "Email resmi",
        group: "Data Institusi",
        required: true,
        prefill: (c) => c.email || "",
      },
      {
        key: "Nama PIC",
        label: "Nama PIC",
        group: "Narahubung (PIC)",
        required: true,
        prefill: (c) => c.narahubung || "",
      },
      {
        key: "Jabatan",
        label: "Jabatan",
        group: "Narahubung (PIC)",
        required: true,
        prefill: (c) => c.jabatan || "",
      },
      {
        key: "Email PIC",
        label: "Email PIC",
        group: "Narahubung (PIC)",
        required: true,
        full: true,
        prefill: (c) => (c.pic && c.pic.includes("@") ? c.pic : c.email || ""),
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
        group: "Mekanisme Penyaluran",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
        prefill: () => "Ya",
      },
      {
        key: KEY_PENYALUR,
        label: "Menggunakan lembaga penyalur?",
        group: "Mekanisme Penyaluran",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
        prefill: () => "Tidak",
      },
      {
        key: "Nama lembaga penyalur",
        label: "Nama lembaga penyalur",
        group: "Lembaga Penyalur",
        dependsOnPenyalur: true,
        required: true,
      },
      {
        key: "PIC penyaluran",
        label: "PIC penyaluran",
        group: "Lembaga Penyalur",
        dependsOnPenyalur: true,
        required: true,
      },
      {
        key: "Profil & legalitas penyalur",
        label: "Profil & legalitas penyalur",
        group: "Lembaga Penyalur",
        type: "textarea",
        full: true,
        dependsOnPenyalur: true,
        required: true,
      },
    ],
  },
];

const KONTRIBUSI_STEP = 1;

const STEP_LABELS = [...BASE_SECTIONS.map((s) => s.stepLabel), "Review"];

/** Satu set field "Profil Kontribusi" untuk tiap entri paket dukungan. */
function buildKontribusiFields(entries: PaketEntry[]): FieldDef[] {
  const multiple = entries.length > 1;
  const fields = entries.flatMap(({ id, c }, i): FieldDef[] => {
    const group = multiple ? `Paket Dukungan ${i + 1}` : undefined;
    return [
      {
        key: `${id}__jenis`,
        label: "Paket Dukungan PSPB",
        type: "select",
        options: PAKET_DUKUNGAN_OPTIONS,
        required: true,
        full: true,
        group,
        entryId: id,
        prefill: () => c?.program || "",
      },
      {
        key: `${id}__deskripsi`,
        label: "Deskripsi singkat bantuan",
        type: "textarea",
        required: true,
        full: true,
        group,
        entryId: id,
        prefill: () => c?.infoTambahan || "",
      },
    ];
  });
  fields.push({
    key: "ruangLingkupLain",
    label: "",
    type: "checkboxes",
    full: true,
    subheading: "Ruang Lingkup Pendukung",
    options: RUANG_LINGKUP_LAIN,
  });
  fields.push({
    key: "ruangLingkupLainnya",
    label: "",
    type: "checkboxes",
    full: true,
    subheading: "Ruang Lingkup Lainnya",
    options: RUANG_LINGKUP_LAINNYA,
  });
  fields.push({
    key: "jangkaWaktuTahun",
    label: "Jangka waktu (tahun)",
    type: "number",
    required: true,
    subheading: "Jangka Waktu Kerja Sama",
    placeholder: "Contoh: 3",
    prefill: () => "3",
  });
  return fields;
}

function buildSections(entries: PaketEntry[]): SectionDef[] {
  return BASE_SECTIONS.map((section, i) =>
    i === KONTRIBUSI_STEP
      ? { ...section, fields: buildKontribusiFields(entries) }
      : section,
  );
}

function buildInitial(
  sections: SectionDef[],
  c: Contribution,
): Record<string, string> {
  const saved =
    [...c.aktivitas].reverse().find((a) => a.action === AKSI)?.fields ?? {};
  const base: Record<string, string> = {};
  for (const section of sections) {
    for (const f of section.fields) {
      base[f.key] = f.prefill ? f.prefill(c) : "";
    }
  }
  return { ...base, ...saved };
}

export function DataPksMitraModal({
  contribution,
  contributions,
  actorName,
  onClose,
}: DataPksMitraModalProps) {
  const bantuanList = useMemo(
    () =>
      contributions && contributions.length > 0
        ? contributions
        : [contribution],
    [contributions, contribution],
  );
  const [entries, setEntries] = useState<PaketEntry[]>(() => {
    const base: PaketEntry[] = bantuanList.map((c) => ({ id: c.id, c }));
    const saved =
      [...contribution.aktivitas].reverse().find((a) => a.action === AKSI)
        ?.fields ?? {};
    for (const key of Object.keys(saved)) {
      const m = key.match(/^(.+)__jenis$/);
      if (m && !base.some((e) => e.id === m[1])) base.push({ id: m[1] });
    }
    return base;
  });
  const sections = useMemo(() => buildSections(entries), [entries]);
  const reviewStep = sections.length;
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitial(sections, contribution),
  );

  const addEntry = () =>
    setEntries((prev) => [...prev, { id: `paket${Date.now()}` }]);
  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));
  // Hanya PT Schneider Electric Indonesia (demo multi paket dalam satu pengajuan) yang boleh
  // menambah/menghapus paket dukungan di sini; mitra lain punya satu paket tetap per kontribusi
  // (tampilannya view-only / tidak bisa diubah).
  const entriesLocked = contribution.instansi !== "PT Schneider Electric Indonesia";
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const penyalurDisabled = values[KEY_PENYALUR] !== "Ya";
  const isReview = step === reviewStep;
  const isRequired = (f: FieldDef) =>
    !!f.required && !(f.dependsOnPenyalur && penyalurDisabled);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const toggleCheckbox = (key: string, option: string) => {
    setValues((prev) => {
      const items = (prev[key] ?? "").split(" || ").filter(Boolean);
      const idx = items.indexOf(option);
      if (idx >= 0) items.splice(idx, 1);
      else items.push(option);
      return { ...prev, [key]: items.join(" || ") };
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handleNext = () => {
    const nextErrors: Record<string, boolean> = {};
    for (const f of sections[step].fields) {
      if (isRequired(f) && !(values[f.key] ?? "").trim())
        nextErrors[f.key] = true;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(reviewStep, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, boolean> = {};
    for (const section of sections) {
      for (const f of section.fields) {
        if (!isRequired(f)) continue;
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
      for (const section of sections) {
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
            Isi Data Dokumen PKS
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
                      active ? "font-medium text-gray-900" : "text-gray-400"
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

        <div key={step} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {isReview ? (
            <div className="space-y-4">
              <p className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Setelah data disimpan, draf dokumen Perjanjian Kerja Sama
                  (PKS) akan terunduh secara otomatis ke perangkat Anda.
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Periksa kembali data berikut sebelum disimpan.
              </p>
              {sections.map((section, idx) => {
                const visible = section.fields.filter(
                  (f) => !(f.dependsOnPenyalur && penyalurDisabled),
                );
                const segs: { title?: string; fields: FieldDef[] }[] = [
                  { title: section.heading, fields: [] },
                ];
                for (const f of visible) {
                  const cur = segs[segs.length - 1];
                  if (f.subheading) {
                    segs.push({ title: f.subheading, fields: [f] });
                  } else if (
                    !section.heading &&
                    f.group &&
                    f.group !== cur.title
                  ) {
                    segs.push({ title: f.group, fields: [f] });
                  } else {
                    cur.fields.push(f);
                  }
                }
                const renderValue = (f: FieldDef) => {
                  const raw = (values[f.key] ?? "").trim();
                  if (f.type === "checkboxes") {
                    const items = raw
                      .split(" || ")
                      .map((x) => x.trim())
                      .filter(Boolean);
                    if (items.length === 0) return "-";
                    return (
                      <ul className="list-disc space-y-0.5 pl-4">
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (f.type === "number" && raw) return `${raw} tahun`;
                  return raw || "-";
                };
                return (
                  <div key={section.title}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-gray-800">
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
                    <div className="space-y-3">
                      {segs
                        .filter((seg) => seg.fields.length > 0)
                        .map((seg, si) => (
                          <div
                            key={seg.title ?? `seg-${si}`}
                            className="overflow-hidden rounded-lg border border-gray-200"
                          >
                            {seg.title && (
                              <div className="border-b border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800">
                                {seg.title}
                              </div>
                            )}
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
                              {seg.fields.map((f, fi, arr) =>
                                f.subheading ? (
                                  <dd
                                    key={f.key}
                                    className="text-sm break-words text-gray-800 sm:col-span-2"
                                  >
                                    {renderValue(f)}
                                  </dd>
                                ) : (
                                  <Fragment key={f.key}>
                                    {f.group &&
                                      f.group !== seg.title &&
                                      f.group !== arr[fi - 1]?.group && (
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">
                                          {f.group}
                                        </div>
                                      )}
                                    <div
                                      className={
                                        f.full ? "sm:col-span-2" : undefined
                                      }
                                    >
                                      <dt className="text-xs text-gray-400">
                                        {f.label}
                                      </dt>
                                      <dd className="mt-0.5 text-sm break-words text-gray-800">
                                        {renderValue(f)}
                                      </dd>
                                    </div>
                                  </Fragment>
                                ),
                              )}
                            </dl>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            (() => {
              const stepFields = sections[step].fields;
              const stepHeading =
                sections[step].heading ??
                `${step + 1}. ${sections[step].title}`;
              const hasSubheadings = stepFields.some((f) => f.subheading);

              const groupFields = (fields: FieldDef[]) => {
                const blocks: { group?: string; fields: FieldDef[] }[] = [];
                for (const f of fields) {
                  const last = blocks[blocks.length - 1];
                  if (last && last.group === f.group) last.fields.push(f);
                  else blocks.push({ group: f.group, fields: [f] });
                }
                return blocks;
              };

              const renderField = (
                f: FieldDef,
                i: number,
                arr: FieldDef[],
                showSubheading: boolean,
                suppressGroup = false,
              ) => {
                const isDeskripsiBantuan =
                  !!f.entryId && f.key.endsWith("__deskripsi");
                const disabled =
                  (!!f.dependsOnPenyalur && penyalurDisabled) ||
                  (!!f.entryId && entriesLocked && !isDeskripsiBantuan);
                const deskripsiPlaceholder = isDeskripsiBantuan
                  ? PAKET_DUKUNGAN_PLACEHOLDERS[
                      values[`${f.entryId}__jenis`] ?? ""
                    ]
                  : undefined;
                const invalid = !!errors[f.key];
                const showGroup =
                  !suppressGroup && !!f.group && f.group !== arr[i - 1]?.group;
                const inputClass =
                  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
                const fieldEl = (
                  <div
                    key={f.key}
                    className={f.full ? "sm:col-span-2" : undefined}
                  >
                    {showSubheading && f.subheading && (
                      <h4 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-700">
                        {f.subheading}
                      </h4>
                    )}
                    {f.label && (
                      <label className="mb-1.5 block whitespace-nowrap text-sm font-medium text-gray-600">
                        {f.label}
                        {isRequired(f) && (
                          <span className="ml-0.5 text-red-400">*</span>
                        )}
                      </label>
                    )}
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
                        {f.options
                          ?.filter(
                            (opt) =>
                              !f.entryId ||
                              opt === values[f.key] ||
                              !entries.some(
                                (e) => values[`${e.id}__jenis`] === opt,
                              ),
                          )
                          .map((opt) => (
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
                        placeholder={f.placeholder ?? deskripsiPlaceholder}
                        className={`${inputClass} focus:ring-1 focus:ring-blue-100`}
                      />
                    ) : f.type === "checkboxes" ? (
                      <div className="space-y-2.5">
                        {f.options?.map((opt) => {
                          const checked = (values[f.key] ?? "")
                            .split(" || ")
                            .includes(opt);
                          return (
                            <label
                              key={opt}
                              className="flex cursor-pointer items-start gap-2.5"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCheckbox(f.key, opt)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-600"
                              />
                              <span className="text-sm leading-relaxed text-gray-700">
                                {opt}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type={
                          f.type === "date" || f.type === "number"
                            ? f.type
                            : "text"
                        }
                        min={f.type === "number" ? 1 : undefined}
                        step={f.type === "number" ? 1 : undefined}
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
                if (!showGroup) return fieldEl;
                return (
                  <Fragment key={f.key}>
                    <div
                      className={`rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 sm:col-span-2 ${
                        i > 0 ? "mt-4" : ""
                      }`}
                    >
                      {f.group}
                    </div>
                    {fieldEl}
                  </Fragment>
                );
              };

              if (!hasSubheadings) {
                return (
                  <div>
                    {!stepFields.some((f) => f.group) && (
                      <h3 className="mb-4 text-sm font-semibold text-gray-700">
                        {stepHeading}
                      </h3>
                    )}
                    {stepFields.some((f) => f.group) ? (
                      <div className="space-y-4">
                        {groupFields(stepFields).map((block, bi) => (
                          <div
                            key={block.group ?? `blok-${bi}`}
                            className="overflow-hidden rounded-lg border border-gray-200"
                          >
                            {block.group && (
                              <div className="border-b border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800">
                                {block.group}
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
                              {block.fields.map((f, i, arr) =>
                                renderField(f, i, arr, false, true),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                        {stepFields.map((f, i, arr) =>
                          renderField(f, i, arr, true),
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              const segments: { heading: string; fields: FieldDef[] }[] = [];
              let segment = { heading: stepHeading, fields: [] as FieldDef[] };
              for (const f of stepFields) {
                if (f.subheading) {
                  segments.push(segment);
                  segment = { heading: f.subheading, fields: [f] };
                } else {
                  segment.fields.push(f);
                }
              }
              segments.push(segment);

              return (
                <div className="space-y-5">
                  {segments.map((seg, segIdx) => (
                    <div
                      key={seg.heading}
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      <div className="border-b border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800">
                        {seg.heading}
                      </div>
                      <div className="p-4">
                        {segIdx === 0 ? (
                          <div className="space-y-3">
                            {groupFields(seg.fields).map((block, bi) => (
                              <div
                                key={block.group ?? `blok-${bi}`}
                                className={
                                  block.group
                                    ? "overflow-hidden rounded-md border border-gray-200"
                                    : undefined
                                }
                              >
                                {block.group && (
                                  <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-100 px-4 py-2">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {block.group}
                                    </span>
                                    {block.fields[0]?.entryId && !entriesLocked && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeEntry(block.fields[0].entryId!)
                                        }
                                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div
                                  className={`grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 ${
                                    block.group ? "p-4" : ""
                                  }`}
                                >
                                  {block.fields.map((f, i, arr) =>
                                    renderField(f, i, arr, false, true),
                                  )}
                                </div>
                              </div>
                            ))}
                            {!entriesLocked &&
                              entries.length < PAKET_DUKUNGAN_OPTIONS.length && (
                                <button
                                  type="button"
                                  onClick={addEntry}
                                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
                                >
                                  <Plus className="h-4 w-4" />
                                  Tambah paket dukungan
                                </button>
                              )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                            {seg.fields.map((f, i, arr) =>
                              renderField(f, i, arr, false, true),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
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
