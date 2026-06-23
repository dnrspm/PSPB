import { useState } from "react";
import { X } from "lucide-react";
import type { Contribution, UserRole } from "../../types/contribution";
import { updateContribution } from "../../data/mockWorkspace";

interface VervalModalProps {
  contribution: Contribution;
  currentUser: { name: string; role: UserRole };
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
  initialFields?: Record<string, string>;
}

interface VervalElement {
  label: string;
  hasNotes?: boolean;
  notesRequired?: boolean;
}

interface VervalAspect {
  no: number;
  aspek: string;
  multiple?: boolean;
  elements: VervalElement[];
}

const VERVAL_ASPECTS: VervalAspect[] = [
  {
    no: 1,
    aspek: "Status Kerjasama Mitra",
    elements: [
      { label: "Mitra Baru Kemendikdasmen", hasNotes: true },
      { label: "Mitra Lama Kemendikdasmen", hasNotes: true },
    ],
  },
  {
    no: 2,
    aspek: "Legalitas dan Bentuk Kelembagaan Mitra",
    elements: [
      { label: "PT" },
      { label: "Yayasan" },
      { label: "BUMN" },
      { label: "BUMD" },
      { label: "Koperasi" },
      { label: "Perkumpulan Organisasi" },
      { label: "Lainnya" },
    ],
  },
  {
    no: 3,
    multiple: true,
    aspek: "Jenis Kontribusi",
    elements: [
      { label: "Barang" },
      { label: "Jasa/ Layanan" },
      { label: "Lainnya", notesRequired: true },
    ],
  },
  {
    no: 4,
    multiple: true,
    aspek: "Target Sasaran",
    elements: [
      { label: "Guru dan Tenaga Kependidikan" },
      { label: "Murid" },
      { label: "Sekolah" },
      { label: "Lainnya", notesRequired: true },
    ],
  },
  {
    no: 5,
    aspek: "Bentuk Kerjasama",
    elements: [
      { label: "Non Komersial" },
      { label: "Komersial" },
      { label: "Uji Coba/ Piloting" },
      { label: "Lainnya", notesRequired: true },
    ],
  },
  {
    no: 6,
    multiple: true,
    aspek: "Pilihan Kontribusi",
    elements: [
      { label: "Infrastruktur Digital" },
      { label: "Platform Digital" },
      { label: "Pelatihan GTK" },
      { label: "Bahan Ajar Digital" },
      { label: "Revitalisasi Satuan Pendidikan" },
      { label: "Beragam Dukungan Pendidikan", notesRequired: true },
    ],
  },
  {
    no: 7,
    multiple: true,
    aspek: "Bentuk Barter Value yang diharapkan",
    elements: [
      { label: "Pemanfaatan logo Kemendikdasmen" },
      { label: "Pelibatan event bersama Kemendikdasmen" },
      { label: "Lainnya", notesRequired: true },
    ],
  },
  {
    no: 8,
    aspek: "Keterlibatan Sponsor (Pihak Ketiga)",
    elements: [
      { label: "Ada Capaian, portofolio, atau referensi yang dapat diverifikasi", notesRequired: true },
      { label: "Tidak Ada" },
    ],
  },
  {
    no: 9,
    aspek: "Komitmen Mitra dalam Implementasi Kontribusi",
    elements: [
      { label: "Seluruh distribusi kontribusi dilakukan langsung" },
      { label: "Seluruh distribusi kontribusi dilakukan oleh Pihak lain" },
    ],
  },
  {
    no: 10,
    multiple: true,
    aspek: "Pemahaman dan Masukan",
    elements: [
      { label: "Mitra memahami program PSPB" },
      { label: "Masukan Mitra atas PSPB" },
    ],
  },
  {
    no: 11,
    multiple: true,
    aspek: "Reputasi dan Kredibilitas Mitra",
    elements: [
      { label: "Tahun berdiri Kelembagaan", notesRequired: true },
      { label: "Pengalaman mitra di sektor pendidikan", notesRequired: true },
      { label: "Program atau layanan apa yang pernah dijalankan", notesRequired: true },
      { label: "Capaian, portofolio, atau referensi yang dapat diverifikasi", notesRequired: true },
    ],
  },
  {
    no: 12,
    multiple: true,
    aspek: "Validasi Dokumen Pendukung",
    elements: [
      { label: "Ada profil Mitra" },
      { label: "Ada dokumen legalitas (lainnya sesuai Perundang-undangan)" },
      { label: "Ada dokumen proposal dan rencana kerja" },
      { label: "Ada surat pengajuan kerjasama" },
    ],
  },
];

function parseInitialState(fields: Record<string, string> = {}): {
  results: Record<string, boolean>;
  radioSelected: Record<string, string>;
  notes: Record<string, string>;
} {
  const results: Record<string, boolean> = {};
  const radioSelected: Record<string, string> = {};
  const notes: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (key.endsWith(' (Catatan)')) {
      const labelKey = key.replace(' (Catatan)', '');
      for (const aspect of VERVAL_ASPECTS) {
        for (const el of aspect.elements) {
          const fullLabel = `${aspect.no}. ${el.label}`;
          if (fullLabel === labelKey) {
            notes[`${aspect.no}-${el.label}-note`] = value;
          }
        }
      }
    } else if (value === "TRUE") {
      const match = key.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        const no = parseInt(match[1]);
        const label = match[2];
        const aspect = VERVAL_ASPECTS.find(a => a.no === no);
        if (aspect) {
          if (aspect.multiple) {
            results[`${no}-${label}`] = true;
          } else {
            radioSelected[String(no)] = label;
          }
        }
      }
    }
  }

  return { results, radioSelected, notes };
}

