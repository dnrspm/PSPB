import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

export interface DokumenPksItem {
  nama: string;
  oleh: string;
  tanggal: string;
  waktu: string;
}

const unduh = (nama: string) => {
  const link = document.createElement("a");
  link.href = "#";
  link.download = nama;
  link.click();
};

/** Daftar dokumen PKS; `items` berurutan dari yang terlama, yang terakhir ditampilkan paling atas dan disorot. */
export function DokumenPksList({ items }: { items: DokumenPksItem[] }) {
  const [open, setOpen] = useState(false);
  const ordered = [...items].reverse();
  const [latest, ...older] = ordered;
  if (!latest) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3.5">
        <span className="mb-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          Terbaru
        </span>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {latest.nama}
            </span>
            <p className="mt-0.5 text-xs text-gray-500">
              Digenerate oleh {latest.oleh} · {latest.tanggal} pukul{" "}
              {latest.waktu}
            </p>
          </div>
          <button
            type="button"
            onClick={() => unduh(latest.nama)}
            className="mt-0.5 shrink-0 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Lihat
          </button>
        </div>
      </div>

      {older.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mb-1.5 flex w-full items-center justify-between text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <span>Dokumen sebelumnya ({older.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3.5">
              {older.map((d) => (
                <div key={d.nama} className="flex items-start gap-3 py-2.5">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-900">
                      {d.nama}
                    </span>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Digenerate oleh {d.oleh} · {d.tanggal} pukul {d.waktu}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => unduh(d.nama)}
                    className="mt-0.5 shrink-0 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Lihat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
