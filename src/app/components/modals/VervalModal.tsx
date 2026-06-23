import { useState } from "react";
import { X } from "lucide-react";
import type { Contribution, UserRole } from "../../types/contribution";
import { updateContribution } from "../../data/mockWorkspace";

interface VervalModalProps {
  contribution: Contribution;
  currentUser: { name: string; role: UserRole };
  onClose: () => void;
  onSuccess: () => void;
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

export function VervalModal({ contribution, currentUser, onClose, onSuccess }: VervalModalProps) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [radioSelected, setRadioSelected] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
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
                            className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                          />
                          <span className="text-sm text-gray-600">{el.label}</span>
                        </label>
                        {isChecked && (el.hasNotes || el.notesRequired) && (
                          <input
                            type="text"
                            value={notes[noteKey] || ""}
                            onChange={(e) => setNote(noteKey, e.target.value)}
                            placeholder={el.notesRequired ? "Isian wajib..." : "Isian penjelasan..."}
                            className="ml-6 w-full max-w-md rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
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
                          className="h-4 w-4 border-gray-300 accent-blue-600"
                        />
                        <span className="text-sm text-gray-600">{el.label}</span>
                      </label>
                      {isSelected && (el.hasNotes || el.notesRequired) && (
                        <input
                          type="text"
                          value={notes[noteKey] || ""}
                          onChange={(e) => setNote(noteKey, e.target.value)}
                          placeholder={el.notesRequired ? "Isian wajib..." : "Isian penjelasan..."}
                          className="ml-6 w-full max-w-md rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
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