export function VervalModal({ contribution, currentUser, onClose, onSuccess, readOnly, initialFields }: VervalModalProps) {
  const initialState = readOnly && initialFields ? parseInitialState(initialFields) : null;
  const [results, setResults] = useState<Record<string, boolean>>(initialState?.results || {});
  const [radioSelected, setRadioSelected] = useState<Record<string, string>>(initialState?.radioSelected || {});
  const [notes, setNotes] = useState<Record<string, string>>(initialState?.notes || {});
  const [loading, setLoading] = useState(false);

  const setResult = (key: string, value: boolean) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  const setRadio = (aspectKey: string, label: string) => {
    setRadioSelected(prev => ({ ...prev, [aspectKey]: label }));
  };

  const setNote = (key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    setLoading(true);

    setTimeout(() => {
      const now = new Date();
      const fields: Record<string, string> = {};

      for (const aspect of VERVAL_ASPECTS) {
        if (aspect.multiple) {
          for (const el of aspect.elements) {
            const key = `${aspect.no}-${el.label}`;
            if (results[key]) {
              fields[`${aspect.no}. ${el.label}`] = "TRUE";
              const noteKey = `${aspect.no}-${el.label}-note`;
              if (notes[noteKey]?.trim()) {
                fields[`${aspect.no}. ${el.label} (Catatan)`] = notes[noteKey];
              }
            }
          }
        } else {
          const selectedLabel = radioSelected[String(aspect.no)];
          if (selectedLabel) {
            const el = aspect.elements.find(e => e.label === selectedLabel);
            fields[`${aspect.no}. ${selectedLabel}`] = "TRUE";
            if (el && (el.hasNotes || el.notesRequired)) {
              const noteKey = `${aspect.no}-${selectedLabel}-note`;
              if (notes[noteKey]?.trim()) {
                fields[`${aspect.no}. ${selectedLabel} (Catatan)`] = notes[noteKey];
              }
            }
          }
        }
      }

      const updated: Contribution = {
        ...contribution,
        lastUpdate: now,
        aktivitas: [
          ...contribution.aktivitas,
          {
            id: `v${Date.now()}`,
            timestamp: now,
            actor: currentUser.name,
            actorRole: currentUser.role,
            action: "Verifikasi dan Validasi",
            notes: "Form verifikasi dan validasi telah diisi",
            fields,
            fromState: contribution.workflowStatus,
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
      <div className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-5 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Verifikasi dan Validasi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-6 flex-1 min-h-0">
          {VERVAL_ASPECTS.map((aspect) => (
            <div key={aspect.no}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {aspect.no}. {aspect.aspek}
              </h3>
              <div className="space-y-3">
                {aspect.elements.map((el) => {
                  const key = `${aspect.no}-${el.label}`;
                  const noteKey = `${aspect.no}-${el.label}-note`;
                  const aspectKey = String(aspect.no);
                  if (aspect.multiple) {
                    const isChecked = results[key] === true;
                    return (
                      <div key={el.label} className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setResult(key, e.target.checked)}
                            disabled={readOnly}
                            className="appearance-none h-4 w-4 rounded border-2 border-gray-300 bg-white bg-center bg-no-repeat disabled:cursor-default disabled:bg-gray-100 disabled:border-gray-200 checked:border-blue-600 checked:bg-blue-600 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27white%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41L9%2016.17z%27%2F%3E%3C%2Fsvg%3E')] bg-[length:14px]"
                          />
                          <span className={`text-sm ${readOnly ? (isChecked ? 'text-gray-800 font-medium' : 'text-gray-400') : 'text-gray-600'}`}>{el.label}</span>
                        </label>
                        {isChecked && (el.hasNotes || el.notesRequired) && (
                          <input
                            type="text"
                            value={notes[noteKey] || ""}
                            onChange={(e) => setNote(noteKey, e.target.value)}
                            placeholder={el.notesRequired ? "Isian wajib..." : "Isian penjelasan..."}
                            readOnly={readOnly}
                            className="ml-6 w-full max-w-md rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400 read-only:bg-gray-50 read-only:text-gray-800 read-only:border-gray-300"
                          />
                        )}
                      </div>
                    );
                  }
                  const isSelected = radioSelected[aspectKey] === el.label;
                  return (
                    <div key={el.label} className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={aspectKey}
                            checked={isSelected}
                            onChange={() => setRadio(aspectKey, el.label)}
                            disabled={readOnly}
                            className="appearance-none h-4 w-4 rounded-full border-2 border-gray-300 bg-white disabled:cursor-default disabled:bg-gray-100 disabled:border-gray-200 checked:border-blue-600 checked:bg-[radial-gradient(circle,_#2563eb_45%,_#ffffff_46%)]"
                          />
                        <span className={`text-sm ${readOnly ? (isSelected ? 'text-gray-800 font-medium' : 'text-gray-400') : 'text-gray-600'}`}>{el.label}</span>
                      </label>
                      {isSelected && (el.hasNotes || el.notesRequired) && (
                        <input
                          type="text"
                          value={notes[noteKey] || ""}
                          onChange={(e) => setNote(noteKey, e.target.value)}
                          placeholder={el.notesRequired ? "Isian wajib..." : "Isian penjelasan..."}
                          readOnly={readOnly}
                          className="ml-6 w-full max-w-md rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400 read-only:bg-gray-50 read-only:text-gray-800 read-only:border-gray-300"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            {readOnly ? "Tutup" : "Batal"}
          </button>
          {!readOnly && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
