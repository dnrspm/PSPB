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
    aspek: "Jenis Kontribusi",
    elements: [
      { label: "Barang" },
      { label: "Jasa/ Layanan" },
      { label: "Lainnya", notesRequired: true },
    ],
  },
  {
    no: 4,
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
    aspek: "Pemahaman dan Masukan",
    elements: [
      { label: "Mitra memahami program PSPB" },
      { label: "Masukan Mitra atas PSPB" },
    ],
  },
  {
    no: 11,
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
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setResult = (key: string, value: boolean) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  const setNote = (key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    for (const aspect of VERVAL_ASPECTS) {
      for (const el of aspect.elements) {
        const key = `${aspect.no}-${el.label}`;
        if (results[key] === undefined) {
          return false;
        }
        if (el.notesRequired && results[key] && !notes[key]?.trim()) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);

    setTimeout(() => {
      const now = new Date();
      const fields: Record<string, string> = {};

      for (const aspect of VERVAL_ASPECTS) {
        for (const el of aspect.elements) {
          const key = `${aspect.no}-${el.label}`;
          fields[`${aspect.no}. ${el.label}`] = results[key] ? "TRUE" : "FALSE";
          if (el.hasNotes || el.notesRequired) {
            const noteKey = `${aspect.no}-${el.label}-note`;
            if (notes[noteKey]?.trim()) {
              fields[`${aspect.no}. ${el.label} (Catatan)`] = notes[noteKey];
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
                  const isChecked = results[key] === true;
                  const isFalse = results[key] === false;
                  return (
                    <div key={el.label} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-gray-600">{el.label}</span>
                        <button
                          type="button"
                          onClick={() => setResult(key, true)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                            isChecked
                              ? "bg-green-50 border-green-300 text-green-700"
                              : "bg-white border-gray-200 text-gray-400 hover:border-green-300"
                          }`}
                        >
                          TRUE
                        </button>
                        <button
                          type="button"
                          onClick={() => setResult(key, false)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                            isFalse
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-white border-gray-200 text-gray-400 hover:border-red-300"
                          }`}
                        >
                          FALSE
                        </button>
                      </div>
                      {(el.hasNotes || (el.notesRequired && isChecked)) && (
                        <input
                          type="text"
                          value={notes[noteKey] || ""}
                          onChange={(e) => setNote(noteKey, e.target.value)}
                          placeholder={
                            el.notesRequired
                              ? "Isian wajib..."
                              : "Isian penjelasan..."
                          }
                          className="ml-2 w-full max-w-md rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                        />
                      )}
                      {el.notesRequired && isChecked && !notes[noteKey]?.trim() && (
                        <p className="ml-2 text-xs text-red-400">Catatan wajib diisi</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {!validate() && (
            <p className="text-sm text-red-500 text-center">Semua elemen penilaian harus diisi TRUE / FALSE</p>
          )}
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
